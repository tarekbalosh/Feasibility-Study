import { Router } from "express";
import { body, param } from "express-validator";
import * as projectController from "../controllers/projectController";
import { authMiddleware } from "../middleware/authMiddleware";
import { validateRequest } from "../middleware/validateRequest";

const router = Router();

// All project routes require authentication
router.use(authMiddleware);

// ——— GET /api/projects ———
router.get("/", projectController.getAll);

// ——— GET /api/projects/:id ———
router.get(
  "/:id",
  validateRequest([
    param("id").isUUID().withMessage("معرف المشروع غير صالح."),
  ]),
  projectController.getById
);

// ——— POST /api/projects ———
router.post(
  "/",
  validateRequest([
    body("name")
      .trim()
      .isLength({ min: 3, max: 150 })
      .withMessage("اسم المشروع يجب أن يكون بين 3 و 150 حرف."),
    body("industry")
      .trim()
      .notEmpty()
      .withMessage("قطاع المشروع مطلوب."),
    body("location")
      .trim()
      .notEmpty()
      .withMessage("موقع المشروع مطلوب."),
    body("currency")
      .optional()
      .trim()
      .isLength({ min: 3, max: 3 })
      .withMessage("رمز العملة يجب أن يكون 3 أحرف."),
    body("targetCapital")
      .isFloat({ gt: 0 })
      .withMessage("رأس المال المستهدف يجب أن يكون أكبر من صفر."),
    body("durationYears")
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage("مدة المشروع يجب أن تكون بين 1 و 10 سنوات."),
    body("description")
      .trim()
      .isLength({ min: 10 })
      .withMessage("وصف المشروع يجب أن يكون 10 أحرف على الأقل."),
    body("financialInputs")
      .isObject()
      .withMessage("البيانات المالية يجب أن تكون كائن JSON."),
  ]),
  projectController.create
);

// ——— PUT /api/projects/:id ———
router.put(
  "/:id",
  validateRequest([
    param("id").isUUID().withMessage("معرف المشروع غير صالح."),
    body("name")
      .optional()
      .trim()
      .isLength({ min: 3, max: 150 })
      .withMessage("اسم المشروع يجب أن يكون بين 3 و 150 حرف."),
    body("industry")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("قطاع المشروع مطلوب."),
    body("location")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("موقع المشروع مطلوب."),
    body("targetCapital")
      .optional()
      .isFloat({ gt: 0 })
      .withMessage("رأس المال المستهدف يجب أن يكون أكبر من صفر."),
    body("description")
      .optional()
      .trim()
      .isLength({ min: 10 })
      .withMessage("وصف المشروع يجب أن يكون 10 أحرف على الأقل."),
  ]),
  projectController.update
);

// ——— DELETE /api/projects/:id ———
router.delete(
  "/:id",
  validateRequest([
    param("id").isUUID().withMessage("معرف المشروع غير صالح."),
  ]),
  projectController.remove
);

export default router;
