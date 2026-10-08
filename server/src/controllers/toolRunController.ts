import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import * as toolRunService from "../services/toolRunService";

// ——— GET /api/tool-runs ———
export const list = asyncHandler(async (req: Request, res: Response) => {
  const toolSlug =
    typeof req.query.tool === "string" ? req.query.tool : undefined;
  const departmentId =
    typeof req.query.departmentId === "string" ? req.query.departmentId : undefined;
  const planId =
    typeof req.query.planId === "string" ? req.query.planId : undefined;
  const mine = req.query.mine === "true";
  const limit =
    typeof req.query.limit === "string" ? parseInt(req.query.limit, 10) : undefined;

  const runs = await toolRunService.listToolRuns(req.actor!, {
    toolSlug,
    departmentId,
    planId,
    mine,
    limit: Number.isFinite(limit as number) ? limit : undefined,
  });

  res.status(200).json({ success: true, count: runs.length, data: runs });
});

// ——— GET /api/tool-runs/:id ———
export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const run = await toolRunService.getToolRun(req.actor!, req.params.id as string);

  res.status(200).json({ success: true, data: run });
});

// ——— POST /api/tool-runs ———
// إنشاء أو تحديث: تمرير id يعني تحديث التحليل نفسه لا إضافة نسخة.
export const save = asyncHandler(async (req: Request, res: Response) => {
  const run = await toolRunService.saveToolRun(req.actor!, req.body);

  res.status(req.body.id ? 200 : 201).json({
    success: true,
    message: req.body.id ? "تم تحديث التحليل." : "تم حفظ التحليل في لوحة التحكم.",
    data: run,
  });
});

// ——— DELETE /api/tool-runs/:id ———
export const remove = asyncHandler(async (req: Request, res: Response) => {
  const result = await toolRunService.deleteToolRun(req.actor!, req.params.id as string);

  res.status(200).json({ success: true, message: result.message });
});
