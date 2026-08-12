import { describe, expect, it } from "vitest";
import { hashPassword, comparePassword } from "../src/lib/password.js";

describe("password", () => {
  it("hashes and verifies a password", async () => {
    const hash = await hashPassword("secret123");
    expect(hash).not.toBe("secret123");
    expect(await comparePassword("secret123", hash)).toBe(true);
    expect(await comparePassword("wrong", hash)).toBe(false);
  });
});
