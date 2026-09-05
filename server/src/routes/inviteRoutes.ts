import { Router } from "express";
import { body, param } from "express-validator";
import * as workspaceController from "../controllers/workspaceController";
import { authMiddleware } from "../middleware/authMiddleware";
import { validateRequest } from "../middleware/validateRequest";

const router = Router();

// ——— GET /api/invites/:token ———
// عامّة: المدعو يحتاج معاينة اسم المساحة ودوره قبل تسجيل الدخول.
// الرمز يكشف اسم المساحة فقط ولا يمنح أي وصول بذاته.
router.get(
  "/:token",
  validateRequest([
    param("token")
      .trim()
      .isLength({ min: 20, max: 128 })
      .withMessage("رمز الدعوة غير صالح."),
  ]),
  workspaceController.preview
);

// ——— POST /api/invites/accept ———
// القبول يتطلب تسجيل الدخول: العضوية تُربط بحساب حقيقي لا ببريد مجرّد.
router.post(
  "/accept",
  authMiddleware,
  validateRequest([
    body("token")
      .trim()
      .isLength({ min: 20, max: 128 })
      .withMessage("رمز الدعوة غير صالح."),
  ]),
  workspaceController.accept
);

export default router;
