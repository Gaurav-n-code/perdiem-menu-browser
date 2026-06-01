"use client";

import { MapPin } from "lucide-react";
import type { Location } from "@/types";

interface LocationSelectorProps {
  locations: Location[];
  selectedId: string;
  onChange: (locationId: string) => void;
  isLoading?: boolean;
}

/**
 * Dropdown for switching between locations.
 *
 * We use a native <select> here intentionally:
 *   - Accessible out of the box (keyboard nav, screen readers)
 *   - Native picker on mobile (no custom scroll implementation needed)
 *   - Zero JS for the interaction — just a controlled React value
 */
export function LocationSelector({
  locations,
  selectedId,
  onChange,
  isLoading = false,
}: LocationSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <MapPin className="h-4 w-4 shrink-0 text-brand-600" aria-hidden />
      <label htmlFor="location-select" className="sr-only">
        Select location
      </label>
      <select
        id="location-select"
        value={selectedId}
        onChange={(e) => onChange(e.target.value)}
        disabled={isLoading || locations.length === 0}
        className="
          rounded-lg border border-stone-300 bg-white px-3 py-2
          text-sm font-medium text-stone-800 shadow-sm
          focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500
          disabled:cursor-not-allowed disabled:opacity-50
          min-w-[180px]
        "
      >
        {locations.length === 0 && (
          <option value="">Loading locations…</option>
        )}
        {locations.map((loc) => (
          <option key={loc.id} value={loc.id}>
            {loc.name}
          </option>
        ))}
      </select>
    </div>
  );
}
