import React, { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/router"
import clsx from "clsx"
import {
  Check,
  ChevronDown,
  Crown,
  Loader2,
  Mail,
  MessageSquare,
  Shield,
  ShieldCheck,
  Trash2,
  User,
  UserMinus,
  Users,
  Eye,
  Building2,
  CheckCircle2,
  RotateCcw,
} from "lucide-react"
import { toast } from "react-hot-toast"
import { useAuth } from "@/context/AuthContext"
import { useWorkspace } from "@/context/WorkspaceContext"
import { useChat } from "@/context/ChatContext"
import { useDepartments } from "@/hooks/useDepartments"
import * as workspaceService from "@/services/workspace.service"
import { canManageMembers } from "@/utils/permissions"
import { FilterBar, FilterItemConfig, FilterValues } from "@/components/ui/filters"
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
  const { user } = useAuth()
  const { workspace } = useWorkspace()
  const { presences, conversations } = useChat()
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

  const router = useRouter()
  const { data: departments } = useDepartments()

  const [search, setSearch] = useState(() => (typeof router.query.search === 'string' ? router.query.search : ''))
  const [roleFilter, setRoleFilter] = useState(() => (typeof router.query.role === 'string' ? router.query.role : ''))
  const [deptFilter, setDeptFilter] = useState(() => (typeof router.query.department === 'string' ? router.query.department : ''))
  const [statusFilter, setStatusFilter] = useState(() => (typeof router.query.status === 'string' ? router.query.status : ''))

  useEffect(() => {
    if (!router.isReady) return
    const nextQuery: Record<string, any> = { ...router.query }

    if (search.trim()) nextQuery.search = search.trim()
    else delete nextQuery.search

    if (roleFilter) nextQuery.role = roleFilter
    else delete nextQuery.role

    if (deptFilter) nextQuery.department = deptFilter
    else delete nextQuery.department

    if (statusFilter) nextQuery.status = statusFilter
    else delete nextQuery.status

    router.push({ pathname: router.pathname, query: nextQuery }, undefined, { shallow: true })
  }, [search, roleFilter, deptFilter, statusFilter])

  const filterConfigs: FilterItemConfig[] = useMemo(() => {
    const list: FilterItemConfig[] = [
      {
        key: 'role',
        label: 'الدور',
        type: 'select',
        icon: Shield,
        isAllOptionLabel: 'كل الأدوار',
        options: [
          { value: 'owner', label: 'مالك', dotColor: '#D97706' },
          { value: 'admin', label: 'مشرف', dotColor: '#4F46E5' },
          { value: 'member', label: 'عضو', dotColor: '#10B981' },
          { value: 'viewer', label: 'مشاهد', dotColor: '#64748B' },
        ],
      },
    ]

    if (departments && departments.length > 0) {
      list.push({
        key: 'department',
        label: 'القسم',
        type: 'select',
        icon: Building2,
        isAllOptionLabel: 'كل الأقسام',
        options: departments.map((d: any) => ({ value: d.id, label: d.name })),
        searchThreshold: 5,
      })
    }

    list.push({
      key: 'status',
      label: 'الحالة',
      type: 'select',
      icon: CheckCircle2,
      isAllOptionLabel: 'كل الحالات',
      options: [
        { value: 'active', label: 'نشط', dotColor: '#10B981' },
        { value: 'pending', label: 'معلّق / مدعو', dotColor: '#F59E0B' },
      ],
    })

    return list
  }, [departments])

  const currentValues: FilterValues = useMemo(
    () => ({
      role: roleFilter,
      department: deptFilter,
      status: statusFilter,
    }),
    [roleFilter, deptFilter, statusFilter]
  )

  const handleFilterChange = (key: string, val: any) => {
    if (key === 'role') setRoleFilter(val || '')
    else if (key === 'department') setDeptFilter(val || '')
    else if (key === 'status') setStatusFilter(val || '')
  }

  const handleClearAll = () => {
    setSearch('')
    setRoleFilter('')
    setDeptFilter('')
    setStatusFilter('')
  }

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        const matchesName = member.name?.toLowerCase().includes(q)
        const matchesEmail = member.email?.toLowerCase().includes(q)
        if (!matchesName && !matchesEmail) return false
      }

      if (roleFilter && member.role !== roleFilter) {
        return false
      }

      if (deptFilter && departments) {
        const dept = departments.find((d: any) => d.id === deptFilter)
        const inDept =
          dept?.members?.some((m: any) => m.workspaceMemberId === member.id || m.memberId === member.id) ||
          dept?.head?.id === member.id
        if (!inDept) return false
      }

      if (statusFilter) {
        if (statusFilter === 'active' && member.status !== 'active') return false
        if (statusFilter === 'pending' && member.status === 'active') return false
      }

      return true
    })
  }, [members, search, roleFilter, deptFilter, statusFilter, departments])

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

      {/* شريط الفلاتر الموحد */}
      {!loading && members.length > 0 && (
        <div className="px-6 pt-4 pb-1 border-b border-gray-100 bg-slate-50/40">
          <FilterBar
            filters={filterConfigs}
            values={currentValues}
            onChange={handleFilterChange}
            onClearAll={handleClearAll}
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="ابحث بالاسم أو البريد..."
            totalResults={filteredMembers.length}
            resultsLabel="عضو"
          />
        </div>
      )}

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
        ) : filteredMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-center p-6">
            <h3 className="text-base font-bold text-gray-900">لا يوجد أعضاء يطابقون الفلاتر المحددة</h3>
            <p className="text-xs text-gray-500">جرّب تغيير عبارة البحث أو مسح الفلاتر.</p>
            <button
              type="button"
              onClick={handleClearAll}
              className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
            >
              <RotateCcw size={13} />
              <span>مسح الفلاتر</span>
            </button>
          </div>
        ) : (
          filteredMembers.map((member) => {
            const roleCfg =
              ROLE_CONFIG[member.role as WorkspaceRole] ?? ROLE_CONFIG.member
            const RoleIcon = roleCfg.icon
            const statusCfg = STATUS_LABELS[member.status] ?? STATUS_LABELS.active
            const isOwner = member.role === "owner"
            const isConfirming = confirmRemoveId === member.id
            const isRemoving = removingId === member.id

            // التحقق من حالة التواجد ومحادثة العضو
            const isOnline = Boolean(
              member.userId && presences[member.userId]?.status === "online"
            )
            const isCurrentUser = Boolean(
              user?.id && (member.userId === user.id || member.email === user.email)
            )
            const isPending =
              member.status !== "active" || !member.userId || Boolean((member as any).isInvite)

            const directConv = member.userId
              ? conversations.find(
                  (c) =>
                    c.type === "direct" &&
                    c.members.some((m) => m.userId === member.userId)
                )
              : null
            const unreadCount = directConv?.unreadCount ?? 0

            return (
              <div
                key={member.id}
                className={clsx(
                  "flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 transition-colors",
                  isConfirming ? "bg-red-50/60" : "hover:bg-gray-50/60"
                )}
              >
                {/* الأيقونة مع مؤشر التواجد */}
                <div className="relative shrink-0">
                  <div
                    className={clsx(
                      "flex items-center justify-center w-10 h-10 rounded-full",
                      roleCfg.bg
                    )}
                  >
                    <RoleIcon className={clsx("h-5 w-5", roleCfg.color)} />
                  </div>
                  {member.userId && member.status === "active" && (
                    <span
                      className={clsx(
                        "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white transition-colors",
                        isOnline ? "bg-emerald-500" : "bg-gray-300"
                      )}
                      title={isOnline ? "متصل الآن" : "غير متصل"}
                      aria-label={isOnline ? "متصل الآن" : "غير متصل"}
                    />
                  )}
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

                {/* عناصر الإجراءات: الدردشة، الدور، الحذف */}
                <div className="shrink-0 flex items-center gap-2">
                  {/* أيقونة الدردشة */}
                  {!isCurrentUser && (
                    isPending ? (
                      <button
                        type="button"
                        disabled
                        title="لم ينضم بعد"
                        aria-label="لم ينضم بعد"
                        className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200/60 bg-gray-100/70 text-gray-300 cursor-not-allowed opacity-60 transition-colors"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </button>
                    ) : (
                      <Link
                        href={`/dashboard/Chat?user=${member.userId}`}
                        title={`مراسلة ${member.name || member.email}`}
                        aria-label={`مراسلة ${member.name || member.email}`}
                        className="relative flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200/80 bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 active:scale-95 transition-all shadow-xs"
                      >
                        <MessageSquare className="h-4 w-4" />
                        {unreadCount > 0 && (
                          <span
                            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shadow-xs"
                            title={`${unreadCount} رسائل غير مقروءة`}
                          >
                            {unreadCount > 99 ? "+99" : unreadCount}
                          </span>
                        )}
                      </Link>
                    )
                  )}

                  {/* شارة الدور / تغيير الدور */}
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

                  {/* زر الحذف */}
                  {isManager && !isOwner && (
                    confirmRemoveId === member.id ? (
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
                    )
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default TeamMembersPanel
