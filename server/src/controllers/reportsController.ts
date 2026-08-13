import type { Response, NextFunction } from "express";
import * as reportService from "../services/reportService.js";
import type { AuthedRequest } from "../middleware/auth.js";

const asyncHandler =
  (fn: (req: AuthedRequest, res: Response) => Promise<void>) =>
  (req: AuthedRequest, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

export const getSetup = asyncHandler(async (req, res) => {
  const { from, to, targetCurrency } = req.query as {
    from: string;
    to: string;
    targetCurrency: string;
  };
  const setup = await reportService.getReportSetup(req.user!.id, from, to, targetCurrency);
  res.json(setup);
});

export const postSummary = asyncHandler(async (req, res) => {
  const report = await reportService.generateSummaryReport(req.user!.id, req.body);
  res.json(report);
});
