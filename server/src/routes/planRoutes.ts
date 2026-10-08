import { Router } from "express";
import { body, param, query } from "express-validator";
import * as planController from "../controllers/planController";
import { authMiddleware } from "../middleware/authMiddleware";
import { requireWorkspace } from "../middleware/workspaceMiddleware";
import { attachActor } from "../middleware/actorMiddleware";
import { validateRequest } from "../middleware/validateRequest";
import { PLAN_STATUSES, PLAN_ROLES, GOAL_STATUSES, TASK_STATUSES, TASK_PRIORITIES } from "../services/planService";

const router = Router();

router.use(authMiddleware);
router.use(requireWorkspace);
router.use(attachActor);

// Plans
router.get("/", planController.listPlans);

router.get(
  "/:id",
  validateRequest([param("id").isUUID()]),
  planController.getPlan
);

router.post(
  "/",
  validateRequest([
    body("departmentId").isUUID(),
    body("name").trim().isLength({ min: 1, max: 120 }),
    body("description").optional({ values: "falsy" }).isLength({ max: 2000 }),
    body("status").optional().isIn(PLAN_STATUSES),
    body("startDate").optional({ values: "falsy" }).isISO8601(),
    body("endDate").optional({ values: "falsy" }).isISO8601(),
    body("members").optional().isArray(),
    body("goals").optional().isArray(),
  ]),
  planController.createPlan
);

router.put(
  "/:id",
  validateRequest([
    param("id").isUUID(),
    body("departmentId").optional().isUUID(),
    body("name").optional().trim().isLength({ min: 1, max: 120 }),
    body("description").optional({ values: "null" }).isLength({ max: 2000 }),
    body("status").optional().isIn(PLAN_STATUSES),
    body("startDate").optional({ values: "null" }).isISO8601(),
    body("endDate").optional({ values: "null" }).isISO8601(),
    body("members").optional().isArray(),
  ]),
  planController.updatePlan
);

router.delete(
  "/:id",
  validateRequest([param("id").isUUID()]),
  planController.deletePlan
);

// Goals
router.get(
  "/:planId/goals",
  validateRequest([param("planId").isUUID()]),
  planController.listGoals
);

router.post(
  "/:planId/goals",
  validateRequest([
    param("planId").isUUID(),
    body("title").trim().isLength({ min: 1, max: 200 }),
    body("description").optional({ values: "falsy" }).isLength({ max: 1000 }),
    body("weight").optional().isNumeric(),
    body("dueDate").optional({ values: "falsy" }).isISO8601(),
    body("status").optional().isIn(GOAL_STATUSES),
    body("sourceRunId").optional({ values: "falsy" }).isUUID(),
  ]),
  planController.createGoal
);

router.put(
  "/:planId/goals/:goalId",
  validateRequest([
    param("planId").isUUID(),
    param("goalId").isUUID(),
    body("title").optional().trim().isLength({ min: 1, max: 200 }),
    body("description").optional({ values: "null" }).isLength({ max: 1000 }),
    body("weight").optional().isNumeric(),
    body("dueDate").optional({ values: "null" }).isISO8601(),
    body("status").optional().isIn(GOAL_STATUSES),
    body("order").optional().isNumeric(),
  ]),
  planController.updateGoal
);

router.delete(
  "/:planId/goals/:goalId",
  validateRequest([param("planId").isUUID(), param("goalId").isUUID()]),
  planController.deleteGoal
);

// Import
router.get(
  "/:planId/import/candidates",
  validateRequest([param("planId").isUUID(), query("runId").isUUID()]),
  planController.getGoalCandidates
);

router.post(
  "/:planId/import",
  validateRequest([
    param("planId").isUUID(),
    body("sourceRunId").optional({ values: "falsy" }).isUUID(),
    body("goals").isArray({ min: 1 }),
  ]),
  planController.importGoals
);

// Tasks
router.get(
  "/:planId/tasks",
  validateRequest([param("planId").isUUID()]),
  planController.listTasks
);

router.post(
  "/:planId/tasks",
  validateRequest([
    param("planId").isUUID(),
    body("goalId").optional({ values: "falsy" }).isUUID(),
    body("title").trim().isLength({ min: 1, max: 200 }),
    body("description").optional({ values: "falsy" }).isLength({ max: 2000 }),
    body("assigneeMemberId").optional({ values: "falsy" }).isUUID(),
    body("dueDate").optional({ values: "falsy" }).isISO8601(),
    body("priority").optional().isIn(TASK_PRIORITIES),
    body("status").optional().isIn(TASK_STATUSES),
    body("progress").optional().isNumeric(),
    body("weight").optional().isNumeric(),
    body("cost").optional().isNumeric(),
  ]),
  planController.createTask
);

router.put(
  "/:planId/tasks/:taskId",
  validateRequest([
    param("planId").isUUID(),
    param("taskId").isUUID(),
    body("goalId").optional({ values: "null" }).isUUID(),
    body("title").optional().trim().isLength({ min: 1, max: 200 }),
    body("description").optional({ values: "null" }).isLength({ max: 2000 }),
    body("assigneeMemberId").optional({ values: "null" }).isUUID(),
    body("dueDate").optional({ values: "null" }).isISO8601(),
    body("priority").optional().isIn(TASK_PRIORITIES),
    body("status").optional().isIn(TASK_STATUSES),
    body("progress").optional().isNumeric(),
    body("weight").optional().isNumeric(),
    body("cost").optional().isNumeric(),
  ]),
  planController.updateTask
);

router.delete(
  "/:planId/tasks/:taskId",
  validateRequest([param("planId").isUUID(), param("taskId").isUUID()]),
  planController.deleteTask
);

export default router;
