import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import * as orgService from "../services/orgService";
import * as homeService from "../services/homeService";

export const getMyContext = asyncHandler(async (req: Request, res: Response) => {
  const context = await orgService.getMyContext(req.actor!);
  res.status(200).json({ success: true, data: context });
});

export const listMembers = asyncHandler(async (req: Request, res: Response) => {
  const members = await orgService.listOrgMembers(req.actor!);
  res.status(200).json({ success: true, count: members.length, data: members });
});

export const getOverview = asyncHandler(async (req: Request, res: Response) => {
  const overview = await homeService.getHomeDashboard(req.actor!);
  res.status(200).json({ success: true, data: overview });
});

export const getHomeDashboard = asyncHandler(async (req: Request, res: Response) => {
  const homeData = await homeService.getHomeDashboard(req.actor!);
  res.status(200).json({ success: true, data: homeData });
});
