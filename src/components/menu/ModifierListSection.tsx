import { formatMoney, isZero } from "@/lib/money";
import type { ModifierList } from "@/types";

interface ModifierListSectionProps {
  modifierList: ModifierList;
}

/**
 * Renders a modifier list on the item detail page.
 * This is a display-only component (no cart integration in this scope).
 * With a cart feature, these would be interactive radio/checkbox inputs.
 *
 * selectionType influences the visual hint:
 *   SINGLE   → "Choose one" (would be radio buttons)
 *   MULTIPLE → "Choose any" (would be checkboxes)
 */
export function ModifierListSection({
  modifierList,
}: ModifierListSectionProps) {
  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-stone-800">{modifierList.name}</h3>
        <span className="rounded-full bg-stone-200 px-2.5 py-0.5 text-xs text-stone-600">
          {modifierList.selectionType === "SINGLE"
            ? "Choose one"
            : "Choose any"}
        </span>
      </div>

      <ul className="space-y-2" role="list">
        {modifierList.modifiers.map((modifier) => (
          <li
            key={modifier.id}
            className="flex items-center justify-between rounded-lg bg-white px-3 py-2.5 border border-stone-100"
          >
            <span className="text-sm text-stone-700">{modifier.name}</span>
            {modifier.priceDelta && !isZero(modifier.priceDelta) && (
              <span className="text-sm font-medium text-stone-500">
                +{formatMoney(modifier.priceDelta)}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
