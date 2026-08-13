// client/lib/money.ts
const DOLLARS_PATTERN = /^\d+(\.\d{1,2})?$/;

export const CURRENCIES: { code: string; label: string }[] = [
  { code: "usd", label: "US Dollar" },
  { code: "eur", label: "Euro" },
  { code: "gbp", label: "British Pound" },
  { code: "inr", label: "Indian Rupee" },
  { code: "jpy", label: "Japanese Yen" },
  { code: "cny", label: "Chinese Yuan" },
  { code: "aud", label: "Australian Dollar" },
  { code: "cad", label: "Canadian Dollar" },
  { code: "chf", label: "Swiss Franc" },
  { code: "sgd", label: "Singapore Dollar" },
  { code: "hkd", label: "Hong Kong Dollar" },
  { code: "aed", label: "UAE Dirham" },
  { code: "sar", label: "Saudi Riyal" },
  { code: "krw", label: "South Korean Won" },
  { code: "brl", label: "Brazilian Real" },
  { code: "mxn", label: "Mexican Peso" },
  { code: "zar", label: "South African Rand" },
];

export function dollarsToCents(input: string): number | null {
  const trimmed = input.trim();
  if (!DOLLARS_PATTERN.test(trimmed)) return null;
  const [dollars, fraction = ""] = trimmed.split(".");
  const cents = Number(dollars) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(cents) ? cents : null;
}

export function formatMoney(cents: number, currency: string): string {
  const amount = (cents / 100).toFixed(2);
  const code = currency.trim().toUpperCase();
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
    }).format(cents / 100);
  } catch {
    // Unknown/invalid currency code — never crash the render over formatting
    return code ? `${code} ${amount}` : amount;
  }
}
