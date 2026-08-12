// test/documentService.test.ts (part 1: create/list/get)
import { describe, expect, it } from "vitest";
import { createDocument, listDocuments, getDocument, addLine, updateLine, deleteLine } from "../src/services/documentService.js";
import { NotFoundError } from "../src/errors/HttpError.js";

// Valid ObjectId hex strings (Document.userId is Schema.Types.ObjectId)
const U1 = "507f1f77bcf86cd799439011";
const UA = "507f1f77bcf86cd799439012";
const UB = "507f1f77bcf86cd799439013";
const UF = "507f1f77bcf86cd799439014";
const UG = "507f1f77bcf86cd799439015";
const U_OWNER = "507f1f77bcf86cd799439016";
const U_OTHER = "507f1f77bcf86cd799439017";

describe("documentService create/list/get", () => {
  it("creates a draft with zero totals", async () => {
    const doc = await createDocument(U1, {
      title: "Inv 1",
      issueDate: new Date("2026-01-01"),
      currency: "usd",
    });
    expect(doc.status).toBe("draft");
    expect(doc.subtotal).toBe(0);
    expect(doc.grandTotal).toBe(0);
    expect(doc.currency).toBe("usd");
    expect(doc.id).toBeTruthy();
  });

  it("lists only the user's documents", async () => {
    await createDocument(UA, { title: "A1", issueDate: new Date("2026-01-01"), currency: "usd" });
    await createDocument(UB, { title: "B1", issueDate: new Date("2026-01-01"), currency: "usd" });
    const list = await listDocuments(UA);
    expect(list).toHaveLength(1);
    expect(list[0].title).toBe("A1");
  });

  it("filters by status", async () => {
    const d = await createDocument(UF, { title: "F", issueDate: new Date("2026-01-01"), currency: "usd" });
    const list = await listDocuments(UF, { status: "draft" });
    expect(list).toHaveLength(1);
    const none = await listDocuments(UF, { status: "finalized" });
    expect(none).toHaveLength(0);
  });

  it("getDocument returns doc + lines", async () => {
    const doc = await createDocument(UG, { title: "G", issueDate: new Date("2026-01-01"), currency: "usd" });
    const got = await getDocument(UG, doc.id);
    expect(got.title).toBe("G");
    expect(got.lines).toEqual([]);
  });

  it("getDocument on another user's doc returns 404", async () => {
    const doc = await createDocument(U_OWNER, { title: "X", issueDate: new Date("2026-01-01"), currency: "usd" });
    await expect(getDocument(U_OTHER, doc.id)).rejects.toBeInstanceOf(NotFoundError);
  });
});

const U_S = "507f1f77bcf86cd799439018";
const U_U = "507f1f77bcf86cd799439019";
const U_D = "507f1f77bcf86cd79943901a";
const U_OWNER2 = "507f1f77bcf86cd79943901b";
const U_STRANGER = "507f1f77bcf86cd79943901c";

describe("documentService line mutations", () => {
  it("adds a line and updates document totals to match calculateDocument sample", async () => {
    const doc = await createDocument(U_S, { title: "Sample", issueDate: new Date("2026-01-01"), currency: "usd" });
    await addLine(U_S, doc.id, { description: "Widget A", quantity: 2, unitPrice: 10000, discounts: [{ type: "percent", value: 10 }], taxPercent: 5 });
    await addLine(U_S, doc.id, { description: "Widget B", quantity: 1, unitPrice: 5000, taxPercent: 5 });
    await addLine(U_S, doc.id, { description: "Service fee", quantity: 1, unitPrice: 20000, discounts: [{ type: "fixed", value: 2000 }], taxPercent: 0 });

    const got = await getDocument(U_S, doc.id);
    expect(got.subtotal).toBe(45000);
    expect(got.totalDiscount).toBe(4000);
    expect(got.totalTax).toBe(1150);
    expect(got.grandTotal).toBe(42150);
    expect(got.lines).toHaveLength(3);
  });

  it("updates a line and recomputes totals", async () => {
    const doc = await createDocument(U_U, { title: "U", issueDate: new Date("2026-01-01"), currency: "usd" });
    const line = await addLine(U_U, doc.id, { description: "L", quantity: 1, unitPrice: 10000, taxPercent: 0 });
    await updateLine(U_U, doc.id, line.id, { quantity: 3 });
    const got = await getDocument(U_U, doc.id);
    expect(got.subtotal).toBe(30000);
  });

  it("deletes a line and recomputes totals", async () => {
    const doc = await createDocument(U_D, { title: "D", issueDate: new Date("2026-01-01"), currency: "usd" });
    const line = await addLine(U_D, doc.id, { description: "L", quantity: 1, unitPrice: 10000, taxPercent: 0 });
    await deleteLine(U_D, doc.id, line.id);
    const got = await getDocument(U_D, doc.id);
    expect(got.subtotal).toBe(0);
    expect(got.lines).toHaveLength(0);
  });

  it("rejects adding a line to another user's doc with 404", async () => {
    const doc = await createDocument(U_OWNER2, { title: "O", issueDate: new Date("2026-01-01"), currency: "usd" });
    await expect(
      addLine(U_STRANGER, doc.id, { description: "x", quantity: 1, unitPrice: 1000, taxPercent: 0 }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
