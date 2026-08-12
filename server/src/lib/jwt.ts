import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";
import { UnauthorizedError } from "../errors/HttpError.js";

export type TokenPayload = { sub: string; email: string };

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"],
  });
}

export function verifyToken(token: string): TokenPayload {
  try {
    const p = jwt.verify(token, env.jwtSecret) as TokenPayload & {
      iat?: number;
      exp?: number;
    };
    return { sub: p.sub, email: p.email };
  } catch {
    throw new UnauthorizedError("Invalid or expired token");
  }
}
