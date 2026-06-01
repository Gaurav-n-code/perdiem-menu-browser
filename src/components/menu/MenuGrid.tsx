import { MenuItemCard } from "./MenuItemCard";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Category, MenuItem } from "@/types";

interface MenuGridProps {
  categories: Category[];
  items: MenuItem[];
  selectedCategoryId: string | null;
  locationId: string;
}

/**
 * Groups items by category and renders them in a responsive grid.
 *
 * When a category filter is active, only that category's section renders.
 * When "All" is selected (selectedCategoryId = null), all categories render
 * with section headings.
 *
 * Items with no category are shown in a catch-all "Other" section at the end.
 */
export function MenuGrid({
  categories,
  items,
  selectedCategoryId,
  locationId,
}: MenuGridProps) {
  // Build a map of categoryId → items for O(1) grouping
  const itemsByCategory = new Map<string, MenuItem[]>();

  for (const item of items) {
    const key = item.categoryId || "__uncategorized__";
    const existing = itemsByCategory.get(key) ?? [];
    existing.push(item);
    itemsByCategory.set(key, existing);
  }

  // Which categories to render depends on active filter
  const categoriesToRender: Array<{ id: string; name: string }> =
    selectedCategoryId
      ? categories
          .filter((c) => c.id === selectedCategoryId)
          .map((c) => ({ id: c.id, name: c.name }))
      : categories.map((c) => ({ id: c.id, name: c.name }));

  // Check if there are uncategorized items to show
  const uncategorizedItems = itemsByCategory.get("__uncategorized__") ?? [];
  const showUncategorized =
    selectedCategoryId === null && uncategorizedItems.length > 0;

  // Total visible item count to decide whether to show empty state
  const totalVisible = categoriesToRender.reduce((acc, cat) => {
    return acc + (itemsByCategory.get(cat.id)?.length ?? 0);
  }, 0) + (showUncategorized ? uncategorizedItems.length : 0);

  if (totalVisible === 0) {
    return (
      <EmptyState
        message="No items available"
        subMessage={
          selectedCategoryId
            ? "No items in this category at the selected location."
            : "This location has no items available right now."
        }
      />
    );
  }

  return (
    <div className="space-y-10">
      {categoriesToRender.map((cat) => {
        const catItems = itemsByCategory.get(cat.id) ?? [];
        if (catItems.length === 0) return null;

        return (
          <section key={cat.id} aria-labelledby={`category-${cat.id}`}>
            <h2
              id={`category-${cat.id}`}
              className="mb-4 text-lg font-bold text-stone-900 border-b border-stone-200 pb-2"
            >
              {cat.name}
            </h2>
            <ItemGrid items={catItems} locationId={locationId} />
          </section>
        );
      })}

      {showUncategorized && (
        <section aria-labelledby="category-uncategorized">
          <h2
            id="category-uncategorized"
            className="mb-4 text-lg font-bold text-stone-900 border-b border-stone-200 pb-2"
          >
            Other
          </h2>
          <ItemGrid items={uncategorizedItems} locationId={locationId} />
        </section>
      )}
    </div>
  );
}

function ItemGrid({
  items,
  locationId,
}: {
  items: MenuItem[];
  locationId: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <MenuItemCard key={item.id} item={item} locationId={locationId} />
      ))}
    </div>
  );
}
