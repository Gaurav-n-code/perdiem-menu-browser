import { formatMoney, formatCents, isZero } from "@/lib/money";
import type { Money } from "@/types";

describe("formatMoney", () => {
  it("formats zero cents as $0.00", () => {
    const money: Money = { amount: 0, currency: "USD" };
    expect(formatMoney(money)).toBe("$0.00");
  });

  it("formats 450 cents as $4.50", () => {
    const money: Money = { amount: 450, currency: "USD" };
    expect(formatMoney(money)).toBe("$4.50");
  });

  it("formats 1099 cents as $10.99", () => {
    const money: Money = { amount: 1099, currency: "USD" };
    expect(formatMoney(money)).toBe("$10.99");
  });

  it("formats 1000 cents as $10.00", () => {
    const money: Money = { amount: 1000, currency: "USD" };
    expect(formatMoney(money)).toBe("$10.00");
  });

  it("formats large values correctly", () => {
    const money: Money = { amount: 100000, currency: "USD" };
    expect(formatMoney(money)).toBe("$1,000.00");
  });

  it("handles non-USD currencies", () => {
    const money: Money = { amount: 850, currency: "GBP" };
    // The exact symbol may vary by runtime locale but should include 8.50
    expect(formatMoney(money)).toContain("8.50");
  });
});

describe("formatCents", () => {
  it("wraps formatMoney with default USD currency", () => {
    expect(formatCents(299)).toBe("$2.99");
  });

  it("accepts explicit currency", () => {
    expect(formatCents(500, "USD")).toBe("$5.00");
  });
});

describe("isZero", () => {
  it("returns true for zero amount", () => {
    expect(isZero({ amount: 0, currency: "USD" })).toBe(true);
  });

  it("returns false for non-zero amount", () => {
    expect(isZero({ amount: 1, currency: "USD" })).toBe(false);
  });
});
