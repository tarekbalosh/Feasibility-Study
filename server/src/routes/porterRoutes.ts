import { Router } from "express";
import { body, param } from "express-validator";
import * as porterController from "../controllers/porterController";
import { authMiddleware } from "../middleware/authMiddleware";
import { requireWorkspace } from "../middleware/workspaceMiddleware";
import { attachActor } from "../middleware/actorMiddleware";
import { requirePermission } from "../middleware/rbacMiddleware";
import { validateRequest } from "../middleware/validateRequest";

const router = Router();

// جميع مسارات Porter تتطلب تسجيل الدخول والانتماء لمساحة عمل فعالة
router.use(authMiddleware);
router.use(requireWorkspace);
router.use(attachActor);

// الحقول الوصفية المشتركة بين الإنشاء والحفظ
const metaValidators = [
  body("projectName")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 150 })
    .withMessage("اسم المشروع يجب ألا يتجاوز 150 حرفاً."),
  body("projectDescription")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 2000 })
    .withMessage("وصف المشروع يجب ألا يتجاوز 2000 حرف."),
  body("industry")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 100 })
    .withMessage("اسم القطاع يجب ألا يتجاوز 100 حرف."),
  body("countryRegion")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 100 })
    .withMessage("الدولة أو المنطقة يجب ألا تتجاوز 100 حرف."),
  body("forces").optional().isObject().withMessage("القوى الخمس يجب أن تكون كائناً."),
];

// ─────────────────────────────────────────────────────────────
// Analyses Routes
// ─────────────────────────────────────────────────────────────

// GET /api/porter — قائمة التحليلات في مساحة العمل
router.get("/", porterController.list);

// POST /api/porter/generate — توليد القوى الخمس بالذكاء الاصطناعي (لا يحفظ شيئاً)
// ملاحظة: يجب أن يسبق مسارات /:id
router.post("/generate", requirePermission("canWrite"), porterController.generate);

// POST /api/porter/suggest-implications — اقتراح انعكاسين بالذكاء الاصطناعي لبند توجه
router.post(
  "/suggest-implications",
  requirePermission("canWrite"),
  validateRequest([
    body("force").isString().withMessage("القوة التنافسية مطلوبة."),
    body("content").trim().isLength({ min: 1 }).withMessage("محتوى البند مطلوب."),
  ]),
  porterController.suggestImplications
);

// GET /api/porter/:id — تفاصيل التحليل (بالمعرّف أو بمعرّف سجل tool_run)
router.get(
  "/:id",
  validateRequest([param("id").isUUID().withMessage("معرّف التحليل غير صالح.")]),
  porterController.getOne
);

// POST /api/porter — إنشاء تحليل جديد
router.post(
  "/",
  requirePermission("canWrite"),
  validateRequest([
    body("title")
      .trim()
      .isLength({ min: 1, max: 150 })
      .withMessage("عنوان التحليل مطلوب (1-150 حرفاً)."),
    ...metaValidators,
    body("departmentId").optional({ values: "falsy" }).isUUID().withMessage("معرّف القسم غير صالح."),
    body("planId").optional({ values: "falsy" }).isUUID().withMessage("معرّف الخطة غير صالح."),
    body("mode")
      .optional()
      .isIn(["manual", "ai", "hybrid"])
      .withMessage("النمط يجب أن يكون manual أو ai أو hybrid."),
  ]),
  porterController.create
);

// PUT /api/porter/:id — حفظ التحليل (البيانات الوصفية و/أو محتوى القوى)
router.put(
  "/:id",
  requirePermission("canWrite"),
  validateRequest([
    param("id").isUUID().withMessage("معرّف التحليل غير صالح."),
    body("title")
      .optional()
      .trim()
      .isLength({ min: 1, max: 150 })
      .withMessage("عنوان التحليل يجب أن يكون بين 1 و150 حرفاً."),
    ...metaValidators,
    body("status")
      .optional()
      .isIn(["draft", "completed"])
      .withMessage("الحالة يجب أن تكون draft أو completed."),
    body("creationMode")
      .optional()
      .isIn(["manual", "ai", "hybrid"])
      .withMessage("النمط يجب أن يكون manual أو ai أو hybrid."),
  ]),
  porterController.update
);

// DELETE /api/porter/:id — حذف التحليل
router.delete(
  "/:id",
  requirePermission("canWrite"),
  validateRequest([param("id").isUUID().withMessage("معرّف التحليل غير صالح.")]),
  porterController.remove
);

export default router;
