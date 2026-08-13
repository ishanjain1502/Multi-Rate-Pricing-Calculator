import { Document } from "../models/index.js";
import { DEFAULT_USD_PER_UNIT } from "../config/exchangeRates.js";
import { convertCents, rateFromUsdFactors } from "../lib/currencyConvert.js";
import { ValidationError } from "../errors/HttpError.js";

export type ReportBreakdownRow = {
  currency: string;
  documentCount: number;
  grandTotal: number;
  totalTax: number;
  totalDiscount: number;
  convertedGrandTotal: number;
  convertedTotalTax: number;
  convertedTotalDiscount: number;
};

export type SummaryReportResult = {
  from: string;
  to: string;
  targetCurrency: string;
  documentCount: number;
  grandTotal: number;
  totalTax: number;
  totalDiscount: number;
  breakdown: ReportBreakdownRow[];
};

export function parseReportDateRange(from: string, to: string): { start: Date; end: Date } {
  const start = new Date(`${from}T00:00:00.000Z`);
  const end = new Date(`${to}T23:59:59.999Z`);
  return { start, end };
}

export function defaultRatesForTarget(targetCurrency: string): Record<string, number> {
  const target = targetCurrency.toLowerCase();
  const rates: Record<string, number> = {};
  for (const currency of Object.keys(DEFAULT_USD_PER_UNIT)) {
    if (currency === target) continue;
    const rate = rateFromUsdFactors(currency, target, DEFAULT_USD_PER_UNIT);
    if (!Number.isFinite(rate)) continue;
    rates[currency] = rate;
  }
  return rates;
}

export async function currenciesInRange(
  userId: string,
  from: string,
  to: string,
): Promise<string[]> {
  const { start, end } = parseReportDateRange(from, to);
  const docs = await Document.find({
    userId,
    status: "finalized",
    issueDate: { $gte: start, $lte: end },
  }).select("currency");

  const set = new Set<string>();
  for (const doc of docs) {
    set.add(doc.currency.toLowerCase());
  }
  return [...set].sort();
}

export type ReportSetupResult = {
  from: string;
  to: string;
  targetCurrency: string;
  currencies: string[];
  defaultRates: Record<string, number>;
};

export async function getReportSetup(
  userId: string,
  from: string,
  to: string,
  targetCurrency: string,
): Promise<ReportSetupResult> {
  const currencies = await currenciesInRange(userId, from, to);
  const target = targetCurrency.toLowerCase();
  const defaultRates = defaultRatesForTarget(target);
  const needed = currencies.filter((c) => c !== target);
  const filteredRates: Record<string, number> = {};
  for (const c of needed) {
    if (defaultRates[c] !== undefined) filteredRates[c] = defaultRates[c];
  }
  return { from, to, targetCurrency: target, currencies, defaultRates: filteredRates };
}

function resolveRate(
  sourceCurrency: string,
  targetCurrency: string,
  rates: Record<string, number>,
): number {
  const source = sourceCurrency.toLowerCase();
  const target = targetCurrency.toLowerCase();
  if (source === target) return 1;
  const rate = rates[source];
  if (rate === undefined || !Number.isFinite(rate) || rate <= 0) {
    throw new ValidationError(`Missing or invalid exchange rate for currency: ${source}`);
  }
  return rate;
}

export async function generateSummaryReport(
  userId: string,
  input: {
    from: string;
    to: string;
    targetCurrency: string;
    rates: Record<string, number>;
  },
): Promise<SummaryReportResult> {
  const target = input.targetCurrency.toLowerCase();
  const { start, end } = parseReportDateRange(input.from, input.to);
  const rates = Object.fromEntries(
    Object.entries(input.rates).map(([k, v]) => [k.toLowerCase(), v]),
  );

  const docs = await Document.find({
    userId,
    status: "finalized",
    issueDate: { $gte: start, $lte: end },
  });

  const breakdownMap = new Map<string, ReportBreakdownRow>();
  let documentCount = 0;
  let grandTotal = 0;
  let totalTax = 0;
  let totalDiscount = 0;

  for (const doc of docs) {
    const currency = doc.currency.toLowerCase();
    const rate = resolveRate(currency, target, rates);

    documentCount += 1;
    grandTotal += convertCents(doc.grandTotal, rate);
    totalTax += convertCents(doc.totalTax, rate);
    totalDiscount += convertCents(doc.totalDiscount, rate);

    const row = breakdownMap.get(currency) ?? {
      currency,
      documentCount: 0,
      grandTotal: 0,
      totalTax: 0,
      totalDiscount: 0,
      convertedGrandTotal: 0,
      convertedTotalTax: 0,
      convertedTotalDiscount: 0,
    };
    row.documentCount += 1;
    row.grandTotal += doc.grandTotal;
    row.totalTax += doc.totalTax;
    row.totalDiscount += doc.totalDiscount;
    row.convertedGrandTotal += convertCents(doc.grandTotal, rate);
    row.convertedTotalTax += convertCents(doc.totalTax, rate);
    row.convertedTotalDiscount += convertCents(doc.totalDiscount, rate);
    breakdownMap.set(currency, row);
  }

  return {
    from: input.from,
    to: input.to,
    targetCurrency: target,
    documentCount,
    grandTotal,
    totalTax,
    totalDiscount,
    breakdown: [...breakdownMap.values()].sort((a, b) => a.currency.localeCompare(b.currency)),
  };
}
