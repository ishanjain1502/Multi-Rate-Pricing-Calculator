// client/lib/__tests__/lineCalc.test.ts
import { describe, expect, it } from "vitest";
import { calcDocumentTotals, calcLine } from "../lineCalc";

describe("calcLine", () => {
  it("applies percent discount before tax", () => {
    // Widget A: 2 x $100.00, 10% off, 5% tax
    expect(calcLine({ quantity: 2, unitPrice: 10000, discount: { type: "percent", value: 10 }, taxPercent: 5 }))
      .toEqual({ subtotal: 20000, discountAmount: 2000, discountedAmount: 18000, taxAmount: 900, total: 18900, clamped: false });
  });
  it("handles no discount", () => {
    // Widget B: 1 x $50.00, 5% tax
    expect(calcLine({ quantity: 1, unitPrice: 5000, taxPercent: 5 }))
      .toEqual({ subtotal: 5000, discountAmount: 0, discountedAmount: 5000, taxAmount: 250, total: 5250, clamped: false });
  });
  it("applies fixed discount, no tax", () => {
    // Service fee: 1 x $200.00, $20 off
    expect(calcLine({ quantity: 1, unitPrice: 20000, discount: { type: "fixed", value: 2000 }, taxPercent: 0 }))
      .toEqual({ subtotal: 20000, discountAmount: 2000, discountedAmount: 18000, taxAmount: 0, total: 18000, clamped: false });
  });
  it("clamps fixed discount above subtotal", () => {
    const result = calcLine({ quantity: 1, unitPrice: 1000, discount: { type: "fixed", value: 5000 }, taxPercent: 0 });
    expect(result.discountAmount).toBe(1000);
    expect(result.total).toBe(0);
    expect(result.clamped).toBe(true);
  });
  it("clamps percent discount above 100", () => {
    const result = calcLine({ quantity: 1, unitPrice: 1000, discount: { type: "percent", value: 150 }, taxPercent: 0 });
    expect(result.discountAmount).toBe(1000);
    expect(result.clamped).toBe(true);
  });
});

describe("calcDocumentTotals", () => {
  it("matches the plan's sample document", () => {
    const totals = calcDocumentTotals([
      { quantity: 2, unitPrice: 10000, discount: { type: "percent", value: 10 }, taxPercent: 5 },
      { quantity: 1, unitPrice: 5000, taxPercent: 5 },
      { quantity: 1, unitPrice: 20000, discount: { type: "fixed", value: 2000 }, taxPercent: 0 },
    ]);
    expect(totals).toEqual({ subtotal: 45000, totalDiscount: 4000, totalTax: 1150, grandTotal: 42150 });
  });
  it("returns zeros for no lines", () => {
    expect(calcDocumentTotals([])).toEqual({ subtotal: 0, totalDiscount: 0, totalTax: 0, grandTotal: 0 });
  });
});
