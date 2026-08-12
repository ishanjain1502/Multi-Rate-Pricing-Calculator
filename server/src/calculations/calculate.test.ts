import { describe, expect, it } from "vitest";
import { calculateDocument, calculateLineItem, WARNING_CODES } from "./index.js";

describe("calculateLineItem", () => {
  it("calculates Widget A from plan sample", () => {
    const result = calculateLineItem({
      quantity: 2,
      unitPrice: 10000,
      discount: { type: "percent", value: 10 },
      taxPercent: 5,
    });

    expect(result).toEqual({
      subtotal: 20000,
      discountAmount: 2000,
      discountedAmount: 18000,
      taxAmount: 900,
      total: 18900,
      warnings: [],
    });
  });

  it("calculates Widget B from plan sample", () => {
    const result = calculateLineItem({
      quantity: 1,
      unitPrice: 5000,
      taxPercent: 5,
    });

    expect(result).toEqual({
      subtotal: 5000,
      discountAmount: 0,
      discountedAmount: 5000,
      taxAmount: 250,
      total: 5250,
      warnings: [],
    });
  });

  it("calculates Service fee from plan sample", () => {
    const result = calculateLineItem({
      quantity: 1,
      unitPrice: 20000,
      discount: { type: "fixed", value: 2000 },
      taxPercent: 0,
    });

    expect(result).toEqual({
      subtotal: 20000,
      discountAmount: 2000,
      discountedAmount: 18000,
      taxAmount: 0,
      total: 18000,
      warnings: [],
    });
  });

  it("clamps fixed discount above subtotal and returns warning", () => {
    const result = calculateLineItem({
      quantity: 1,
      unitPrice: 5000,
      discount: { type: "fixed", value: 8000 },
      taxPercent: 0,
    });

    expect(result.discountAmount).toBe(5000);
    expect(result.discountedAmount).toBe(0);
    expect(result.total).toBe(0);
    expect(result.warnings).toEqual([
      {
        code: WARNING_CODES.DISCOUNT_CLAMPED,
        message: "Fixed discount capped at line subtotal",
      },
    ]);
  });

  it("clamps percent discount above 100 and returns warning", () => {
    const result = calculateLineItem({
      quantity: 1,
      unitPrice: 10000,
      discount: { type: "percent", value: 150 },
      taxPercent: 0,
    });

    expect(result.discountAmount).toBe(10000);
    expect(result.discountedAmount).toBe(0);
    expect(result.total).toBe(0);
    expect(result.warnings).toEqual([
      {
        code: WARNING_CODES.DISCOUNT_CLAMPED,
        message: "Percent discount capped at 100%",
      },
    ]);
  });

  it("rounds percent discount and tax to nearest cent", () => {
    const result = calculateLineItem({
      quantity: 3,
      unitPrice: 3333,
      discount: { type: "percent", value: 33 },
      taxPercent: 7,
    });

    expect(result.subtotal).toBe(9999);
    expect(result.discountAmount).toBe(3300);
    expect(result.discountedAmount).toBe(6699);
    expect(result.taxAmount).toBe(469);
    expect(result.total).toBe(7168);
    expect(Number.isInteger(result.subtotal)).toBe(true);
    expect(Number.isInteger(result.discountAmount)).toBe(true);
    expect(Number.isInteger(result.discountedAmount)).toBe(true);
    expect(Number.isInteger(result.taxAmount)).toBe(true);
    expect(Number.isInteger(result.total)).toBe(true);
  });
});

describe("calculateDocument", () => {
  it("aggregates plan sample document totals", () => {
    const result = calculateDocument([
      {
        quantity: 2,
        unitPrice: 10000,
        discount: { type: "percent", value: 10 },
        taxPercent: 5,
      },
      {
        quantity: 1,
        unitPrice: 5000,
        taxPercent: 5,
      },
      {
        quantity: 1,
        unitPrice: 20000,
        discount: { type: "fixed", value: 2000 },
        taxPercent: 0,
      },
    ]);

    expect(result.subtotal).toBe(45000);
    expect(result.totalDiscount).toBe(4000);
    expect(result.totalTax).toBe(1150);
    expect(result.grandTotal).toBe(42150);
    expect(result.warnings).toEqual([]);
    expect(result.lines).toHaveLength(3);
  });

  it("includes lineIndex on document-level warnings", () => {
    const result = calculateDocument([
      { quantity: 1, unitPrice: 10000, taxPercent: 0 },
      {
        quantity: 1,
        unitPrice: 5000,
        discount: { type: "fixed", value: 9000 },
        taxPercent: 0,
      },
      {
        quantity: 1,
        unitPrice: 10000,
        discount: { type: "percent", value: 120 },
        taxPercent: 0,
      },
    ]);

    expect(result.warnings).toEqual([
      {
        code: WARNING_CODES.DISCOUNT_CLAMPED,
        message: "Fixed discount capped at line subtotal",
        lineIndex: 1,
      },
      {
        code: WARNING_CODES.DISCOUNT_CLAMPED,
        message: "Percent discount capped at 100%",
        lineIndex: 2,
      },
    ]);
  });
});
