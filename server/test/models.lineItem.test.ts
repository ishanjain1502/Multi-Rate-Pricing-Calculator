import { describe, expect, it } from "vitest";
import { LineItem } from "../src/models/LineItem.js";

describe("LineItem model", () => {
  it("does not have a currency field", () => {
    const paths = Object.keys(LineItem.schema.paths);
    expect(paths).not.toContain("currency");
  });

  it("saves a line without currency", async () => {
    const line = await LineItem.create({
      documentId: new (await import("mongoose")).Types.ObjectId(),
      description: "Widget",
      quantity: 1,
      unitPrice: 1000,
      taxPercent: 5,
      subtotal: 1000,
      discountAmount: 0,
      discountedAmount: 1000,
      taxAmount: 50,
      total: 1050,
    });
    expect(line._id).toBeDefined();
    expect((line as any).currency).toBeUndefined();
  });
});

