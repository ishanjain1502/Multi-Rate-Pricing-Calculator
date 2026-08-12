import {
  WARNING_CODES,
  type CalculatedLineItem,
  type CalculationWarning,
  type LineItemInput,
} from "./types.js";

const MAX_PERCENT_DISCOUNT = 100;

function applyPercentDiscount(
  subtotal: number,
  percent: number,
): { discountAmount: number; warnings: CalculationWarning[] } {
  const warnings: CalculationWarning[] = [];
  const effectivePercent = Math.min(percent, MAX_PERCENT_DISCOUNT);

  if (percent > MAX_PERCENT_DISCOUNT) {
    warnings.push({
      code: WARNING_CODES.DISCOUNT_CLAMPED,
      message: "Percent discount capped at 100%",
    });
  }

  const discountAmount = Math.round((subtotal * effectivePercent) / 100);
  return { discountAmount, warnings };
}

function applyFixedDiscount(
  subtotal: number,
  fixedCents: number,
): { discountAmount: number; warnings: CalculationWarning[] } {
  const warnings: CalculationWarning[] = [];

  if (fixedCents > subtotal) {
    warnings.push({
      code: WARNING_CODES.DISCOUNT_CLAMPED,
      message: "Fixed discount capped at line subtotal",
    });
  }

  const discountAmount = Math.min(fixedCents, subtotal);
  return { discountAmount, warnings };
}

export function calculateLineItem(input: LineItemInput): CalculatedLineItem {
  const subtotal = input.quantity * input.unitPrice;
  const warnings: CalculationWarning[] = [];

  let discountAmount = 0;

  if (input.discount) {
    if (input.discount.type === "percent") {
      const result = applyPercentDiscount(subtotal, input.discount.value);
      discountAmount = result.discountAmount;
      warnings.push(...result.warnings);
    } else {
      const result = applyFixedDiscount(subtotal, input.discount.value);
      discountAmount = result.discountAmount;
      warnings.push(...result.warnings);
    }
  }

  const discountedAmount = subtotal - discountAmount;
  const taxAmount = Math.round((discountedAmount * input.taxPercent) / 100);
  const total = discountedAmount + taxAmount;

  return {
    subtotal,
    discountAmount,
    discountedAmount,
    taxAmount,
    total,
    warnings,
  };
}
