import { Router } from "express";
import { body, param } from "express-validator";
import * as swotGoalsController from "../controllers/swotGoalsController";
import { authMiddleware } from "../middleware/authMiddleware";
import { requireWorkspace } from "../middleware/workspaceMiddleware";
import { validateRequest } from "../middleware/validateRequest";

const router = Router();

router.use(authMiddleware);
router.use(requireWorkspace);

router.get(
  "/:swotAnalysisId",
  validateRequest([param("swotAnalysisId").trim().notEmpty().withMessage("معرّف التحليل غير صالح.")]),
  swotGoalsController.getGoalsBySwotAnalysisId
);

router.post(
  "/:swotAnalysisId",
  validateRequest([
    param("swotAnalysisId").trim().notEmpty().withMessage("معرّف التحليل غير صالح."),
    body("goalText").trim().isLength({ min: 1 }).withMessage("نص الهدف مطلوب."),
  ]),
  swotGoalsController.createGoal
);

router.put(
  "/:id",
  validateRequest([
    param("id").trim().notEmpty().withMessage("معرّف الهدف غير صالح."),
    body("goalText").trim().isLength({ min: 1 }).withMessage("نص الهدف مطلوب."),
  ]),
  swotGoalsController.updateGoal
);

router.delete(
  "/:id",
  validateRequest([param("id").trim().notEmpty().withMessage("معرّف الهدف غير صالح.")]),
  swotGoalsController.deleteGoal
);

export default router;

