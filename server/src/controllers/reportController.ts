import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import * as reportService from "../services/reportService";

// ——— GET /api/reports ———
export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const reports = await reportService.getAllReports(req.user!.userId);

  res.status(200).json({
    success: true,
    count: reports.length,
    data: reports,
  });
});

// ——— GET /api/reports/:id ———
export const getById = asyncHandler(async (req: Request, res: Response) => {
  const report = await reportService.getReportById(
    (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id),
    req.user!.userId
  );

  res.status(200).json({
    success: true,
    data: report,
  });
});

// ——— POST /api/reports/generate ———
export const generate = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.body;

  const report = await reportService.generateReport(
    projectId,
    req.user!.userId
  );

  res.status(201).json({
    success: true,
    data: report,
  });
});

// ——— GET /api/reports/:id/download ———
export const download = asyncHandler(async (req: Request, res: Response) => {
  const result = await reportService.getReportDownload(
    (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id),
    req.user!.userId
  );

  res.setHeader("Content-Type", result.contentType);
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${result.fileName}"`
  );

  res.status(200).json(result.data);
});
