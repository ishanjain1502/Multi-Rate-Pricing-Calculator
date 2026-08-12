import { Router } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import documentsRouter from "./documents.js";

const router = Router();

router.use("/health", healthRouter);
router.use("/auth", authRouter);
router.use("/documents", documentsRouter);

export default router;
