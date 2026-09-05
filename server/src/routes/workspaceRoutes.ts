import { Router } from "express";
import { body, param } from "express-validator";
import * as workspaceController from "../controllers/workspaceController";
import { authMiddleware } from "../middleware/authMiddleware";
import { validateRequest } from "../middleware/validateRequest";
import { INVITABLE_ROLES } from "../services/workspaceService";

const router = Router();

// مسارات مساحة العمل كلّها تتطلب تسجيل دخول
router.use(authMiddleware);

/**
 * التحقق من قائمة الدعوات — مشترك بين الإنشاء والدعوة اللاحقة.
 * التنظيف العميق (توحيد الأحرف، إزالة التكرار) يجري في الخدمة؛
 * ما يهم هنا هو رفض البنية الخاطئة مبكراً.
 */
const invitesValidation = [
  body("invites")
    .optional()
    .isArray({ max: 25 })
    .withMessage("قائمة الدعوات يجب أن تكون مصفوفة (25 دعوة كحد أقصى)."),
  body("invites.*.email")
    .trim()
    .isEmail()
    .withMessage("أحد عناوين البريد الإلكتروني غير صالح."),
  body("invites.*.role")
    .optional()
    .trim()
    .isIn(INVITABLE_ROLES as unknown as string[])
    .withMessage("الدور المختار غير صالح."),
];

// ——— GET /api/workspaces ———
router.get("/", workspaceController.getMine);

// ——— GET /api/workspaces/status ———
router.get("/status", workspaceController.getStatus);

// ——— POST /api/workspaces ———
router.post(
  "/",
  validateRequest([
    body("name")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("اسم مساحة العمل يجب أن يكون بين 2 و 100 حرف."),
    body("industry")
      .optional({ values: "falsy" })
      .trim()
      .isLength({ max: 100 })
      .withMessage("نوع النشاط يجب ألا يتجاوز 100 حرف."),
    ...invitesValidation,
  ]),
  workspaceController.create
);

// ——— GET /api/workspaces/:id/members ———
router.get(
  "/:id/members",
  validateRequest([
    param("id").isUUID().withMessage("معرف مساحة العمل غير صالح."),
  ]),
  workspaceController.getMembers
);

// ——— POST /api/workspaces/:id/invites ———
router.post(
  "/:id/invites",
  validateRequest([
    param("id").isUUID().withMessage("معرف مساحة العمل غير صالح."),
    body("invites")
      .isArray({ min: 1, max: 25 })
      .withMessage("أضف بريداً إلكترونياً واحداً على الأقل (25 كحد أقصى)."),
    ...invitesValidation.slice(1),
  ]),
  workspaceController.invite
);

export default router;
