// -------------------------------------------------------
// Domain types used across the entire application.
// These are OUR types — we map Square SDK shapes to these
// at the service boundary so the rest of the app never
// imports from the Square SDK directly.
// -------------------------------------------------------

// ------------------  Locations  ------------------------

export interface Location {
  id: string;
  name: string;
  /**
   * IANA timezone string, e.g. "America/New_York".
   * Required for time-of-day availability filtering.
   * Square always returns this for active locations.
   */
  timezone: string;
  address?: LocationAddress;
}

export interface LocationAddress {
  addressLine1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

// ------------------  Money  ----------------------------

/**
 * Square returns money in the smallest currency unit (cents).
 * We keep it as-is internally and format only at render time.
 */
export interface Money {
  /** Amount in cents */
  amount: number;
  /** ISO 4217 currency code, e.g. "USD" */
  currency: string;
}

// ------------------  Catalog / Menu  ------------------

export interface Category {
  id: string;
  name: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  /** URL of the primary image, or null if Square returned none */
  imageUrl: string | null;
  categoryId: string;
  categoryName: string;
  price: Money | null;
  /** Whether the item is available right now at the selected location */
  availableNow?: boolean;
  /**
   * Modifier lists attached to this item.
   * Populated on the detail endpoint; may be empty on list endpoint.
   */
  modifierLists: ModifierList[];
}

export interface ModifierList {
  id: string;
  name: string;
  /** "SINGLE" = radio, "MULTIPLE" = checkboxes */
  selectionType: "SINGLE" | "MULTIPLE";
  modifiers: Modifier[];
}

export interface Modifier {
  id: string;
  name: string;
  /** Additional price for this modifier, if any */
  priceDelta: Money | null;
}

// ------------------  API response shapes  -------------

export interface LocationsResponse {
  locations: Location[];
}

export interface MenuResponse {
  categories: Category[];
  items: MenuItem[];
}

export interface ItemDetailResponse extends MenuItem {
  // MenuItem already includes modifierLists; this alias makes
  // intent clear in route handler return types.
}

// ------------------  API error shape  -----------------

export interface ApiError {
  error: string;
  /** Square API error codes when applicable */
  squareErrors?: SquareErrorDetail[];
}

export interface SquareErrorDetail {
  category: string;
  code: string;
  detail?: string;
  field?: string;
}
