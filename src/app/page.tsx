"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { LocationSelector } from "@/components/menu/LocationSelector";
import { CategoryFilter } from "@/components/menu/CategoryFilter";
import { MenuGrid } from "@/components/menu/MenuGrid";
import {
  ItemCardSkeleton,
  CategoryFilterSkeleton,
  LocationSelectorSkeleton,
} from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import type { Location, Category, MenuItem, LocationsResponse, MenuResponse } from "@/types";

/**
 * WHY THIS IS A CLIENT COMPONENT
 * --------------------------------
 * The entire menu experience is interactive:
 *   - Location switching triggers a new menu fetch
 *   - Category filter is stateful client-side
 * We could split the initial load into a Server Component, but the
 * location-dependent menu fetch needs client-side state anyway.
 * Keeping it client-side simplifies the data flow significantly.
 */
export default function HomePage() {
  // Locations state
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [locationsError, setLocationsError] = useState<string | null>(null);

  // Selected location
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");

  // Menu state
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [menuError, setMenuError] = useState<string | null>(null);

  // Category filter
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // -----------------------------------------------------------------
  //  Fetch locations on mount
  // -----------------------------------------------------------------
  const loadLocations = useCallback(async () => {
    setLocationsLoading(true);
    setLocationsError(null);

    try {
      const res = await fetch("/api/locations");

      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to load locations.");
      }

      const data = (await res.json()) as LocationsResponse;

      setLocations(data.locations);

      // Auto-select the first location
      if (data.locations.length > 0 && data.locations[0]) {
        setSelectedLocationId(data.locations[0].id);
      }
    } catch (err) {
      setLocationsError(
        err instanceof Error ? err.message : "Unable to load locations."
      );
    } finally {
      setLocationsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLocations();
  }, [loadLocations]);

  // -----------------------------------------------------------------
  //  Fetch menu when selected location changes
  // -----------------------------------------------------------------
  const loadMenu = useCallback(async (locationId: string) => {
    if (!locationId) return;

    setMenuLoading(true);
    setMenuError(null);
    // Reset category filter when switching locations — the new location
    // may have different categories and the old selection would confuse users.
    setSelectedCategoryId(null);

    try {
      const res = await fetch(
        `/api/menu?locationId=${encodeURIComponent(locationId)}`
      );

      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to load menu.");
      }

      const data = (await res.json()) as MenuResponse;
      setCategories(data.categories);
      setItems(data.items);
    } catch (err) {
      setMenuError(
        err instanceof Error ? err.message : "Unable to load menu."
      );
    } finally {
      setMenuLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedLocationId) {
      void loadMenu(selectedLocationId);
    }
  }, [selectedLocationId, loadMenu]);

  // -----------------------------------------------------------------
  //  Render
  // -----------------------------------------------------------------
  return (
    <div className="min-h-screen bg-stone-50">
      <Header
        right={
          locationsLoading ? (
            <LocationSelectorSkeleton />
          ) : locationsError ? null : (
            <LocationSelector
              locations={locations}
              selectedId={selectedLocationId}
              onChange={(id) => setSelectedLocationId(id)}
            />
          )
        }
      />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-stone-900 sm:text-3xl">
            Our Menu
          </h1>
          {selectedLocationId && locations.length > 0 && (
            <p className="mt-1 text-sm text-stone-500">
              Showing items available at{" "}
              <span className="font-medium text-stone-700">
                {locations.find((l) => l.id === selectedLocationId)?.name ??
                  "your selected location"}
              </span>
            </p>
          )}
        </div>

        {/* Locations error — shown in the main area, not just the header */}
        {locationsError && (
          <ErrorState
            message={locationsError}
            onRetry={() => void loadLocations()}
          />
        )}

        {/* Category filter */}
        {!menuLoading && !menuError && categories.length > 0 && (
          <div className="mb-6">
            <CategoryFilter
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              onSelect={setSelectedCategoryId}
            />
          </div>
        )}

        {menuLoading && (
          <>
            <div className="mb-6">
              <CategoryFilterSkeleton />
            </div>
            <p className="sr-only" aria-live="polite">
              Loading menu…
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <ItemCardSkeleton key={i} />
              ))}
            </div>
          </>
        )}

        {menuError && !menuLoading && (
          <ErrorState
            message={menuError}
            onRetry={() => void loadMenu(selectedLocationId)}
          />
        )}

        {!menuLoading && !menuError && (
          <MenuGrid
            categories={categories}
            items={items}
            selectedCategoryId={selectedCategoryId}
            locationId={selectedLocationId}
          />
        )}
      </main>
    </div>
  );
}
