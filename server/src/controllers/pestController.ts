import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import * as pestService from "../services/pest/pestService";
import { generateRequestSchema } from "../services/pest/pestGeneration";
import { ApiError } from "../utils/ApiError";

// ——— POST /api/pest ———
export const create = asyncHandler(async (req: Request, res: Response) => {
  const result = await pestService.createAnalysis(req.actor!, req.body);
  res.status(201).json({
    success: true,
    message: "تم إنشاء تحليل PEST بنجاح.",
    data: result,
  });
});

// ——— GET /api/pest ———
export const list = asyncHandler(async (req: Request, res: Response) => {
  const departmentId =
    typeof req.query.departmentId === "string" ? req.query.departmentId : undefined;
  const mine = req.query.mine === "true";
  const limit =
    typeof req.query.limit === "string" ? parseInt(req.query.limit, 10) : undefined;

  const results = await pestService.listAnalyses(req.actor!, {
    departmentId,
    mine,
    limit,
  });

  res.status(200).json({
    success: true,
    count: results.length,
    data: results,
  });
});

// ——— GET /api/pest/:id ———
export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const result = await pestService.getAnalysisWithFactors(
    req.actor!,
    req.params.id as string
  );
  res.status(200).json({
    success: true,
    data: result,
  });
});

// ——— PATCH /api/pest/:id ———
export const update = asyncHandler(async (req: Request, res: Response) => {
  const result = await pestService.updateAnalysis(
    req.actor!,
    req.params.id as string,
    req.body
  );
  res.status(200).json({
    success: true,
    message: "تم تحديث بيانات التحليل بنجاح.",
    data: result,
  });
});

// ——— DELETE /api/pest/:id ———
export const remove = asyncHandler(async (req: Request, res: Response) => {
  const result = await pestService.deleteAnalysis(
    req.actor!,
    req.params.id as string
  );
  res.status(200).json(result);
});

// ——— POST /api/pest/:id/generate ———
export const generate = asyncHandler(async (req: Request, res: Response) => {
  const parseResult = generateRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    throw ApiError.invalidInput("بيانات طلب التوليد غير صالحة.", [
      {
        field: "generation",
        issue: parseResult.error.errors[0]?.message || "خطأ في مدخلات التوليد.",
      },
    ]);
  }

  const result = await pestService.generatePestAI(
    req.actor!,
    req.params.id as string,
    parseResult.data
  );

  if (result.requiresConfirmation) {
    return res.status(409).json({
      success: false,
      code: "OVERWRITE_CONFIRMATION_REQUIRED",
      ...result,
    });
  }

  res.status(200).json({
    success: true,
    ...result,
  });
});

// ——— POST /api/pest/:id/factors ———
export const addFactor = asyncHandler(async (req: Request, res: Response) => {
  const factor = await pestService.addFactor(
    req.actor!,
    req.params.id as string,
    req.body
  );
  res.status(201).json({
    success: true,
    message: "تمت إضافة البند بنجاح.",
    data: factor,
  });
});

// ——— PATCH /api/pest/:id/factors/:factorId ———
export const updateFactor = asyncHandler(async (req: Request, res: Response) => {
  const factor = await pestService.updateFactor(
    req.actor!,
    req.params.id as string,
    req.params.factorId as string,
    req.body.content
  );
  res.status(200).json({
    success: true,
    message: "تم تعديل البند بنجاح.",
    data: factor,
  });
});

// ——— DELETE /api/pest/:id/factors/:factorId ———
export const deleteFactor = asyncHandler(async (req: Request, res: Response) => {
  const result = await pestService.deleteFactor(
    req.actor!,
    req.params.id as string,
    req.params.factorId as string
  );
  res.status(200).json(result);
});

// ——— POST /api/pest/:id/factors/reorder ———
export const reorderFactors = asyncHandler(async (req: Request, res: Response) => {
  const result = await pestService.reorderFactors(
    req.actor!,
    req.params.id as string,
    req.body.items
  );
  res.status(200).json({
    success: true,
    message: "تم حفظ الترتيب الجديد.",
    data: result,
  });
});
