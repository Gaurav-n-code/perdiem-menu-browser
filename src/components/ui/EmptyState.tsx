import { UtensilsCrossed } from "lucide-react";

interface EmptyStateProps {
  message?: string;
  subMessage?: string;
}

/**
 * Shown when a location or category has no available items.
 * Friendly wording avoids making the user feel like something broke.
 */
export function EmptyState({
  message = "No items available",
  subMessage = "Try a different category or location.",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-stone-200 bg-white px-6 py-16 text-center">
      <UtensilsCrossed className="h-10 w-10 text-stone-300" aria-hidden />
      <div>
        <p className="font-semibold text-stone-600">{message}</p>
        <p className="mt-1 text-sm text-stone-400">{subMessage}</p>
      </div>
    </div>
  );
}
