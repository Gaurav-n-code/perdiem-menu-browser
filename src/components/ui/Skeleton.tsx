import clsx from "clsx";

interface SkeletonProps {
  className?: string;
}

/**
 * Animated placeholder shown while content is loading.
 * Using skeletons instead of spinners gives users a sense of
 * the layout they're waiting for — better perceived performance.
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={clsx(
        "animate-pulse rounded-md bg-stone-200",
        className
      )}
    />
  );
}

/** Pre-composed skeleton for a menu item card */
export function ItemCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-white">
      <Skeleton className="h-44 w-full rounded-none" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <div className="pt-2">
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
}

/** Pre-composed skeleton for the category filter bar */
export function CategoryFilterSkeleton() {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-24 shrink-0 rounded-full" />
      ))}
    </div>
  );
}

/** Pre-composed skeleton for the location selector */
export function LocationSelectorSkeleton() {
  return <Skeleton className="h-10 w-56 rounded-lg" />;
}
