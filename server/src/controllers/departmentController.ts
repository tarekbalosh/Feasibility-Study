import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import * as departmentService from "../services/departmentService";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const departments = await departmentService.listDepartments(req.actor!);
  res.status(200).json({ success: true, count: departments.length, data: departments });
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const department = await departmentService.getDepartment(req.actor!, req.params.id as string);
  res.status(200).json({ success: true, data: department });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const department = await departmentService.createDepartment(req.actor!, req.body);
  res.status(201).json({ success: true, data: department });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const department = await departmentService.updateDepartment(req.actor!, req.params.id as string, req.body);
  res.status(200).json({ success: true, data: department });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const result = await departmentService.deleteDepartment(req.actor!, req.params.id as string);
  res.status(200).json({ success: true, message: result.message });
});
