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
 * خدمة مساحات العمل — الواجهة الوحيدة بين المكوّنات و REST API.
 * كل الدوال تفترض وجود رمز الدخول؛ الاعتراض في lib/axios يرفقه تلقائياً.
 *
 * جميع النداءات صامتة (silent): كل مُستدعٍ يعرض خطأه بنفسه — إمّا
 * برسالة داخل الصفحة أو بتنبيه واحد — والفحوص الخلفية تجري على صفحات
 * عامة فلا يجوز أن تُفزع الزائر بتنبيه أحمر وهو يتصفّح الصفحة الرئيسية.
 */
const SILENT = { silent: true } as const

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
  const { data } = await apiClient.post("/workspaces", payload, SILENT)
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
    SILENT
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
  const { data } = await apiClient.post("/invites/accept", { token }, SILENT)
  return data.data ?? null
}
