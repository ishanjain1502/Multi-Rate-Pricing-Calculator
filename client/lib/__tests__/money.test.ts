// client/lib/__tests__/money.test.ts
import { describe, expect, it } from "vitest";
import { CURRENCIES, dollarsToCents, formatMoney } from "../money";

describe("dollarsToCents", () => {
  it("converts whole dollars", () => {
    expect(dollarsToCents("100")).toBe(10000);
  });
  it("converts dollars with cents", () => {
    expect(dollarsToCents("100.00")).toBe(10000);
    expect(dollarsToCents("52.5")).toBe(5250);
    expect(dollarsToCents("0.01")).toBe(1);
  });
  it("trims whitespace", () => {
    expect(dollarsToCents("  20.00 ")).toBe(2000);
  });
  it("returns null for invalid input", () => {
    expect(dollarsToCents("")).toBeNull();
    expect(dollarsToCents("abc")).toBeNull();
    expect(dollarsToCents("10.999")).toBeNull();
    expect(dollarsToCents("-5")).toBeNull();
    expect(dollarsToCents("1.2.3")).toBeNull();
  });
});

describe("formatMoney", () => {
  it("formats cents as USD currency", () => {
    expect(formatMoney(42150, "usd")).toBe("$421.50");
    expect(formatMoney(0, "usd")).toBe("$0.00");
  });
  it("uppercases the currency code", () => {
    expect(formatMoney(10000, "eur")).toContain("100.00");
  });
  it("falls back to a plain amount for invalid currency codes instead of throwing", () => {
    expect(formatMoney(42150, "us")).toBe("US 421.50");
    expect(formatMoney(42150, "")).toBe("421.50");
  });
});

describe("CURRENCIES", () => {
  it("contains only valid 3-letter lowercase ISO codes", () => {
    expect(CURRENCIES.length).toBeGreaterThan(0);
    for (const c of CURRENCIES) {
      expect(c.code).toMatch(/^[a-z]{3}$/);
      expect(c.label.length).toBeGreaterThan(0);
      expect(() => formatMoney(100, c.code)).not.toThrow();
    }
  });
});

