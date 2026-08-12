import { describe, expect, it } from "vitest";
import { signup, login } from "../src/services/authService.js";
import { ConflictError, UnauthorizedError } from "../src/errors/HttpError.js";

describe("authService", () => {
  it("signs up and logs in", async () => {
    const a = await signup("a@b.com", "password1");
    expect(a.user.email).toBe("a@b.com");
    expect(a.token).toBeTruthy();

    const b = await login("a@b.com", "password1");
    expect(b.user.email).toBe("a@b.com");
    expect(b.token).toBeTruthy();
  });

  it("rejects duplicate email on signup with 409", async () => {
    await signup("dup@b.com", "password1");
    await expect(signup("dup@b.com", "password1")).rejects.toBeInstanceOf(ConflictError);
  });

  it("rejects bad password on login with 401", async () => {
    await signup("c@b.com", "password1");
    await expect(login("c@b.com", "wrong")).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("rejects unknown email on login with 401", async () => {
    await expect(login("nobody@b.com", "password1")).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
