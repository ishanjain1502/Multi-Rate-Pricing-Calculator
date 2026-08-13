/**
 * Dev/default USD-per-unit factors: how many US dollars equal 1 unit of each currency.
 * Used to prefill report exchange rates; users can override on each report run.
 */
export const DEFAULT_USD_PER_UNIT: Record<string, number> = {
  usd: 1,
  eur: 1.08,
  gbp: 1.27,
  inr: 0.012,
  jpy: 0.0067,
  cny: 0.14,
  aud: 0.65,
  cad: 0.74,
  chf: 1.12,
  sgd: 0.74,
  hkd: 0.13,
  aed: 0.27,
  sar: 0.27,
  krw: 0.00075,
  brl: 0.2,
  mxn: 0.058,
  zar: 0.055,
};
