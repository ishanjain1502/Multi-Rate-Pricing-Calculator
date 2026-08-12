import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (env.nodeEnv === "development") {
    console.error(err);
  }

  const status =
    "status" in err && typeof (err as { status?: unknown }).status === "number"
      ? (err as { status: number }).status
      : 500;

  res.status(status).json({
    error: err.message || "Internal server error",
  });
}
