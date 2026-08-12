import { describe, expect, it } from "vitest";
import {
  signupSchema,
  loginSchema,
  createDocumentSchema,
  updateDocumentSchema,
  createLineSchema,
  updateLineSchema,
} from "../src/schemas/index.js";

describe("schemas", () => {
  it("signup requires email + 8-char password", () => {
    expect(signupSchema.safeParse({ email: "a@b.com", password: "12345678" }).success).toBe(true);
    expect(signupSchema.safeParse({ email: "bad", password: "12345678" }).success).toBe(false);
    expect(signupSchema.safeParse({ email: "a@b.com", password: "short" }).success).toBe(false);
  });

  it("createDocument requires title, issueDate, currency", () => {
    expect(
      createDocumentSchema.safeParse({ title: "Inv", issueDate: "2026-01-01", currency: "usd" }).success,
    ).toBe(true);
  });

  it("updateDocument forbids status", () => {
    expect(
      updateDocumentSchema.safeParse({ status: "finalized" }).success,
    ).toBe(false);
  });

  it("createLine allows at most one discount", () => {
    expect(
      createLineSchema.safeParse({
        description: "x", quantity: 1, unitPrice: 1000, taxPercent: 5,
        discounts: [{ type: "percent", value: 10 }],
      }).success,
    ).toBe(true);
    expect(
      createLineSchema.safeParse({
        description: "x", quantity: 1, unitPrice: 1000, taxPercent: 5,
        discounts: [{ type: "percent", value: 10 }, { type: "fixed", value: 5 }],
      }).success,
    ).toBe(false);
  });

  it("createLine rejects fractional fixed discount cents", () => {
    expect(
      createLineSchema.safeParse({
        description: "x", quantity: 1, unitPrice: 1000, taxPercent: 5,
        discounts: [{ type: "fixed", value: 10.5 }],
      }).success,
    ).toBe(false);
    expect(
      createLineSchema.safeParse({
        description: "x", quantity: 1, unitPrice: 1000, taxPercent: 5,
        discounts: [{ type: "fixed", value: 2000 }],
      }).success,
    ).toBe(true);
  });

  it("loginSchema mirrors signup shape", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "12345678" }).success).toBe(true);
  });
});

