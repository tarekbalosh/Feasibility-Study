import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import * as projectService from "../services/projectService";

// ——— GET /api/projects ———
export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const projects = await projectService.getAllProjects(req.user!.userId);

  res.status(200).json({
    success: true,
    count: projects.length,
    data: projects,
  });
});

// ——— GET /api/projects/:id ———
export const getById = asyncHandler(async (req: Request, res: Response) => {
  const project = await projectService.getProjectById(
    (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id),
    req.user!.userId
  );

  res.status(200).json({
    success: true,
    data: project,
  });
});

// ——— POST /api/projects ———
export const create = asyncHandler(async (req: Request, res: Response) => {
  const project = await projectService.createProject(req.user!.userId, req.body);

  res.status(201).json({
    success: true,
    data: project,
  });
});

// ——— PUT /api/projects/:id ———
export const update = asyncHandler(async (req: Request, res: Response) => {
  const project = await projectService.updateProject(
    (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id),
    req.user!.userId,
    req.body
  );

  res.status(200).json({
    success: true,
    message: "تم تحديث دراسة الجدوى بنجاح.",
    data: project,
  });
});

// ——— DELETE /api/projects/:id ———
export const remove = asyncHandler(async (req: Request, res: Response) => {
  const result = await projectService.deleteProject(
    (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id),
    req.user!.userId
  );

  res.status(200).json({
    success: true,
    message: result.message,
  });
});
