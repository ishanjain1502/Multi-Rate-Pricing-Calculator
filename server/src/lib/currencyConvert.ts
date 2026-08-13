/**
 * Convert integer cents from source currency to target currency using a rate where:
 * 1 unit of source currency = `rate` units of target currency.
 * Example: 100 EUR cents (€1.00) at rate 1.08 → 108 USD cents ($1.08).
 * Fractional results round to the nearest cent (e.g. 100 × 1.081 = 108.1 → 108).
 */
export function convertCents(sourceCents: number, rate: number): number {
  return Math.round(sourceCents * rate);
}

/**
 * Build rate from source to target when each currency has a USD-per-unit factor
 * (how many USD equal 1 unit of that currency).
 */
export function rateFromUsdFactors(
  sourceCurrency: string,
  targetCurrency: string,
  usdPerUnit: Record<string, number>,
): number {
  const source = sourceCurrency.toLowerCase();
  const target = targetCurrency.toLowerCase();
  const sourceFactor = usdPerUnit[source];
  const targetFactor = usdPerUnit[target];
  if (sourceFactor === undefined || targetFactor === undefined || targetFactor === 0) {
    return NaN;
  }
  return sourceFactor / targetFactor;
}
