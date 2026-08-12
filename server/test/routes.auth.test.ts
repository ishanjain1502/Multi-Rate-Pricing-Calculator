import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app.js";

describe("auth routes", () => {
  it("signs up and returns a token", async () => {
    const res = await request(app).post("/api/auth/signup").send({ email: "r@b.com", password: "password1" });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.email).toBe("r@b.com");
  });

  it("logs in and returns a token", async () => {
    await request(app).post("/api/auth/signup").send({ email: "l@b.com", password: "password1" });
    const res = await request(app).post("/api/auth/login").send({ email: "l@b.com", password: "password1" });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });

  it("rejects duplicate signup with 409", async () => {
    await request(app).post("/api/auth/signup").send({ email: "d@b.com", password: "password1" });
    const res = await request(app).post("/api/auth/signup").send({ email: "d@b.com", password: "password1" });
    expect(res.status).toBe(409);
  });

  it("returns 401 for /me without token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("returns current user for /me with token", async () => {
    const signup = await request(app).post("/api/auth/signup").send({ email: "me@b.com", password: "password1" });
    const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${signup.body.token}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe("me@b.com");
  });

  it("logout returns 204", async () => {
    const res = await request(app).post("/api/auth/logout");
    expect(res.status).toBe(204);
  });
});
