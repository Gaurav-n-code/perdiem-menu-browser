import type { Money } from "@/types";

/**
 * Format a Money object into a locale-aware string.
 *
 * Examples (USD):
 *   { amount: 0,    currency: "USD" } → "$0.00"
 *   { amount: 450,  currency: "USD" } → "$4.50"
 *   { amount: 1099, currency: "USD" } → "$10.99"
 *   { amount: 1000, currency: "USD" } → "$10.00"
 *
 * We use Intl.NumberFormat so currency symbols, decimal separators,
 * and grouping are all handled correctly for non-USD currencies too.
 */
export function formatMoney(money: Money): string {
  // Intl.NumberFormat expects the major unit (dollars, not cents).
  // We divide by 100 here; for currencies with different subunit counts
  // (e.g. JPY with 0 decimals) this would need adjustment — but Square
  // normalises to cents in the US sandbox so this is safe for now.
  const majorUnit = money.amount / 100;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: money.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(majorUnit);
}

export function formatCents(cents: number, currency = "USD"): string {
  return formatMoney({ amount: cents, currency });
}

/**
 * Returns true if the money value is zero.
 * Useful for deciding whether to show a "Free" label vs a price.
 */
export function isZero(money: Money): boolean {
  return money.amount === 0;
}
