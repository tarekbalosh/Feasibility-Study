import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import * as planService from "../services/planService";

// Plans
export const listPlans = asyncHandler(async (req: Request, res: Response) => {
  const { departmentId, status } = req.query;
  const plans = await planService.listPlans(req.actor!, {
    departmentId: typeof departmentId === "string" ? departmentId : undefined,
    status: typeof status === "string" ? status : undefined,
  });
  res.status(200).json({ success: true, count: plans.length, data: plans });
});

export const getPlan = asyncHandler(async (req: Request, res: Response) => {
  const plan = await planService.getPlan(req.actor!, req.params.id as string);
  res.status(200).json({ success: true, data: plan });
});

export const createPlan = asyncHandler(async (req: Request, res: Response) => {
  const plan = await planService.createPlan(req.actor!, req.body);
  res.status(201).json({ success: true, data: plan });
});

export const updatePlan = asyncHandler(async (req: Request, res: Response) => {
  const plan = await planService.updatePlan(req.actor!, req.params.id as string, req.body);
  res.status(200).json({ success: true, data: plan });
});

export const deletePlan = asyncHandler(async (req: Request, res: Response) => {
  const result = await planService.deletePlan(req.actor!, req.params.id as string);
  res.status(200).json({ success: true, message: result.message });
});

// Goals
export const listGoals = asyncHandler(async (req: Request, res: Response) => {
  const goals = await planService.listGoals(req.actor!, req.params.planId as string);
  res.status(200).json({ success: true, count: goals.length, data: goals });
});

export const createGoal = asyncHandler(async (req: Request, res: Response) => {
  const goal = await planService.createGoal(req.actor!, req.params.planId as string, req.body);
  res.status(201).json({ success: true, data: goal });
});

export const updateGoal = asyncHandler(async (req: Request, res: Response) => {
  const goal = await planService.updateGoal(
    req.actor!,
    req.params.planId as string,
    req.params.goalId as string,
    req.body
  );
  res.status(200).json({ success: true, data: goal });
});

export const deleteGoal = asyncHandler(async (req: Request, res: Response) => {
  const result = await planService.deleteGoal(req.actor!, req.params.planId as string, req.params.goalId as string);
  res.status(200).json({ success: true, message: result.message });
});

export const getGoalCandidates = asyncHandler(async (req: Request, res: Response) => {
  const result = await planService.getGoalCandidates(req.actor!, req.params.planId as string, req.query.runId as string);
  res.status(200).json({ success: true, data: result });
});

export const importGoals = asyncHandler(async (req: Request, res: Response) => {
  const result = await planService.importGoals(req.actor!, req.params.planId as string, req.body);
  res.status(201).json({ success: true, ...result });
});

// Tasks
export const listTasks = asyncHandler(async (req: Request, res: Response) => {
  const { goalId, assignee, status } = req.query;
  const tasks = await planService.listTasks(req.actor!, req.params.planId as string, {
    goalId: typeof goalId === "string" ? goalId : undefined,
    assignee: typeof assignee === "string" ? assignee : undefined,
    status: typeof status === "string" ? status : undefined,
  });
  res.status(200).json({ success: true, count: tasks.length, data: tasks });
});

export const createTask = asyncHandler(async (req: Request, res: Response) => {
  const task = await planService.createTask(req.actor!, req.params.planId as string, req.body);
  res.status(201).json({ success: true, data: task });
});

export const updateTask = asyncHandler(async (req: Request, res: Response) => {
  const task = await planService.updateTask(
    req.actor!,
    req.params.planId as string,
    req.params.taskId as string,
    req.body
  );
  res.status(200).json({ success: true, data: task });
});

export const deleteTask = asyncHandler(async (req: Request, res: Response) => {
  const result = await planService.deleteTask(req.actor!, req.params.planId as string, req.params.taskId as string);
  res.status(200).json({ success: true, message: result.message });
});
