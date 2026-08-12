import { Router } from "express";
import * as ctrl from "../controllers/documentsController.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  idParamsSchema,
  lineIdParamsSchema,
  listQuerySchema,
  createDocumentSchema,
  updateDocumentSchema,
  createLineSchema,
  updateLineSchema,
} from "../schemas/index.js";

const router = Router();
router.use(requireAuth);

router.get("/", validate({ query: listQuerySchema }), ctrl.listDocuments);
router.post("/", validate({ body: createDocumentSchema }), ctrl.createDocument);
router.get("/:id", validate({ params: idParamsSchema }), ctrl.getDocument);
router.patch(
  "/:id",
  validate({ params: idParamsSchema, body: updateDocumentSchema }),
  ctrl.updateDocument,
);
router.delete("/:id", validate({ params: idParamsSchema }), ctrl.deleteDocument);
router.post("/:id/finalize", validate({ params: idParamsSchema }), ctrl.finalizeDocument);

router.post(
  "/:id/lines",
  validate({ params: idParamsSchema, body: createLineSchema }),
  ctrl.addLine,
);
router.patch(
  "/:id/lines/:lineId",
  validate({ params: lineIdParamsSchema, body: updateLineSchema }),
  ctrl.updateLine,
);
router.delete(
  "/:id/lines/:lineId",
  validate({ params: lineIdParamsSchema }),
  ctrl.deleteLine,
);

export default router;
