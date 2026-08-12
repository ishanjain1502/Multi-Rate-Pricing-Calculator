import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app.js";

async function user(app: any, email: string) {
  const r = await request(app).post("/api/auth/signup").send({ email, password: "password1" });
  return { token: r.body.token, id: r.body.user.id };
}

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

describe("documents routes (lifecycle end-to-end)", () => {
  it("full flow: create, add lines (sample), finalize, then mutations are 409", async () => {
    const u = await user(app, "e2e@b.com");

    const doc = await request(app).post("/api/documents").set(auth(u.token)).send({
      title: "Sample", issueDate: "2026-01-01", currency: "usd",
    });
    expect(doc.status).toBe(201);
    const docId = doc.body.id;

    await request(app).post(`/api/documents/${docId}/lines`).set(auth(u.token)).send({
      description: "Widget A", quantity: 2, unitPrice: 10000, discounts: [{ type: "percent", value: 10 }], taxPercent: 5,
    }).expect(201);
    await request(app).post(`/api/documents/${docId}/lines`).set(auth(u.token)).send({
      description: "Widget B", quantity: 1, unitPrice: 5000, taxPercent: 5,
    }).expect(201);
    await request(app).post(`/api/documents/${docId}/lines`).set(auth(u.token)).send({
      description: "Service fee", quantity: 1, unitPrice: 20000, discounts: [{ type: "fixed", value: 2000 }], taxPercent: 0,
    }).expect(201);

    const got = await request(app).get(`/api/documents/${docId}`).set(auth(u.token));
    expect(got.body.subtotal).toBe(45000);
    expect(got.body.totalDiscount).toBe(4000);
    expect(got.body.totalTax).toBe(1150);
    expect(got.body.grandTotal).toBe(42150);

    const fin = await request(app).post(`/api/documents/${docId}/finalize`).set(auth(u.token));
    expect(fin.status).toBe(200);
    expect(fin.body.status).toBe("finalized");

    // mutations now blocked
    await request(app).patch(`/api/documents/${docId}`).set(auth(u.token)).send({ title: "X" }).expect(409);
    await request(app).post(`/api/documents/${docId}/lines`).set(auth(u.token)).send({
      description: "L", quantity: 1, unitPrice: 1000, taxPercent: 0,
    }).expect(409);
    await request(app).delete(`/api/documents/${docId}`).set(auth(u.token)).expect(409);
  });

  it("ownership: another user cannot read someone else's document", async () => {
    const a = await user(app, "owner@b.com");
    const b = await user(app, "stranger@b.com");
    const doc = await request(app).post("/api/documents").set(auth(a.token)).send({
      title: "Mine", issueDate: "2026-01-01", currency: "usd",
    });
    await request(app).get(`/api/documents/${doc.body.id}`).set(auth(b.token)).expect(404);
  });

  it("rejects status in PATCH body with 400", async () => {
    const u = await user(app, "status@b.com");
    const doc = await request(app).post("/api/documents").set(auth(u.token)).send({
      title: "S", issueDate: "2026-01-01", currency: "usd",
    });
    await request(app).patch(`/api/documents/${doc.body.id}`).set(auth(u.token)).send({ status: "finalized" }).expect(400);
  });

  it("requires auth", async () => {
    await request(app).get("/api/documents").expect(401);
  });
});
