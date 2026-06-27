import { Router } from "express";
import { body, param } from "express-validator";
import * as reportController from "../controllers/reportController";
import { authMiddleware } from "../middleware/authMiddleware";
import { validateRequest } from "../middleware/validateRequest";

const router = Router();

// All report routes require authentication
router.use(authMiddleware);

// ——— GET /api/reports ———
router.get("/", reportController.getAll);

// ——— GET /api/reports/:id ———
router.get(
  "/:id",
  validateRequest([
    param("id").isUUID().withMessage("معرف التقرير غير صالح."),
  ]),
  reportController.getById
);

// ——— POST /api/reports/generate ———
router.post(
  "/generate",
  validateRequest([
    body("projectId")
      .isUUID()
      .withMessage("معرف المشروع غير صالح."),
  ]),
  reportController.generate
);

// ——— GET /api/reports/:id/download ———
router.get(
  "/:id/download",
  validateRequest([
    param("id").isUUID().withMessage("معرف التقرير غير صالح."),
  ]),
  reportController.download
);

export default router;
