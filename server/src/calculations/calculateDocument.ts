import { calculateLineItem } from "./calculateLineItem.js";
import type { CalculatedDocument, LineItemInput } from "./types.js";

export function calculateDocument(lines: LineItemInput[]): CalculatedDocument {
  const calculatedLines = lines.map((line) => calculateLineItem(line));

  const warnings = calculatedLines.flatMap((line, lineIndex) =>
    line.warnings.map((warning) => ({ ...warning, lineIndex })),
  );

  const totals = calculatedLines.reduce(
    (acc, line) => ({
      subtotal: acc.subtotal + line.subtotal,
      totalDiscount: acc.totalDiscount + line.discountAmount,
      totalTax: acc.totalTax + line.taxAmount,
      grandTotal: acc.grandTotal + line.total,
    }),
    { subtotal: 0, totalDiscount: 0, totalTax: 0, grandTotal: 0 },
  );

  return {
    ...totals,
    lines: calculatedLines,
    warnings,
  };
}
