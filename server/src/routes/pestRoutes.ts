import { Router } from "express";
import { body, param } from "express-validator";
import * as pestController from "../controllers/pestController";
import { authMiddleware } from "../middleware/authMiddleware";
import { requireWorkspace } from "../middleware/workspaceMiddleware";
import { attachActor } from "../middleware/actorMiddleware";
import { requirePermission } from "../middleware/rbacMiddleware";
import { validateRequest } from "../middleware/validateRequest";
import { PEST_DIMENSIONS, PEST_CATEGORIES } from "../services/pest/pestConstants";

const router = Router();

// جميع مسارات PEST تتطلب تسجيل الدخول والانتماء لمساحة عمل فعالة
router.use(authMiddleware);
router.use(requireWorkspace);
router.use(attachActor);

// ─────────────────────────────────────────────────────────────
// Analyses Routes
// ─────────────────────────────────────────────────────────────

// GET /api/pest — قائمة التحليلات في مساحة العمل
router.get("/", pestController.list);

// GET /api/pest/:id — تفاصيل التحليل والبنود مجمعة
router.get(
  "/:id",
  validateRequest([param("id").isUUID().withMessage("معرّف التحليل غير صالح.")]),
  pestController.getOne
);

// POST /api/pest — إنشاء تحليل جديد (يدوي أو بالذكاء الاصطناعي)
router.post(
  "/",
  requirePermission("canWrite"),
  validateRequest([
    body("title")
      .trim()
      .isLength({ min: 1, max: 150 })
      .withMessage("عنوان التحليل مطلوب (1-150 حرفاً)."),
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
    body("departmentId").optional({ values: "falsy" }).isUUID().withMessage("معرّف القسم غير صالح."),
    body("mode").optional().isIn(["manual", "ai"]).withMessage("النمط يجب أن يكون manual أو ai."),
  ]),
  pestController.create
);

// PATCH /api/pest/:id — تحديث بيانات التحليل
router.patch(
  "/:id",
  requirePermission("canWrite"),
  validateRequest([
    param("id").isUUID().withMessage("معرّف التحليل غير صالح."),
    body("title")
      .optional()
      .trim()
      .isLength({ min: 1, max: 150 })
      .withMessage("عنوان التحليل يجب أن يكون بين 1 و150 حرفاً."),
  ]),
  pestController.update
);

// DELETE /api/pest/:id — حذف التحليل
router.delete(
  "/:id",
  requirePermission("canWrite"),
  validateRequest([param("id").isUUID().withMessage("معرّف التحليل غير صالح.")]),
  pestController.remove
);

// POST /api/pest/:id/generate — توليد البنود بالذكاء الاصطناعي
router.post(
  "/:id/generate",
  requirePermission("canWrite"),
  validateRequest([param("id").isUUID().withMessage("معرّف التحليل غير صالح.")]),
  pestController.generate
);

// ─────────────────────────────────────────────────────────────
// Factors Routes
// ─────────────────────────────────────────────────────────────

// POST /api/pest/:id/factors — إضافة بند جديد يدوياً
router.post(
  "/:id/factors",
  requirePermission("canWrite"),
  validateRequest([
    param("id").isUUID().withMessage("معرّف التحليل غير صالح."),
    body("dimension")
      .isIn(PEST_DIMENSIONS)
      .withMessage("البُعد غير صالح (يجب أن يكون أحد الأبعاد الخمسة)."),
    body("category")
      .isIn(PEST_CATEGORIES)
      .withMessage("الفئة غير صالحة (trend, positive_impact, negative_impact)."),
    body("content")
      .optional({ values: "undefined" })
      .isLength({ max: 600 })
      .withMessage("محتوى البند يجب ألا يتجاوز 600 حرف."),
  ]),
  pestController.addFactor
);

// PATCH /api/pest/:id/factors/:factorId — تعديل محتوى بند
router.patch(
  "/:id/factors/:factorId",
  requirePermission("canWrite"),
  validateRequest([
    param("id").isUUID().withMessage("معرّف التحليل غير صالح."),
    param("factorId").isUUID().withMessage("معرّف البند غير صالح."),
    body("content")
      .optional({ values: "undefined" })
      .isLength({ max: 600 })
      .withMessage("محتوى البند يجب ألا يتجاوز 600 حرف."),
  ]),
  pestController.updateFactor
);

// DELETE /api/pest/:id/factors/:factorId — حذف بند
router.delete(
  "/:id/factors/:factorId",
  requirePermission("canWrite"),
  validateRequest([
    param("id").isUUID().withMessage("معرّف التحليل غير صالح."),
    param("factorId").isUUID().withMessage("معرّف البند غير صالح."),
  ]),
  pestController.deleteFactor
);

// POST /api/pest/:id/factors/reorder — إعادة ترتيب البنود
router.post(
  "/:id/factors/reorder",
  requirePermission("canWrite"),
  validateRequest([
    param("id").isUUID().withMessage("معرّف التحليل غير صالح."),
    body("items").isArray().withMessage("قائمة البنود المطلوبة items يجب أن تكون مصفوفة."),
  ]),
  pestController.reorderFactors
);

export default router;
