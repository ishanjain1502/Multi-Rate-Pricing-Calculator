import { Router } from "express";
import { signup, login, logout, me } from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { signupSchema, loginSchema } from "../schemas/auth.js";

const router = Router();

router.post("/signup", validate({ body: signupSchema }), signup);
router.post("/login", validate({ body: loginSchema }), login);
router.post("/logout", logout);
router.get("/me", requireAuth, me);

export default router;
