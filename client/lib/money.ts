// client/lib/money.ts
const DOLLARS_PATTERN = /^\d+(\.\d{1,2})?$/;

export function dollarsToCents(input: string): number | null {
  const trimmed = input.trim();
  if (!DOLLARS_PATTERN.test(trimmed)) return null;
  const [dollars, fraction = ""] = trimmed.split(".");
  const cents = Number(dollars) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(cents) ? cents : null;
}

export function formatMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

