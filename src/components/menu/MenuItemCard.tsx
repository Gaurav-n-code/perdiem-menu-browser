import Image from "next/image";
import Link from "next/link";
import { formatMoney } from "@/lib/money";
import type { MenuItem } from "@/types";

interface MenuItemCardProps {
  item: MenuItem;
  locationId: string;
}

/**
 * Card component for a single menu item in the grid.
 *
 * Links to the detail page, passing locationId so the detail page
 * can show accurate pricing and navigate back to the right location.
 *
 * Image: we use next/image for automatic WebP conversion and lazy loading.
 * When no image is available we show a branded placeholder.
 */
export function MenuItemCard({ item, locationId }: MenuItemCardProps) {
  const href = `/items/${item.id}?locationId=${locationId}`;
  return (
    <Link
      href={href}
      className={
        `group flex flex-col overflow-hidden rounded-xl border border-stone-200
        bg-white shadow-sm transition-all duration-200
        hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-none
        focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2
        animate-fade-in` + (item.availableNow === false ? " opacity-70" : "")
      }
    >
      {/* Image area */}
      <div className="relative h-44 w-full overflow-hidden bg-stone-100">
        {item.availableNow === false && (
          <div className="absolute top-3 right-3 z-20 rounded-full bg-stone-900 text-white px-2 py-0.5 text-xs font-semibold">
            Unavailable
          </div>
        )}
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <PlaceholderImage name={item.name} />
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-semibold text-stone-900 line-clamp-1 group-hover:text-brand-700 transition-colors">
          {item.name}
        </h3>

        {item.description && (
          <p className="mt-1 text-sm text-stone-500 line-clamp-2 flex-1">
            {item.description}
          </p>
        )}

        <div className="mt-3 flex items-center justify-between">
          {item.price ? (
            <span className="text-sm font-semibold text-brand-700">
              {formatMoney(item.price)}
            </span>
          ) : (
            <span className="text-sm text-stone-400">Price varies</span>
          )}

          {item.modifierLists.length > 0 && (
            <span className="text-xs text-stone-400">Customizable</span>
          )}
        </div>
      </div>
    </Link>
  );
}

/**
 * Simple branded placeholder when an item has no image.
 * Uses the item name's first character as a visual anchor.
 */
function PlaceholderImage({ name }: { name: string }) {
  const initial = name.charAt(0).toUpperCase();
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100">
      <span className="text-4xl font-bold text-brand-300" aria-hidden>
        {initial}
      </span>
    </div>
  );
}
