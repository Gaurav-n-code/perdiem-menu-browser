import { NextResponse } from "next/server";
import { fetchLocations } from "@/services/square.service";
import { toApiError } from "@/lib/errors";
import type { LocationsResponse, ApiError } from "@/types";

/**
 * GET /api/locations
 *
 * Returns all active locations for the configured Square merchant.
 * The Square access token lives only in process.env — it is never
 * included in the response.
 *
 * Cache strategy: revalidate every 5 minutes.
 * Location data changes rarely; this keeps latency low while
 * staying fresh for store hour / status changes.
 */
export const revalidate = 300; // seconds

export async function GET(): Promise<NextResponse<LocationsResponse | ApiError>> {
  try {
    const locations = await fetchLocations();

    return NextResponse.json({ locations });
  } catch (err) {
    const apiError = toApiError(err);
    console.error("[GET /api/locations]", apiError);

    // Don't expose internal error details to the client —
    // log them server-side and return a safe message.
    return NextResponse.json(
      { error: "Failed to load locations. Please try again." },
      { status: 502 }
    );
  }
}
