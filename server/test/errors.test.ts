import { describe, expect, it } from "vitest";
import {
  HttpError,
  ConflictError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
} from "../src/errors/HttpError.js";

describe("HttpError subclasses", () => {
  it("carry correct status codes and messages", () => {
    expect(new ConflictError().status).toBe(409);
    expect(new ConflictError("Finalized documents cannot be modified").message).toBe(
      "Finalized documents cannot be modified",
    );
    expect(new NotFoundError().status).toBe(404);
    expect(new ValidationError().status).toBe(400);
    expect(new UnauthorizedError().status).toBe(401);
  });

  it("HttpError is the base class", () => {
    expect(new ConflictError()).toBeInstanceOf(HttpError);
    expect(new ConflictError()).toBeInstanceOf(Error);
  });
});

