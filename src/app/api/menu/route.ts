import { NextRequest, NextResponse } from "next/server";
import { fetchMenuForLocation } from "@/services/square.service";
import { toApiError } from "@/lib/errors";
import type { MenuResponse, ApiError } from "@/types";

/**
 * GET /api/menu?locationId=:id
 *
 * Returns catalog categories and items for a specific location.
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<MenuResponse | ApiError>> {
  const locationId = request.nextUrl.searchParams.get("locationId");

  // Input validation — reject missing or suspiciously long values
  if (!locationId || locationId.trim() === "") {
    return NextResponse.json(
      { error: "locationId query parameter is required." },
      { status: 400 }
    );
  }

  // Rough length guard — Square location IDs are ~16 chars.
  // Prevents very large strings from being forwarded to the SDK.
  if (locationId.length > 64) {
    return NextResponse.json(
      { error: "Invalid locationId." },
      { status: 400 }
    );
  }

  try {
    const { categories, items } = await fetchMenuForLocation(locationId);

    return NextResponse.json({ categories, items });
  } catch (err) {
    const apiError = toApiError(err);
    console.error("[GET /api/menu]", { locationId, error: apiError });

    return NextResponse.json(
      { error: "Failed to load menu. Please try again." },
      { status: 502 }
    );
  }
}
