import { Router } from "express";
import { body, param } from "express-validator";
import * as swotGoalsController from "../controllers/swotGoalsController";
import { authMiddleware } from "../middleware/authMiddleware";
import { requireWorkspace } from "../middleware/workspaceMiddleware";
import { requirePermission } from "../middleware/rbacMiddleware";
import { validateRequest } from "../middleware/validateRequest";

const router = Router();

router.use(authMiddleware);
router.use(requireWorkspace);

// القراءة متاحة لجميع الأدوار
router.get(
  "/:swotAnalysisId",
  validateRequest([param("swotAnalysisId").trim().notEmpty().withMessage("معرّف التحليل غير صالح.")]),
  swotGoalsController.getGoalsBySwotAnalysisId
);

// الإنشاء والتعديل والحذف تتطلب صلاحية الكتابة
router.post(
  "/:swotAnalysisId",
  requirePermission("canWrite"),
  validateRequest([
    param("swotAnalysisId").trim().notEmpty().withMessage("معرّف التحليل غير صالح."),
    body("goalText").trim().isLength({ min: 1 }).withMessage("نص الهدف مطلوب."),
  ]),
  swotGoalsController.createGoal
);

router.put(
  "/:id",
  requirePermission("canWrite"),
  validateRequest([
    param("id").trim().notEmpty().withMessage("معرّف الهدف غير صالح."),
    body("goalText").trim().isLength({ min: 1 }).withMessage("نص الهدف مطلوب."),
  ]),
  swotGoalsController.updateGoal
);

router.delete(
  "/:id",
  requirePermission("canWrite"),
  validateRequest([param("id").trim().notEmpty().withMessage("معرّف الهدف غير صالح.")]),
  swotGoalsController.deleteGoal
);

export default router;


