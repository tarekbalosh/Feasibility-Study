import { Router } from "express";
import { body, param } from "express-validator";
import * as swotTasksController from "../controllers/swotTasksController";
import { authMiddleware } from "../middleware/authMiddleware";
import { requireWorkspace } from "../middleware/workspaceMiddleware";
import { requirePermission } from "../middleware/rbacMiddleware";
import { validateRequest } from "../middleware/validateRequest";

const router = Router();

router.use(authMiddleware);
router.use(requireWorkspace);

// ——————————————————————————————————————————————
// القراءة — متاحة لجميع الأدوار
// ——————————————————————————————————————————————

// جلب مهام هدف بعينه
router.get(
  "/goal/:goalId",
  validateRequest([param("goalId").trim().notEmpty().withMessage("معرّف الهدف غير صالح.")]),
  swotTasksController.getTasksByGoalId
);

// جلب كل مهام تحليل SWOT
router.get(
  "/analysis/:analysisId",
  validateRequest([param("analysisId").trim().notEmpty().withMessage("معرّف التحليل غير صالح.")]),
  swotTasksController.getTasksByAnalysisId
);

// ——————————————————————————————————————————————
// الكتابة — تتطلب صلاحية canWrite
// ——————————————————————————————————————————————

// إنشاء مهمة
router.post(
  "/:goalId",
  requirePermission("canWrite"),
  validateRequest([
    param("goalId").trim().notEmpty().withMessage("معرّف الهدف غير صالح."),
    body("title").trim().isLength({ min: 1 }).withMessage("عنوان المهمة مطلوب."),
    body("dueDate").notEmpty().withMessage("تاريخ الإنجاز مطلوب."),
    body("assignee").trim().isLength({ min: 1 }).withMessage("المسؤول عن التنفيذ مطلوب."),
    body("follower").trim().isLength({ min: 1 }).withMessage("المعني بالمتابعة مطلوب."),
    body("weight")
      .isInt({ min: 1, max: 100 })
      .withMessage("الوزن النسبي يجب أن يكون بين 1 و 100."),
    body("cost").optional().isFloat({ min: 0 }).withMessage("التكلفة يجب أن تكون رقماً غير سالب."),
    body("goalIndex").isInt({ min: 1 }).withMessage("رقم الهدف غير صالح."),
  ]),
  swotTasksController.createTask
);

// تعديل مهمة
router.put(
  "/:taskId",
  requirePermission("canWrite"),
  validateRequest([
    param("taskId").trim().notEmpty().withMessage("معرّف المهمة غير صالح."),
    body("title").optional().trim().isLength({ min: 1 }).withMessage("عنوان المهمة لا يمكن أن يكون فارغاً."),
    body("weight").optional().isInt({ min: 1, max: 100 }).withMessage("الوزن النسبي يجب أن يكون بين 1 و 100."),
    body("cost").optional().isFloat({ min: 0 }).withMessage("التكلفة يجب أن تكون رقماً غير سالب."),
    body("progress").optional().isInt({ min: 0, max: 100 }).withMessage("نسبة الإنجاز يجب أن تكون بين 0 و 100."),
  ]),
  swotTasksController.updateTask
);

// تحديث الحالة والتقدم فقط
router.patch(
  "/:taskId/status",
  validateRequest([
    param("taskId").trim().notEmpty().withMessage("معرّف المهمة غير صالح."),
    body("status")
      .optional()
      .isIn(["not_started", "in_progress", "overdue", "completed"])
      .withMessage("الحالة غير صالحة."),
    body("progress").optional().isInt({ min: 0, max: 100 }).withMessage("نسبة الإنجاز يجب أن تكون بين 0 و 100."),
  ]),
  swotTasksController.updateTaskStatus
);

// حذف مهمة
router.delete(
  "/:taskId",
  requirePermission("canWrite"),
  validateRequest([param("taskId").trim().notEmpty().withMessage("معرّف المهمة غير صالح.")]),
  swotTasksController.deleteTask
);

// تكرار مهمة
router.post(
  "/:taskId/duplicate",
  requirePermission("canWrite"),
  validateRequest([param("taskId").trim().notEmpty().withMessage("معرّف المهمة غير صالح.")]),
  swotTasksController.duplicateTask
);

export default router;
