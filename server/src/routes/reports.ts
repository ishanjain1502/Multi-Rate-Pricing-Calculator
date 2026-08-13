import { Router } from "express";
import * as ctrl from "../controllers/reportsController.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { reportSetupQuerySchema, summaryReportSchema } from "../schemas/report.js";

const router = Router();
router.use(requireAuth);

router.get("/setup", validate({ query: reportSetupQuerySchema }), ctrl.getSetup);
router.post("/summary", validate({ body: summaryReportSchema }), ctrl.postSummary);

export default router;
