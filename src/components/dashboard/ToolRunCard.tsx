import React from "react"
import Link from "next/link"
import clsx from "clsx"
import { ArrowLeft, Clock, Trash2, User, Edit2 } from "lucide-react"
import { getToolBySlug, getToolStartPath } from "@/config/tools.registry"
import type { ToolRunSummary } from "@/types/toolRun"
import { useAuth } from "@/context/AuthContext"
import { useWorkspace } from "@/context/WorkspaceContext"

interface ToolRunCardProps {
  run: ToolRunSummary
  onDelete: (id: string) => void
  index?: number
}

/** تنسيق التاريخ بالعربية — يوم وشهر وسنة بلا وقت */
const formatDate = (value: string): string => {
  try {
    return new Intl.DateTimeFormat("ar", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(value))
  } catch {
    return ""
  }
}

/**
 * بطاقة تحليل محفوظ في لوحة التحكم.
 *
 * الهوية اللونية والأيقونة تُقرأ من سجلّ الأدوات، فالأداة الجديدة
 * تظهر ببطاقتها الصحيحة دون تعديل هنا. الأداة المحذوفة من السجل
 * تعرض بطاقة رمادية محايدة بدل أن تُسقط الصفحة.
 */
export const ToolRunCard: React.FC<ToolRunCardProps> = ({
  run,
  onDelete,
  index = 0,
}) => {
  const { user } = useAuth()
  const { workspace } = useWorkspace()
  
  const isCreator = user?.id === run.user?.id
  const canManage = isCreator
  
  console.log(`[ToolRunCard ${run.title}] user.id:`, user?.id, `run.user.id:`, run.user?.id, `canManage:`, canManage)

  const tool = getToolBySlug(run.toolSlug)
  const Icon = tool?.icon
  const openHref = tool
    ? `${getToolStartPath(tool.slug)}?run=${run.id}`
    : undefined

  return (
    <div
      className="group relative flex flex-col bg-white rounded-2xl border border-gray-200 p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-gray-300 animate-fade-in-up"
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
    >
      {/* الترويسة — أيقونة الأداة واسمها */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={clsx(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
              tool
                ? [tool.accent.bg, tool.accent.border, tool.accent.text]
                : "bg-gray-50 border-gray-200 text-gray-400"
            )}
          >
            {Icon ? <Icon className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
          </span>
          <span className="flex flex-col min-w-0">
            <span className="text-[11px] font-bold text-gray-400 truncate">
              {tool?.name ?? "أداة غير معروفة"}
            </span>
            <h3 className="font-bold text-gray-900 truncate" title={run.title}>
              {run.title}
            </h3>
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0 transition-opacity">
          {canManage && (
            <>
              {openHref && (
                <Link
                  href={openHref}
                  className="p-1.5 rounded-lg text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 transition-colors"
                  title={`تعديل ${run.title}`}
                >
                  <Edit2 size={16} />
                </Link>
              )}
              <button
                type="button"
                onClick={() => onDelete(run.id)}
                aria-label={`حذف ${run.title}`}
                title="حذف"
                className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* الملخّص */}
      <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 min-h-[2.5rem] mb-4">
        {run.summary || "تحليل محفوظ — افتحه لعرض التفاصيل الكاملة."}
      </p>

      {/* Tags: Plan / Department */}
      {(run.plan || run.department) && (
        <div className="flex flex-wrap gap-2 mb-3">
          {run.plan && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
              خطة: {run.plan.name}
            </span>
          )}
          {!run.plan && run.department && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-blue-50 text-blue-600 border border-blue-100">
              قسم: {run.department.name}
            </span>
          )}
        </div>
      )}

      {/* التذييل — من أنشأه ومتى */}
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-gray-100 pt-3 text-xs text-gray-400">
        <span className="flex items-center gap-1.5 min-w-0">
          <User size={13} className="shrink-0" />
          <span className="truncate">{run.user?.name ?? "—"}</span>
        </span>
        <span className="flex items-center gap-1.5 shrink-0">
          <Clock size={13} />
          {formatDate(run.updatedAt)}
        </span>
      </div>

      {/* فتح التحليل — الأدوات التي لم تعد في السجل لا رابط لها */}
      {openHref && (
        <Link
          href={openHref}
          className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-indigo-50 hover:text-indigo-700"
        >
          فتح التحليل
          <ArrowLeft className="w-4 h-4" />
        </Link>
      )}
    </div>
  )
}

export default ToolRunCard
