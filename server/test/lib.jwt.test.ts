import { describe, expect, it } from "vitest";
import { signToken, verifyToken } from "../src/lib/jwt.js";
import { UnauthorizedError } from "../src/errors/HttpError.js";

describe("jwt", () => {
  it("signs and verifies a token round-trip", () => {
    const token = signToken({ sub: "user-1", email: "a@b.com" });
    const payload = verifyToken(token);
    expect(payload).toEqual({ sub: "user-1", email: "a@b.com" });
  });

  it("throws UnauthorizedError on invalid token", () => {
    expect(() => verifyToken("not-a-token")).toThrow(UnauthorizedError);
  });
});
