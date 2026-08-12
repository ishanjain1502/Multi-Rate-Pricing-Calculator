import { describe, expect, it } from "vitest";
import express from "express";
import request from "supertest";
import { requireAuth } from "../src/middleware/auth.js";
import { errorHandler } from "../src/middleware/errorHandler.js";
import { signToken } from "../src/lib/jwt.js";

const app = express();
app.use(express.json());
app.get("/me", requireAuth, (req, res) => res.json((req as any).user));
app.use(errorHandler);

describe("requireAuth", () => {
  it("attaches req.user on valid token", async () => {
    const token = signToken({ sub: "u1", email: "a@b.com" });
    const res = await request(app).get("/me").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: "u1", email: "a@b.com" });
  });

  it("returns 401 when token missing", async () => {
    const res = await request(app).get("/me");
    expect(res.status).toBe(401);
  });

  it("returns 401 on invalid token", async () => {
    const res = await request(app).get("/me").set("Authorization", "Bearer bad");
    expect(res.status).toBe(401);
  });
});

