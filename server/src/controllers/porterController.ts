import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import * as porterService from "../services/porter/porterService";
import { generateRequestSchema } from "../services/porter/porterGeneration";
import { ApiError } from "../utils/ApiError";

// ——— POST /api/porter ———
export const create = asyncHandler(async (req: Request, res: Response) => {
  const result = await porterService.createAnalysis(req.actor!, req.body);
  res.status(201).json({
    success: true,
    message: "تم إنشاء تحليل قوى بورتر بنجاح.",
    data: result,
  });
});

// ——— GET /api/porter ———
export const list = asyncHandler(async (req: Request, res: Response) => {
  const departmentId =
    typeof req.query.departmentId === "string" ? req.query.departmentId : undefined;
  const mine = req.query.mine === "true";
  const limit =
    typeof req.query.limit === "string" ? parseInt(req.query.limit, 10) : undefined;

  const results = await porterService.listAnalyses(req.actor!, {
    departmentId,
    mine,
    limit: Number.isFinite(limit) ? limit : undefined,
  });

  res.status(200).json({
    success: true,
    count: results.length,
    data: results,
  });
});

// ——— GET /api/porter/:id ———
export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const result = await porterService.getAnalysis(req.actor!, req.params.id as string);
  res.status(200).json({
    success: true,
    data: result,
  });
});

// ——— PUT /api/porter/:id ———
export const update = asyncHandler(async (req: Request, res: Response) => {
  const result = await porterService.updateAnalysis(
    req.actor!,
    req.params.id as string,
    req.body
  );
  res.status(200).json({
    success: true,
    message: "تم حفظ تحليل قوى بورتر بنجاح.",
    data: result,
  });
});

// ——— DELETE /api/porter/:id ———
export const remove = asyncHandler(async (req: Request, res: Response) => {
  const result = await porterService.deleteAnalysis(req.actor!, req.params.id as string);
  res.status(200).json(result);
});

// ——— POST /api/porter/generate ———
export const generate = asyncHandler(async (req: Request, res: Response) => {
  const parseResult = generateRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    throw ApiError.invalidInput(
      parseResult.error.errors[0]?.message || "بيانات طلب التوليد غير صالحة.",
      [
        {
          field: "generation",
          issue: parseResult.error.errors[0]?.message || "خطأ في مدخلات التوليد.",
        },
      ]
    );
  }

  const result = await porterService.generatePorterAI(req.actor!, parseResult.data);

  res.status(200).json({
    success: true,
    ...result,
  });
});
