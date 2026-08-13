// client/lib/lineCalc.ts
export type LineCalcInput = {
  quantity: number;
  unitPrice: number; // cents
  discount?: { type: "percent" | "fixed"; value: number };
  taxPercent: number;
};

export type LineCalcResult = {
  subtotal: number;
  discountAmount: number;
  discountedAmount: number;
  taxAmount: number;
  total: number;
  clamped: boolean;
};

export function calcLine(input: LineCalcInput): LineCalcResult {
  const subtotal = input.quantity * input.unitPrice;
  let discountAmount = 0;
  let clamped = false;

  if (input.discount) {
    if (input.discount.type === "percent") {
      const effectivePercent = Math.min(input.discount.value, 100);
      clamped = input.discount.value > 100;
      discountAmount = Math.round((subtotal * effectivePercent) / 100);
    } else {
      clamped = input.discount.value > subtotal;
      discountAmount = Math.min(input.discount.value, subtotal);
    }
  }

  const discountedAmount = subtotal - discountAmount;
  const taxAmount = Math.round((discountedAmount * input.taxPercent) / 100);
  return { subtotal, discountAmount, discountedAmount, taxAmount, total: discountedAmount + taxAmount, clamped };
}

export function calcDocumentTotals(lines: LineCalcInput[]): {
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  grandTotal: number;
} {
  return lines.reduce(
    (acc, line) => {
      const calc = calcLine(line);
      return {
        subtotal: acc.subtotal + calc.subtotal,
        totalDiscount: acc.totalDiscount + calc.discountAmount,
        totalTax: acc.totalTax + calc.taxAmount,
        grandTotal: acc.grandTotal + calc.total,
      };
    },
    { subtotal: 0, totalDiscount: 0, totalTax: 0, grandTotal: 0 },
  );
}
