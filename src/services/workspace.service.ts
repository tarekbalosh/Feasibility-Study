import apiClient from "@/lib/axios"
import type {
  CreateWorkspacePayload,
  CreateWorkspaceResult,
  InvitePreview,
  Workspace,
  WorkspaceInviteDraft,
  WorkspaceMember,
} from "@/types/workspace"

/**
 * طلب صامت بالكامل: يتخطى التنبيهات العامة، ويتخطى التحويل القسري عند
 * انتهاء الجلسة. مخصص للفحوص الخلفية (مثل حالة مساحة العمل) كي لا
 * تُقاطع تصفّح الزائر.
 */
const SILENT = { silent: true } as const

/**
 * يتخطى التنبيه العام فقط لمنع التكرار (لأن المكون يعرض خطأه بنفسه)،
 * لكنه يسمح بالتحويل القسري لصفحة الدخول إذا انتهت الجلسة. مخصص للإجراءات
 * المباشرة التي يقوم بها المستخدم (إنشاء، دعوة، إلخ).
 */
const SKIP_TOAST = { skipToast: true } as const

/** مساحات العمل التي ينتمي إليها المستخدم بعضوية فعّالة */
export const getMyWorkspaces = async (): Promise<{
  workspaces: Workspace[]
  current: Workspace | null
  hasWorkspace: boolean
}> => {
  const { data } = await apiClient.get("/workspaces", SILENT)
  return {
    workspaces: data.data ?? [],
    current: data.current ?? null,
    hasWorkspace: Boolean(data.hasWorkspace),
  }
}

/** فحص خفيف يستدعيه الحارس — يجيب عن سؤال واحد: هل يملك مساحة؟ */
export const getWorkspaceStatus = async (): Promise<{
  hasWorkspace: boolean
  workspace: Workspace | null
}> => {
  const { data } = await apiClient.get("/workspaces/status", SILENT)
  return {
    hasWorkspace: Boolean(data.hasWorkspace),
    workspace: data.data ?? null,
  }
}

/** إنشاء مساحة عمل — مع دعوات اختيارية تُرسل في نفس الطلب */
export const createWorkspace = async (
  payload: CreateWorkspacePayload
): Promise<CreateWorkspaceResult> => {
  const { data } = await apiClient.post("/workspaces", payload, SKIP_TOAST)
  const nested = data?.data && typeof data.data === "object" ? data.data : {}
  return {
    workspace: (nested.id ? nested : data?.data) || data,
    invitesCreated: nested.invitesCreated ?? data?.invitesCreated ?? 0,
    invitesSent: nested.invitesSent ?? data?.invitesSent ?? 0,
  }
}

/** أعضاء مساحة عمل (الفعّالون والمدعوّون) */
export const getWorkspaceMembers = async (
  workspaceId: string
): Promise<WorkspaceMember[]> => {
  const { data } = await apiClient.get(`/workspaces/${workspaceId}/members`, SILENT)
  return data.data ?? []
}

/** دعوة أعضاء إلى مساحة قائمة */
export const inviteMembers = async (
  workspaceId: string,
  invites: WorkspaceInviteDraft[]
): Promise<{ invitesCreated: number; invitesSent: number; skipped: string[] }> => {
  const { data } = await apiClient.post(
    `/workspaces/${workspaceId}/invites`,
    { invites },
    SKIP_TOAST
  )
  const nested = data?.data && typeof data.data === "object" ? data.data : {}
  return {
    invitesCreated: nested.invitesCreated ?? data?.invitesCreated ?? 0,
    invitesSent: nested.invitesSent ?? data?.invitesSent ?? 0,
    skipped: nested.skipped ?? data?.skipped ?? [],
  }
}

/** معاينة دعوة برمزها — لا تتطلب تسجيل دخول */
export const getInvitePreview = async (
  token: string
): Promise<InvitePreview> => {
  const { data } = await apiClient.get(`/invites/${token}`, SILENT)
  return data.data
}

/** قبول الدعوة — تتطلب تسجيل دخول ببريد المدعو نفسه */
export const acceptInvite = async (token: string): Promise<Workspace | null> => {
  const { data } = await apiClient.post("/invites/accept", { token }, SKIP_TOAST)
  return data.data ?? null
}

/** إزالة عضو من مساحة العمل */
export const removeMember = async (
  workspaceId: string,
  memberId: string
): Promise<{ message: string }> => {
  const { data } = await apiClient.delete(
    `/workspaces/${workspaceId}/members/${memberId}`,
    SKIP_TOAST
  )
  return data
}

/** تغيير دور عضو في مساحة العمل */
export const updateMemberRole = async (
  workspaceId: string,
  memberId: string,
  role: string
): Promise<WorkspaceMember> => {
  const { data } = await apiClient.patch(
    `/workspaces/${workspaceId}/members/${memberId}/role`,
    { role },
    SKIP_TOAST
  )
  return data.data
}


