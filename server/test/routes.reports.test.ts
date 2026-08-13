import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app.js";

async function user(email: string) {
  const r = await request(app).post("/api/auth/signup").send({ email, password: "password1" });
  return { token: r.body.token };
}

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

describe("reports routes", () => {
  it("setup and summary for mixed-currency finalized documents", async () => {
    const u = await user("report@b.com");

    const usdDoc = await request(app)
      .post("/api/documents")
      .set(auth(u.token))
      .send({ title: "USD", issueDate: "2026-06-01", currency: "usd" });
    await request(app)
      .post(`/api/documents/${usdDoc.body.id}/lines`)
      .set(auth(u.token))
      .send({ description: "Item", quantity: 1, unitPrice: 10000, taxPercent: 5 });
    await request(app).post(`/api/documents/${usdDoc.body.id}/finalize`).set(auth(u.token));

    const eurDoc = await request(app)
      .post("/api/documents")
      .set(auth(u.token))
      .send({ title: "EUR", issueDate: "2026-06-15", currency: "eur" });
    await request(app)
      .post(`/api/documents/${eurDoc.body.id}/lines`)
      .set(auth(u.token))
      .send({ description: "Item", quantity: 1, unitPrice: 10000, taxPercent: 0 });
    await request(app).post(`/api/documents/${eurDoc.body.id}/finalize`).set(auth(u.token));

    const setup = await request(app)
      .get("/api/reports/setup")
      .query({ from: "2026-01-01", to: "2026-12-31", targetCurrency: "usd" })
      .set(auth(u.token));
    expect(setup.status).toBe(200);
    expect(setup.body.currencies).toContain("eur");
    expect(setup.body.currencies).toContain("usd");
    expect(setup.body.defaultRates.eur).toBe(1.08);

    const summary = await request(app)
      .post("/api/reports/summary")
      .set(auth(u.token))
      .send({
        from: "2026-01-01",
        to: "2026-12-31",
        targetCurrency: "usd",
        rates: { eur: 1.081 },
      });
    expect(summary.status).toBe(200);
    expect(summary.body.documentCount).toBe(2);
    // USD line 10500 + EUR 10000 at 1.081 → 10810 rounded... 10000*1.081=10810
    expect(summary.body.grandTotal).toBe(10500 + 10810);
  });

  it("returns 400 when exchange rate is missing", async () => {
    const u = await user("report-miss@b.com");
    const doc = await request(app)
      .post("/api/documents")
      .set(auth(u.token))
      .send({ title: "EUR", issueDate: "2026-03-01", currency: "eur" });
    await request(app)
      .post(`/api/documents/${doc.body.id}/lines`)
      .set(auth(u.token))
      .send({ description: "Item", quantity: 1, unitPrice: 1000, taxPercent: 0 });
    await request(app).post(`/api/documents/${doc.body.id}/finalize`).set(auth(u.token));

    const res = await request(app)
      .post("/api/reports/summary")
      .set(auth(u.token))
      .send({
        from: "2026-01-01",
        to: "2026-12-31",
        targetCurrency: "usd",
        rates: {},
      });
    expect(res.status).toBe(400);
  });
});
