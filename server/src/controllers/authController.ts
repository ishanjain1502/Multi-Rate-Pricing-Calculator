import type { Response, NextFunction } from "express";
import { signup as signupSvc, login as loginSvc } from "../services/authService.js";
import type { AuthedRequest } from "../middleware/auth.js";

const asyncHandler =
  (fn: (req: AuthedRequest, res: Response) => Promise<void>) =>
  (req: AuthedRequest, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

export const signup = asyncHandler(async (req, res) => {
  const result = await signupSvc(req.body.email, req.body.password);
  res.status(201).json(result);
});

export const login = asyncHandler(async (req, res) => {
  const result = await loginSvc(req.body.email, req.body.password);
  res.status(200).json(result);
});

export function logout(_req: AuthedRequest, res: Response) {
  res.status(204).end();
}

export const me = asyncHandler(async (req, res) => {
  res.status(200).json({ id: req.user!.id, email: req.user!.email });
});
