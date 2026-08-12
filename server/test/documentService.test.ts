// test/documentService.test.ts (part 1: create/list/get)
import { describe, expect, it } from "vitest";
import { createDocument, listDocuments, getDocument } from "../src/services/documentService.js";
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
