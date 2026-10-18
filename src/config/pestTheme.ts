import React from "react"
import {
  Landmark,
  TrendingUp,
  Users,
  Cpu,
  Scale,
  Compass,
  ShieldCheck,
  AlertTriangle,
  LucideIcon,
} from "lucide-react"
import type { PestDimension, PestCategory } from "@/types/pest"

export interface DimensionTheme {
  key: PestDimension
  title: string
  englishLabel: string
  subtitle: string
  icon: LucideIcon
  // الألوان والدرجات
  gradient: string
  gradientLight: string
  border: string
  borderGlow: string
  iconBg: string
  iconColor: string
  accentColor: string
  badgeBg: string
  badgeText: string
  headerBg: string
}

export const PEST_THEMES: Record<PestDimension, DimensionTheme> = {
  political: {
    key: "political",
    title: "البعد السياسي",
    englishLabel: "POLITICAL",
    subtitle: "الاستقرار الحكومي، التشريعات والسياسات العامة، ومحفزات الاستثمار",
    icon: Landmark,
    gradient: "from-emerald-600 via-teal-600 to-emerald-700",
    gradientLight: "from-emerald-500/10 via-teal-500/5 to-transparent",
    border: "border-emerald-200/80 hover:border-emerald-300",
    borderGlow: "shadow-emerald-500/10",
    iconBg: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/25",
    iconColor: "text-emerald-600",
    accentColor: "text-emerald-600",
    badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    badgeText: "text-emerald-700",
    headerBg: "bg-gradient-to-r from-emerald-50/90 via-teal-50/50 to-white",
  },
  economic: {
    key: "economic",
    title: "البعد الاقتصادي",
    englishLabel: "ECONOMIC",
    subtitle: "القوة الشرائية، معدلات التضخم، تقلبات التكاليف وسلاسل الإمداد",
    icon: TrendingUp,
    gradient: "from-blue-600 via-cyan-600 to-blue-700",
    gradientLight: "from-blue-500/10 via-cyan-500/5 to-transparent",
    border: "border-blue-200/80 hover:border-blue-300",
    borderGlow: "shadow-blue-500/10",
    iconBg: "bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-blue-500/25",
    iconColor: "text-blue-600",
    accentColor: "text-blue-600",
    badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
    badgeText: "text-blue-700",
    headerBg: "bg-gradient-to-r from-blue-50/90 via-cyan-50/50 to-white",
  },
  social: {
    key: "social",
    title: "البعد الاجتماعي",
    englishLabel: "SOCIAL",
    subtitle: "الأنماط الاستهلاكية، الثقافة المجتمعية، وسلوكيات الفئات المستهدفة",
    icon: Users,
    gradient: "from-amber-500 via-orange-500 to-amber-600",
    gradientLight: "from-amber-500/10 via-orange-500/5 to-transparent",
    border: "border-amber-200/80 hover:border-amber-300",
    borderGlow: "shadow-amber-500/10",
    iconBg: "bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-amber-500/25",
    iconColor: "text-amber-600",
    accentColor: "text-amber-600",
    badgeBg: "bg-amber-50 text-amber-800 border-amber-200",
    badgeText: "text-amber-800",
    headerBg: "bg-gradient-to-r from-amber-50/90 via-orange-50/50 to-white",
  },
  technological: {
    key: "technological",
    title: "البعد التقني",
    englishLabel: "TECHNOLOGICAL",
    subtitle: "التحول الرقمي، الحلول السحابية، أتمتة العمليات والابتكارات الحديثة",
    icon: Cpu,
    gradient: "from-purple-600 via-indigo-600 to-purple-700",
    gradientLight: "from-purple-500/10 via-indigo-500/5 to-transparent",
    border: "border-purple-200/80 hover:border-purple-300",
    borderGlow: "shadow-purple-500/10",
    iconBg: "bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-purple-500/25",
    iconColor: "text-purple-600",
    accentColor: "text-purple-600",
    badgeBg: "bg-purple-50 text-purple-700 border-purple-200",
    badgeText: "text-purple-700",
    headerBg: "bg-gradient-to-r from-purple-50/90 via-indigo-50/50 to-white",
  },
  legal: {
    key: "legal",
    title: "البعد القانوني",
    englishLabel: "LEGAL & REGULATORY",
    subtitle: "الاشتراطات والتراخيص، الفوترة الإلكترونية، حماية المستهلك ونظام العمل",
    icon: Scale,
    gradient: "from-slate-700 via-zinc-800 to-slate-900",
    gradientLight: "from-slate-500/10 via-zinc-500/5 to-transparent",
    border: "border-slate-300 hover:border-slate-400",
    borderGlow: "shadow-slate-500/10",
    iconBg: "bg-gradient-to-br from-slate-700 to-zinc-900 text-white shadow-slate-600/25",
    iconColor: "text-slate-800",
    accentColor: "text-slate-700",
    badgeBg: "bg-slate-100 text-slate-800 border-slate-300",
    badgeText: "text-slate-800",
    headerBg: "bg-gradient-to-r from-slate-100/90 via-zinc-100/60 to-white",
  },
}

export interface CategoryTheme {
  title: string
  subtitle: string
  icon: LucideIcon
  badgeBg: string
  badgeText: string
  borderColor: string
  headerBg: string
  accentColor: string
  emptyText: string
}

export const CATEGORY_THEMES: Record<PestCategory, CategoryTheme> = {
  trend: {
    title: "أبرز التوجهات والمؤشرات",
    subtitle: "العوامل والمسارات العامة في البيئة الخارجية",
    icon: Compass,
    badgeBg: "bg-sky-50 text-sky-700 border-sky-200",
    badgeText: "text-sky-700",
    borderColor: "border-sky-200/70",
    headerBg: "bg-gradient-to-r from-sky-50/80 via-blue-50/40 to-white",
    accentColor: "text-sky-600",
    emptyText: "لا توجد مؤشرات مسجلة حتى الآن في هذا المسار.",
  },
  positive_impact: {
    title: "الانعكاسات الإيجابية والفرص",
    subtitle: "الفرص المحتملة والمكاسب الاستراتيجية للمشروع",
    icon: ShieldCheck,
    badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    badgeText: "text-emerald-700",
    borderColor: "border-emerald-200/70",
    headerBg: "bg-gradient-to-r from-emerald-50/80 via-teal-50/40 to-white",
    accentColor: "text-emerald-600",
    emptyText: "لا توجد انعكاسات إيجابية مسجلة حالياً.",
  },
  negative_impact: {
    title: "الانعكاسات السلبية والمخاطر",
    subtitle: "التحديات والمخاطر المحتملة التي تستوجب التحوط",
    icon: AlertTriangle,
    badgeBg: "bg-rose-50 text-rose-700 border-rose-200",
    badgeText: "text-rose-700",
    borderColor: "border-rose-200/70",
    headerBg: "bg-gradient-to-r from-rose-50/80 via-orange-50/40 to-white",
    accentColor: "text-rose-600",
    emptyText: "لا توجد انعكاسات سلبية مسجلة حالياً.",
  },
}
