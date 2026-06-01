"use client";

import clsx from "clsx";
import type { Category } from "@/types";

interface CategoryFilterProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelect: (categoryId: string | null) => void;
}

/**
 * Horizontal scrollable row of pill buttons for category filtering.
 * "All" pill is always first; it clears the active filter.
 *
 * We use overflow-x-auto with -mb-2/pb-2 trick to hide the scrollbar
 * on most platforms while still allowing scroll on overflow.
 */
export function CategoryFilter({
  categories,
  selectedCategoryId,
  onSelect,
}: CategoryFilterProps) {
  return (
    <div
      className="flex gap-2 overflow-x-auto pb-2 -mb-2"
      role="group"
      aria-label="Filter by category"
    >
      {/* "All" pill */}
      <Pill
        label="All"
        isActive={selectedCategoryId === null}
        onClick={() => onSelect(null)}
      />

      {categories.map((cat) => (
        <Pill
          key={cat.id}
          label={cat.name}
          isActive={selectedCategoryId === cat.id}
          onClick={() => onSelect(cat.id)}
        />
      ))}
    </div>
  );
}

interface PillProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function Pill({ label, isActive, onClick }: PillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className={clsx(
        "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium",
        "transition-all duration-150 focus-visible:outline-none",
        "focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1",
        isActive
          ? "bg-brand-600 text-white shadow-sm"
          : "bg-white border border-stone-200 text-stone-600 hover:border-brand-300 hover:text-brand-700"
      )}
    >
      {label}
    </button>
  );
}
