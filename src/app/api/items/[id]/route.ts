import { NextRequest, NextResponse } from "next/server";
import { fetchItemById } from "@/services/square.service";
import { toApiError } from "@/lib/errors";
import type { ItemDetailResponse, ApiError } from "@/types";

/**
 * GET /api/items/:id
 *
 * Returns full item detail including modifiers.
 * Uses Square's retrieveCatalogObject with includeRelatedObjects=true
 * to avoid N+1 calls for images and modifier lists.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ItemDetailResponse | ApiError>> {
  const { id } = await params;

  if (!id || id.trim() === "") {
    return NextResponse.json({ error: "Item ID is required." }, { status: 400 });
  }

  // Basic format check — Square catalog IDs are alphanumeric + hyphens
  if (!/^[A-Za-z0-9_-]+$/.test(id) || id.length > 64) {
    return NextResponse.json({ error: "Invalid item ID." }, { status: 400 });
  }

  try {
    const locationId = _request.nextUrl.searchParams.get("locationId") ?? undefined;
    const item = await fetchItemById(id, locationId ?? undefined);

    if (!item) {
      return NextResponse.json({ error: "Item not found." }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (err) {
    const apiError = toApiError(err);
    console.error(`[GET /api/items/${id}]`, apiError);

    return NextResponse.json(
      { error: "Failed to load item. Please try again." },
      { status: 502 }
    );
  }
}
