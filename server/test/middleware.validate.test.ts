import { describe, expect, it } from "vitest";
import { z } from "zod";
import express from "express";
import request from "supertest";
import { validate } from "../src/middleware/validate.js";
import { errorHandler } from "../src/middleware/errorHandler.js";

const app = express();
app.use(express.json());
app.post(
  "/x",
  validate({ body: z.object({ name: z.string() }) }),
  (req, res) => res.json((req as any).body),
);
app.use(errorHandler);

describe("validate middleware", () => {
  it("passes through valid body", async () => {
    const res = await request(app).post("/x").send({ name: "ok" });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ name: "ok" });
  });

  it("returns 400 on invalid body", async () => {
    const res = await request(app).post("/x").send({ name: 123 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});

