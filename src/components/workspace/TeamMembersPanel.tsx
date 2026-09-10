import React, { useCallback, useEffect, useState } from "react"
import clsx from "clsx"
import {
  Check,
  ChevronDown,
  Crown,
  Loader2,
  Mail,
  Shield,
  ShieldCheck,
  Trash2,
  User,
  UserMinus,
  Users,
  Eye,
} from "lucide-react"
import { toast } from "react-hot-toast"
import { useWorkspace } from "@/context/WorkspaceContext"
import * as workspaceService from "@/services/workspace.service"
import { canManageMembers } from "@/utils/permissions"
import {
  INVITE_ROLE_OPTIONS,
  ROLE_LABELS,
  type InvitableRole,
  type WorkspaceMember,
  type WorkspaceRole,
} from "@/types/workspace"

// ——————————————————————————————————————————————
// أيقونة وتسمية ولون كل دور
// ——————————————————————————————————————————————

const ROLE_CONFIG: Record<
  WorkspaceRole,
  { icon: React.ElementType; color: string; bg: string; border: string }
> = {
  owner: {
    icon: Crown,
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  admin: {
    icon: ShieldCheck,
    color: "text-indigo-700",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
  },
  member: {
    icon: User,
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  viewer: {
    icon: Eye,
    color: "text-slate-600",
    bg: "bg-slate-100",
    border: "border-slate-200",
  },
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: "نشط", color: "text-emerald-600" },
  invited: { label: "مدعو", color: "text-amber-600" },
  pending: { label: "معلّق", color: "text-slate-500" },
}

// ——————————————————————————————————————————————
// مكوّن القائمة المنسدلة لتغيير الدور
// ——————————————————————————————————————————————

interface RoleChangerProps {
  member: WorkspaceMember
  workspaceId: string
  onRoleChanged: (memberId: string, newRole: string) => void
}

const RoleChanger: React.FC<RoleChangerProps> = ({
  member,
  workspaceId,
  onRoleChanged,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setIsOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen])

  const handleChange = async (newRole: InvitableRole) => {
    if (newRole === member.role) {
      setIsOpen(false)
      return
    }
    setLoading(true)
    try {
      await workspaceService.updateMemberRole(workspaceId, member.id, newRole)
      onRoleChanged(member.id, newRole)
      toast.success(`تم تغيير دور ${member.name || member.email} إلى ${ROLE_LABELS[newRole]}.`)
    } catch (err: any) {
      toast.error(
        err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          "تعذّر تغيير الدور."
      )
    } finally {
      setLoading(false)
      setIsOpen(false)
    }
  }

  const cfg = ROLE_CONFIG[member.role as WorkspaceRole] ?? ROLE_CONFIG.member

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((p) => !p)}
        disabled={loading}
        className={clsx(
          "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all duration-150",
          cfg.bg,
          cfg.border,
          cfg.color,
          loading && "opacity-50"
        )}
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <ChevronDown
            className={clsx(
              "h-3.5 w-3.5 transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        )}
        {ROLE_LABELS[member.role as WorkspaceRole] ?? member.role}
      </button>

      {isOpen && (
        <div
          className="absolute left-0 top-full z-50 mt-1.5 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
          role="listbox"
          dir="rtl"
        >
          {INVITE_ROLE_OPTIONS.map((opt) => {
            const isSelected = opt.value === member.role
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleChange(opt.value)}
                className={clsx(
                  "flex w-full items-center justify-between px-3 py-2.5 text-right text-sm transition-colors",
                  isSelected
                    ? "bg-indigo-50/60 font-bold text-indigo-700"
                    : "font-medium text-slate-700 hover:bg-slate-50"
                )}
              >
                <span>{opt.label}</span>
                {isSelected && (
                  <Check
                    className="h-4 w-4 text-indigo-600"
                    strokeWidth={2.5}
                  />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ——————————————————————————————————————————————
// المكوّن الرئيسي — لوحة أعضاء الفريق
// ——————————————————————————————————————————————

export const TeamMembersPanel: React.FC = () => {
  const { workspace } = useWorkspace()
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [loading, setLoading] = useState(true)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null)

  const isManager = workspace ? canManageMembers(workspace.role) : false

  const fetchMembers = useCallback(async () => {
    if (!workspace) return
    setLoading(true)
    try {
      const data = await workspaceService.getWorkspaceMembers(workspace.id)
      setMembers(data)
    } catch {
      toast.error("تعذّر تحميل قائمة الأعضاء.")
    } finally {
      setLoading(false)
    }
  }, [workspace])

  useEffect(() => {
    void fetchMembers()
  }, [fetchMembers])

  const handleRemove = async (member: WorkspaceMember) => {
    if (!workspace) return
    setRemovingId(member.id)
    try {
      await workspaceService.removeMember(workspace.id, member.id)
      setMembers((prev) => prev.filter((m) => m.id !== member.id))
      toast.success(`تمت إزالة ${member.name || member.email} من الفريق.`)
    } catch (err: any) {
      toast.error(
        err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          "تعذّر إزالة العضو."
      )
    } finally {
      setRemovingId(null)
      setConfirmRemoveId(null)
    }
  }

  const handleRoleChanged = (memberId: string, newRole: string) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, role: newRole as WorkspaceRole } : m))
    )
  }

  if (!workspace) return null

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* ترويسة */}
      <div className="p-6 border-b border-gray-100 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600">
            <Users size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">أعضاء الفريق</h2>
            <p className="text-sm text-gray-500">
              {members.length > 0
                ? `${members.length} ${members.length === 1 ? "عضو" : "أعضاء"} في «${workspace.name}»`
                : "جارٍ التحميل..."}
            </p>
          </div>
        </div>
      </div>

      {/* قائمة الأعضاء */}
      <div className="divide-y divide-gray-100">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
          </div>
        ) : members.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <Users className="h-10 w-10 text-gray-300" />
            <p className="text-sm text-gray-500">لا يوجد أعضاء بعد.</p>
          </div>
        ) : (
          members.map((member) => {
            const roleCfg =
              ROLE_CONFIG[member.role as WorkspaceRole] ?? ROLE_CONFIG.member
            const RoleIcon = roleCfg.icon
            const statusCfg = STATUS_LABELS[member.status] ?? STATUS_LABELS.active
            const isOwner = member.role === "owner"
            const isConfirming = confirmRemoveId === member.id
            const isRemoving = removingId === member.id

            return (
              <div
                key={member.id}
                className={clsx(
                  "flex items-center gap-4 px-6 py-4 transition-colors",
                  isConfirming ? "bg-red-50/60" : "hover:bg-gray-50/60"
                )}
              >
                {/* الأيقونة */}
                <div
                  className={clsx(
                    "flex items-center justify-center w-10 h-10 rounded-full shrink-0",
                    roleCfg.bg
                  )}
                >
                  <RoleIcon className={clsx("h-5 w-5", roleCfg.color)} />
                </div>

                {/* التفاصيل */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900 truncate">
                      {member.name || "—"}
                    </span>
                    <span
                      className={clsx(
                        "text-[10px] font-bold px-1.5 py-0.5 rounded-md",
                        statusCfg.color,
                        member.status === "active"
                          ? "bg-emerald-50"
                          : member.status === "invited"
                          ? "bg-amber-50"
                          : "bg-slate-100"
                      )}
                    >
                      {statusCfg.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Mail className="h-3 w-3 text-gray-400 shrink-0" />
                    <span
                      dir="ltr"
                      className="text-xs text-gray-500 truncate"
                      title={member.email}
                    >
                      {member.email}
                    </span>
                  </div>
                  {member.joinedAt && (
                    <span className="text-[10px] text-gray-400 mt-0.5 block">
                      انضم{" "}
                      {new Date(member.joinedAt).toLocaleDateString("ar-SA", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  )}
                </div>

                {/* شارة الدور / تغيير الدور */}
                <div className="shrink-0">
                  {isManager && !isOwner ? (
                    <RoleChanger
                      member={member}
                      workspaceId={workspace.id}
                      onRoleChanged={handleRoleChanged}
                    />
                  ) : (
                    <span
                      className={clsx(
                        "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold",
                        roleCfg.bg,
                        roleCfg.border,
                        roleCfg.color
                      )}
                    >
                      <RoleIcon className="h-3.5 w-3.5" />
                      {ROLE_LABELS[member.role as WorkspaceRole] ?? member.role}
                    </span>
                  )}
                </div>

                {/* زر الحذف */}
                {isManager && !isOwner && (
                  <div className="shrink-0">
                    {isConfirming ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={isRemoving}
                          onClick={() => handleRemove(member)}
                          className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50"
                        >
                          {isRemoving ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <UserMinus className="h-3.5 w-3.5" />
                          )}
                          تأكيد
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmRemoveId(null)}
                          className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                          إلغاء
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmRemoveId(member.id)}
                        title={`إزالة ${member.name || member.email}`}
                        className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default TeamMembersPanel
