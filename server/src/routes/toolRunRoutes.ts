import { Router } from "express";
import { body, param } from "express-validator";
import * as toolRunController from "../controllers/toolRunController";
import { authMiddleware } from "../middleware/authMiddleware";
import { requireWorkspace } from "../middleware/workspaceMiddleware";
import { validateRequest } from "../middleware/validateRequest";

const router = Router();

// مخرجات الأدوات مملوكة لمساحة العمل، فالمساران متلازمان
router.use(authMiddleware);
router.use(requireWorkspace);

// ——— GET /api/tool-runs ———
router.get("/", toolRunController.list);

// ——— GET /api/tool-runs/:id ———
router.get(
  "/:id",
  validateRequest([param("id").isUUID().withMessage("معرّف التحليل غير صالح.")]),
  toolRunController.getOne
);

// ——— POST /api/tool-runs ———
router.post(
  "/",
  validateRequest([
    body("id")
      .optional({ values: "falsy" })
      .isUUID()
      .withMessage("معرّف التحليل غير صالح."),
    body("toolSlug")
      .trim()
      .isLength({ min: 2, max: 60 })
      .withMessage("معرّف الأداة مطلوب."),
    body("title")
      .trim()
      .isLength({ min: 1, max: 150 })
      .withMessage("عنوان التحليل مطلوب (150 حرفاً كحد أقصى)."),
    body("summary")
      .optional({ values: "falsy" })
      .trim()
      .isLength({ max: 300 })
      .withMessage("الملخّص يجب ألا يتجاوز 300 حرف."),
    body("output").exists().withMessage("مخرجات التحليل مطلوبة."),
  ]),
  toolRunController.save
);

// ——— DELETE /api/tool-runs/:id ———
router.delete(
  "/:id",
  validateRequest([param("id").isUUID().withMessage("معرّف التحليل غير صالح.")]),
  toolRunController.remove
);

export default router;
