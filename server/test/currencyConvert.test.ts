import { describe, expect, it } from "vitest";
import { convertCents, rateFromUsdFactors } from "../src/lib/currencyConvert.js";
import { DEFAULT_USD_PER_UNIT } from "../src/config/exchangeRates.js";

describe("convertCents", () => {
  it("converts 100 EUR cents to 108 USD cents at rate 1.08", () => {
    expect(convertCents(100, 1.08)).toBe(108);
  });

  it("rounds fractional cents at rate 1.081 (100 → 108 not 109)", () => {
    expect(convertCents(100, 1.081)).toBe(108);
  });

  it("converts larger amounts consistently", () => {
    expect(convertCents(10000, 1.08)).toBe(10800);
  });
});

describe("rateFromUsdFactors", () => {
  it("derives EUR to USD rate from USD-per-unit factors", () => {
    expect(rateFromUsdFactors("eur", "usd", DEFAULT_USD_PER_UNIT)).toBe(1.08);
  });

  it("derives USD to EUR rate", () => {
    const rate = rateFromUsdFactors("usd", "eur", DEFAULT_USD_PER_UNIT);
    expect(rate).toBeCloseTo(1 / 1.08, 5);
  });
});
