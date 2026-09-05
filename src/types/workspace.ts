/** أدوار العضوية داخل مساحة العمل */
export type WorkspaceRole = "owner" | "admin" | "member" | "viewer"

/** الأدوار القابلة للدعوة — 'owner' يُمنح لمنشئ المساحة وحده */
export type InvitableRole = Exclude<WorkspaceRole, "owner">

/** حالة العضو: فعّال، مدعو ولم يقبل بعد، أو معلّق */
export type WorkspaceMemberStatus = "active" | "invited" | "pending"

export interface Workspace {
  id: string
  name: string
  industry?: string | null
  ownerId: string
  role: WorkspaceRole
  isOwner: boolean
  createdAt: string
}

export interface WorkspaceMember {
  id: string
  email: string
  role: WorkspaceRole
  status: WorkspaceMemberStatus
  name: string | null
  invitedAt: string
  joinedAt: string | null
}

/** سطر دعوة كما تبنيه شاشة «ابدأ مع فريق» */
export interface WorkspaceInviteDraft {
  email: string
  role: InvitableRole
}

export interface CreateWorkspacePayload {
  name: string
  industry?: string
  invites?: WorkspaceInviteDraft[]
}

export interface CreateWorkspaceResult {
  workspace: Workspace
  invitesCreated: number
  invitesSent: number
}

/** معاينة الدعوة قبل تسجيل الدخول */
export interface InvitePreview {
  email: string
  role: InvitableRole
  workspaceName: string
  expiresAt: string
}

/** خيارات الأدوار المعروضة في القائمة المنسدلة */
export const INVITE_ROLE_OPTIONS: Array<{
  value: InvitableRole
  label: string
  description: string
}> = [
  {
    value: "admin",
    label: "مشرف",
    description: "يدير الأعضاء والأدوات كاملةً",
  },
  {
    value: "member",
    label: "عضو",
    description: "ينشئ الدراسات والتحليلات ويعدّلها",
  },
  {
    value: "viewer",
    label: "مُطّلع",
    description: "يطّلع على المخرجات دون تعديل",
  },
]

/** تسمية الدور بالعربية — تُستخدم في قوائم الأعضاء والرسائل */
export const ROLE_LABELS: Record<WorkspaceRole, string> = {
  owner: "المالك",
  admin: "مشرف",
  member: "عضو",
  viewer: "مُطّلع",
}
