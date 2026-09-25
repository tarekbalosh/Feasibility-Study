import React from "react"
import { X, Target, TrendingUp, Shield, AlertTriangle, Swords, Lightbulb, Calendar, BarChart2 } from "lucide-react"
import clsx from "clsx"
import type { SmartGoal, SmartGoalStrategyType, SmartGoalSourceType } from "@/types/swot"

interface SmartGoalsModalProps {
  goals: SmartGoal[]
  onClose: () => void
}

// ── تكوين الألوان والأيقونات لكل نوع استراتيجية ─────────────
const STRATEGY_CONFIG: Record<
  SmartGoalStrategyType,
  { label: string; badgeClass: string; icon: React.ReactNode }
> = {
  SO: {
    label: "هجومية",
    badgeClass:
      "bg-emerald-50 text-emerald-700 ring-emerald-500/20 border-emerald-200",
    icon: <Swords className="w-3 h-3" />,
  },
  WO: {
    label: "تحسينية",
    badgeClass:
      "bg-sky-50 text-sky-700 ring-sky-500/20 border-sky-200",
    icon: <TrendingUp className="w-3 h-3" />,
  },
  ST: {
    label: "دفاعية",
    badgeClass:
      "bg-violet-50 text-violet-700 ring-violet-500/20 border-violet-200",
    icon: <Shield className="w-3 h-3" />,
  },
  WT: {
    label: "وقائية",
    badgeClass:
      "bg-amber-50 text-amber-700 ring-amber-500/20 border-amber-200",
    icon: <AlertTriangle className="w-3 h-3" />,
  },
}

// ── تكوين لون نوع المصدر ──────────────────────────────────────
const SOURCE_TYPE_CLASS: Record<SmartGoalSourceType, string> = {
  "قوة":   "bg-emerald-100 text-emerald-800 border-emerald-200",
  "ضعف":   "bg-rose-100    text-rose-800    border-rose-200",
  "فرصة":  "bg-sky-100     text-sky-800     border-sky-200",
  "خطر":   "bg-amber-100   text-amber-800   border-amber-200",
}

const ar = (n: number) => n.toLocaleString("ar-EG")

export const SmartGoalsModal: React.FC<SmartGoalsModalProps> = ({
  goals,
  onClose,
}) => {
  // منع التمرير خلف المودال
  React.useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = "" }
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="smart-goals-modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="relative w-full max-w-5xl max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl ring-1 ring-slate-200 overflow-hidden">

        {/* ── رأس المودال ── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-l from-indigo-50/60 to-white shrink-0">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 shadow-sm ring-1 ring-indigo-200/60">
              <Target className="w-5 h-5" />
            </span>
            <div>
              <h2 id="smart-goals-modal-title" className="text-xl font-bold text-slate-800 leading-tight">
                الأهداف الذكية (SMART)
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {ar(goals.length)} هدف مشتق من تحليل SWOT
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── جسم المودال القابل للتمرير ── */}
        <div className="overflow-y-auto flex-1 px-6 py-6 flex flex-col gap-4">
          {goals.map((goal, idx) => {
            const stratCfg = STRATEGY_CONFIG[goal.strategy_type] ?? STRATEGY_CONFIG.SO
            return (
              <div
                key={`${goal.source_id}-${idx}`}
                className="group flex flex-col gap-3 p-5 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200"
              >
                {/* الصف الأول: رقم + المصدر + نوع الاستراتيجية */}
                <div className="flex items-center gap-3 flex-wrap">
                  {/* رقم الهدف */}
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 text-slate-500 font-bold text-sm ring-1 ring-slate-200 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:ring-indigo-200 transition-colors shrink-0">
                    {ar(goal.goal_number)}
                  </span>

                  {/* نوع المصدر */}
                  <span className={clsx(
                    "inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg border",
                    SOURCE_TYPE_CLASS[goal.source_type]
                  )}>
                    {goal.source_type}
                  </span>

                  {/* نص المصدر */}
                  <span className="text-sm text-slate-500 font-medium truncate flex-1">
                    {goal.source_text}
                  </span>

                  {/* نوع الاستراتيجية */}
                  <span className={clsx(
                    "inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ring-1",
                    stratCfg.badgeClass
                  )}>
                    {stratCfg.icon}
                    {goal.strategy_type} — {stratCfg.label}
                  </span>
                </div>

                {/* الهدف الذكي */}
                <div className="flex items-start gap-2 pr-11">
                  <Lightbulb className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <p className="text-[15px] font-semibold text-slate-800 leading-relaxed">
                    {goal.goal}
                  </p>
                </div>

                {/* المؤشر + الإطار الزمني */}
                <div className="flex flex-wrap gap-3 pr-11">
                  <div className="flex items-center gap-1.5 text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                    <BarChart2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-medium">المؤشر:</span>
                    <span>{goal.metric}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-medium">الموعد:</span>
                    <span>{goal.deadline}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── تذييل المودال ── */}
        <div className="shrink-0 px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-colors shadow-sm"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  )
}

export default SmartGoalsModal
