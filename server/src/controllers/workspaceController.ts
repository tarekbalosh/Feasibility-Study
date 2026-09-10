import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import * as workspaceService from "../services/workspaceService";

// ——— GET /api/workspaces ———
export const getMine = asyncHandler(async (req: Request, res: Response) => {
  const workspaces = await workspaceService.getUserWorkspaces(req.user!.userId);

  res.status(200).json({
    success: true,
    count: workspaces.length,
    hasWorkspace: workspaces.length > 0,
    data: workspaces,
    // الواجهة تعتمد هذا الحقل لتقرير وجهة زر «أنشئ مساحة عملك الخاصة»
    current: workspaces[0] ?? null,
  });
});

// ——— GET /api/workspaces/status ———
// نقطة خفيفة يستدعيها الحارس على الواجهة وطبقة الـ API الوسيطة.
export const getStatus = asyncHandler(async (req: Request, res: Response) => {
  const workspace = await workspaceService.getPrimaryWorkspace(req.user!.userId);

  res.status(200).json({
    success: true,
    hasWorkspace: Boolean(workspace),
    data: workspace,
  });
});

// ——— POST /api/workspaces ———
export const create = asyncHandler(async (req: Request, res: Response) => {
  const { name, industry, invites } = req.body;

  const result = await workspaceService.createWorkspace(req.user!.userId, {
    name,
    industry,
    invites: Array.isArray(invites) ? invites : [],
  });

  res.status(201).json({
    success: true,
    message: `تم إنشاء مساحة عملك «${result.workspace.name}» بنجاح 🎉`,
    data: result.workspace,
    invitesCreated: result.invitesCreated,
    invitesSent: result.invitesSent,
  });
});

// ——— GET /api/workspaces/:id/members ———
export const getMembers = asyncHandler(async (req: Request, res: Response) => {
  const members = await workspaceService.getWorkspaceMembers(
    req.params.id as string,
    req.user!.userId
  );

  res.status(200).json({ success: true, count: members.length, data: members });
});

// ——— POST /api/workspaces/:id/invites ———
export const invite = asyncHandler(async (req: Request, res: Response) => {
  const result = await workspaceService.inviteMembers(
    req.params.id as string,
    req.user!.userId,
    Array.isArray(req.body.invites) ? req.body.invites : []
  );

  res.status(201).json({
    success: true,
    message: `تم إرسال ${result.invitesSent} من أصل ${result.invitesCreated} دعوة.`,
    ...result,
  });
});

// ——— GET /api/invites/:token ———
// عامّة عمداً: المدعو يحتاج رؤية اسم المساحة قبل تسجيل دخوله.
export const preview = asyncHandler(async (req: Request, res: Response) => {
  const invite = await workspaceService.getInviteByToken(
    req.params.token as string
  );

  res.status(200).json({ success: true, data: invite });
});

// ——— POST /api/invites/accept ———
export const accept = asyncHandler(async (req: Request, res: Response) => {
  const result = await workspaceService.acceptInvite(
    req.body.token,
    req.user!.userId
  );

  res.status(200).json({
    success: true,
    message: result.workspace
      ? `انضممت إلى مساحة العمل «${result.workspace.name}» بنجاح 🎉`
      : "تم قبول الدعوة بنجاح.",
    data: result.workspace,
  });
});

// ——— DELETE /api/workspaces/:id/members/:memberId ———
export const removeMember = asyncHandler(async (req: Request, res: Response) => {
  const result = await workspaceService.removeMember(
    req.params.id as string,
    req.params.memberId as string,
    req.user!.userId
  );

  res.status(200).json({ success: true, ...result });
});

// ——— PATCH /api/workspaces/:id/members/:memberId/role ———
export const updateMemberRole = asyncHandler(async (req: Request, res: Response) => {
  const member = await workspaceService.updateMemberRole(
    req.params.id as string,
    req.params.memberId as string,
    req.body.role,
    req.user!.userId
  );

  res.status(200).json({
    success: true,
    message: "تم تحديث دور العضو بنجاح.",
    data: member,
  });
});

