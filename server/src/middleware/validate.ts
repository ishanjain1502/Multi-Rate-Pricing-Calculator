import type { Request, Response, NextFunction } from "express";
import { ZodError, type ZodType } from "zod";
import { ValidationError } from "../errors/HttpError.js";

type Opts = { body?: ZodType; params?: ZodType; query?: ZodType };

export function validate(opts: Opts) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (opts.body) (req as any).body = opts.body.parse(req.body);
      if (opts.params) (req as any).params = opts.params.parse(req.params);
      if (opts.query) (req as any).query = opts.query.parse(req.query);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const message = err.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; ");
        next(new ValidationError(message));
        return;
      }
      next(err);
    }
  };
}

