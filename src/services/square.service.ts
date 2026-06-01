// Square service layer: map raw Square catalog data into app-friendly menu types.

import type {
  Location,
  Category,
  MenuItem,
  Modifier,
  ModifierList,
  Money,
} from "@/types";

function getSquareBaseUrl(): string {
  return process.env.SQUARE_ENVIRONMENT === "production"
    ? "https://connect.squareup.com"
    : "https://connect.squareupsandbox.com";
}

function getSquareHeaders(): Record<string, string> {
  const token = process.env.SQUARE_ACCESS_TOKEN;
  if (!token) {
    throw new Error("SQUARE_ACCESS_TOKEN is not set. Copy .env.example to .env.local and fill in your sandbox credentials.");
  }

  return {
    Authorization: `Bearer ${token}`,
    "Square-Version": process.env.SQUARE_API_VERSION || "2024-11-20",
    "Content-Type": "application/json",
  };
}

async function fetchSquare<T = unknown>(path: string): Promise<T> {
  const url = `${getSquareBaseUrl()}${path}`;
  const res = await fetch(url, {
    headers: getSquareHeaders(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Square ${path} failed: ${res.status} ${text}`);
  }

  return res.json();
}

// ----------------------------------------------------------------
//  Locations
// ----------------------------------------------------------------

/**
 * Fetch all ACTIVE locations for the merchant.
 * Inactive / deleted locations are filtered out — they can't accept orders.
 */
export async function fetchLocations(): Promise<Location[]> {
  const body = await fetchSquare<{ locations?: Array<any> }>("/v2/locations");
  const locations = body.locations ?? [];

  return locations
    .filter((loc) => loc.status === "ACTIVE")
    .map((loc) => {
      const location: Location = {
        id: loc.id ?? "",
        name: loc.name ?? "Unnamed location",
        timezone: loc.timezone ?? "America/New_York",
        ...(loc.address
          ? {
              address: {
                addressLine1: loc.address.addressLine1 ?? undefined,
                city: loc.address.locality ?? undefined,
                state: loc.address.administrativeDistrictLevel1 ?? undefined,
                postalCode: loc.address.postalCode ?? undefined,
                country: loc.address.country ?? undefined,
              },
            }
          : {}),
      };

      return location;
    })
    .filter((loc) => loc.id !== "");
}

// ----------------------------------------------------------------
//  Catalog helpers
// ----------------------------------------------------------------

/**
 * Fetch ALL catalog objects of the given types, following pagination cursors.
 * Square caps list responses at 200 objects; we page through all of them.
 */
async function fetchAllCatalogObjects(types: string[]): Promise<Array<any>> {
  const objects: Array<any> = [];
  let cursor: string | undefined;

  do {
    const query = new URLSearchParams({
      types: types.join(","),
      ...(cursor ? { cursor } : {}),
    });

    const response = await fetchSquare<{ objects?: Array<any>; cursor?: string }>(
      `/v2/catalog/list?${query.toString()}`
    );

    const page = response.objects ?? [];
    objects.push(...page);
    cursor = response.cursor ?? undefined;
  } while (cursor);

  return objects;
}

/**
 * Map a Square CatalogObject (type=IMAGE) or a URL string to a plain URL.
 * We pass the image objects map so we can look up by id.
 */
function resolveImageUrl(
  imageIds: string[] | undefined,
  imageObjectsById: Map<string, any>
): string | null {
  if (!imageIds || imageIds.length === 0) return null;

  // Use the first image only; detail view could show all of them
  const firstId = imageIds[0];
  if (!firstId) return null;

  const imageObj = imageObjectsById.get(firstId);
  // Square REST sometimes uses snake_case (image_data) or camelCase (imageData).
  return (
    imageObj?.imageData?.url ?? imageObj?.image_data?.url ?? imageObj?.imageUrl ?? imageObj?.image_url ?? null
  );
}

/**
 * Map a Square CatalogModifierList object to our ModifierList type.
 */
function mapModifierList(
  obj: any,
  modifierObjectsById: Map<string, any>
): ModifierList | null {
  if (obj.type !== "MODIFIER_LIST" || !obj.modifier_list_data) return null;

  const data = obj.modifier_list_data as any;
  const modifiers: Modifier[] = [];

  for (const modifierId of data.modifiers ?? []) {
    // modifierId here is actually a CatalogObject — Square embeds them
    // We need to look up from our map by the embedded object's id.
    const modObj =
      typeof modifierId === "string"
        ? modifierObjectsById.get(modifierId)
        : modifierId;

    if (!modObj || modObj.type !== "MODIFIER" || !modObj.modifier_data) continue;

    const modData = modObj.modifier_data as any;

    modifiers.push({
      id: modObj.id ?? "",
      name: modData.name ?? "Unnamed modifier",
      priceDelta:
        modData.price_money?.amount !== undefined
          ? {
              amount: Number(modData.price_money.amount),
              currency: modData.price_money.currency ?? "USD",
            }
          : null,
    });
  }

  const selectionType =
    data.selection_type === "SINGLE" ? "SINGLE" : "MULTIPLE";

  return {
    id: obj.id ?? "",
    name: data.name ?? "Options",
    selectionType,
    modifiers,
  };
}

function getItemCategoryId(itemData: any): string {
  return itemData.category_id ?? itemData.categories?.[0]?.id ?? "";
}

// ----------------------------------------------------------------
//  Main menu fetch
// ----------------------------------------------------------------

export async function fetchMenuForLocation(locationId: string): Promise<{
  categories: Category[];
  items: MenuItem[];
}> {
  // Fetch items, categories, and images in one pass.
  // MODIFIER_LIST is included so we can resolve modifiers without extra calls.
  const allObjects = await fetchAllCatalogObjects([
    "ITEM",
    "CATEGORY",
    "IMAGE",
    "MODIFIER_LIST",
    "MODIFIER",
  ]);

  // Build lookup maps — O(1) access later
  const imageObjectsById = new Map<string, any>();
  const categoryObjectsById = new Map<string, any>();
  const modifierListById = new Map<string, any>();

  for (const obj of allObjects) {
    if (!obj.id) continue;
    if (obj.type === "IMAGE") imageObjectsById.set(obj.id, obj);
    if (obj.type === "CATEGORY") categoryObjectsById.set(obj.id, obj);
    if (obj.type === "MODIFIER_LIST") modifierListById.set(obj.id, obj);
  }

  // Map categories
  const categories: Category[] = [];
  for (const obj of allObjects) {
    if (obj.type !== "CATEGORY" || !obj.id || !obj.category_data) continue;

    const catData = obj.category_data as any;

    categories.push({
      id: obj.id,
      name: catData.name ?? "Uncategorized",
    });
  }

  // Map items, filtering by location
  const items: MenuItem[] = [];

  for (const obj of allObjects) {
    if (obj.type !== "ITEM" || !obj.id || !obj.item_data) continue;

    // ------ Location availability check ------
    // Square's fields use BigInt for some IDs in the SDK but strings in practice.
    // We normalise to string comparisons throughout.
    const presentAtAll = obj.present_at_all_locations ?? true;
    const presentAtIds = (obj.present_at_location_ids ?? []).map(String);
    const absentAtIds = (obj.absent_at_location_ids ?? []).map(String);

    const availableHere = presentAtAll
      ? !absentAtIds.includes(locationId)
      : presentAtIds.includes(locationId);

    if (!availableHere) continue;

    const itemData = obj.item_data as any;

    // Resolve category
    const categoryId = getItemCategoryId(itemData);
    const categoryObj = categoryId
      ? categoryObjectsById.get(categoryId)
      : undefined;
    const categoryName = categoryObj?.category_data?.name ?? "Uncategorized";

    // Price: use the first variation's price as the display price.
    // Items with multiple variations (sizes, etc.) would ideally show a range —
    // for this scope we show "from $X" using the cheapest variation.
    const price = extractLowestPrice(itemData.variations ?? []);

    // Images
    const imageUrl = resolveImageUrl(
      itemData.image_ids ?? [],
      imageObjectsById
    );

    // Modifiers
    const modifierLists: ModifierList[] = [];
    for (const mlInfo of itemData.modifier_list_info ?? []) {
      if (!mlInfo.modifier_list_id) continue;
      const mlObj = modifierListById.get(mlInfo.modifier_list_id);
      if (!mlObj) continue;
      const mapped = mapModifierList(mlObj, new Map()); // modifiers embedded in list
      if (mapped) modifierLists.push(mapped);
    }

    items.push({
      id: obj.id,
      name: itemData.name ?? "Unnamed item",
      description: itemData.description ?? "",
      imageUrl,
      categoryId,
      categoryName,
      price,
      modifierLists,
    });
  }

  return { categories, items };
}

/**
 * Extract the lowest price across all variations.
 * Returns null if no variation has a price (e.g. price set at order time).
 */
function extractLowestPrice(
  variations: Array<any>
): Money | null {
  let lowestCents: number | null = null;
  let currency = "USD";

  for (const variation of variations) {
    if (variation.type !== "ITEM_VARIATION" || !variation.item_variation_data)
      continue;

    const varData = variation.item_variation_data as any;
    if (varData.price_money?.amount === undefined) continue;

    const cents = Number(varData.price_money.amount);
    currency = varData.price_money.currency ?? "USD";

    if (lowestCents === null || cents < lowestCents) {
      lowestCents = cents;
    }
  }

  return lowestCents !== null ? { amount: lowestCents, currency } : null;
}

// ----------------------------------------------------------------
//  Item detail
// ----------------------------------------------------------------


export async function fetchItemById(
  itemId: string
): Promise<MenuItem | null> {
  try {
    const response = await fetchSquare<{
      object?: any;
      related_objects?: Array<any>;
    }>(`/v2/catalog/object?id=${encodeURIComponent(itemId)}&include_related_objects=true`);

    const obj = response.object;
    if (obj && obj.type === "ITEM" && obj.id && obj.item_data) {
      const relatedObjects = response.related_objects ?? [];

      // Build local lookup maps from the related objects
      const imageObjectsById = new Map<string, any>();
      const modifierListById = new Map<string, any>();
      const categoryObjectsById = new Map<string, any>();

      for (const rel of relatedObjects) {
        if (!rel.id) continue;
        if (rel.type === "IMAGE") imageObjectsById.set(rel.id, rel);
        if (rel.type === "MODIFIER_LIST") modifierListById.set(rel.id, rel);
        if (rel.type === "CATEGORY") categoryObjectsById.set(rel.id, rel);
      }

      const itemData = obj.item_data as any;
      const categoryId = getItemCategoryId(itemData);
      const categoryObj = categoryId ? categoryObjectsById.get(categoryId) : undefined;
      const categoryName = categoryObj?.category_data?.name ?? "Uncategorized";
      const price = extractLowestPrice(itemData.variations ?? []);
      const imageUrl = resolveImageUrl(itemData.image_ids ?? [], imageObjectsById);

      const modifierLists: ModifierList[] = [];
      for (const mlInfo of itemData.modifier_list_info ?? []) {
        if (!mlInfo.modifier_list_id) continue;
        const mlObj = modifierListById.get(mlInfo.modifier_list_id);
        if (!mlObj) continue;
        const mapped = mapModifierList(mlObj, modifierListById);
        if (mapped) modifierLists.push(mapped);
      }

      return {
        id: obj.id,
        name: itemData.name ?? "Unnamed item",
        description: itemData.description ?? "",
        imageUrl,
        categoryId,
        categoryName,
        price,
        modifierLists,
      };
    }
  } catch (err: any) {
    // If Square returns not found for retrieve, we'll fall back to catalog.list
    const msg = String(err?.message ?? err);
    if (!/NOT_FOUND|404/.test(msg)) {
      throw err;
    }
  }

  // Fallback: fetch full catalog and assemble the item from returned objects
  const allObjects = await fetchAllCatalogObjects(["ITEM", "CATEGORY", "IMAGE", "MODIFIER_LIST", "MODIFIER"]);

  const obj = allObjects.find((o) => o.id === itemId && o.type === "ITEM");
  if (!obj || !obj.item_data) return null;

  // Build lookup maps from the full list
  const imageObjectsById = new Map<string, any>();
  const modifierListById = new Map<string, any>();
  const categoryObjectsById = new Map<string, any>();

  for (const o of allObjects) {
    if (!o.id) continue;
    if (o.type === "IMAGE") imageObjectsById.set(o.id, o);
    if (o.type === "MODIFIER_LIST") modifierListById.set(o.id, o);
    if (o.type === "CATEGORY") categoryObjectsById.set(o.id, o);
  }

  const itemData = obj.item_data as any;
  const categoryId = getItemCategoryId(itemData);
  const categoryObj = categoryId ? categoryObjectsById.get(categoryId) : undefined;
  const categoryName = categoryObj?.category_data?.name ?? "Uncategorized";
  const price = extractLowestPrice(itemData.variations ?? []);
  const imageUrl = resolveImageUrl(itemData.image_ids ?? [], imageObjectsById);

  const modifierLists: ModifierList[] = [];
  for (const mlInfo of itemData.modifier_list_info ?? []) {
    if (!mlInfo.modifier_list_id) continue;
    const mlObj = modifierListById.get(mlInfo.modifier_list_id);
    if (!mlObj) continue;
    const mapped = mapModifierList(mlObj, modifierListById);
    if (mapped) modifierLists.push(mapped);
  }

  return {
    id: obj.id,
    name: itemData.name ?? "Unnamed item",
    description: itemData.description ?? "",
    imageUrl,
    categoryId,
    categoryName,
    price,
    modifierLists,
  };
}
