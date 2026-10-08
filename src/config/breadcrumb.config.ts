/**
 * ─────────────────────────────────────────────────────────────
 *  breadcrumb.config.ts
 *  إعداد نظام Breadcrumb Navigation لمنصة Feasibility Suite
 * ─────────────────────────────────────────────────────────────
 *
 *  كيفية إضافة مسار جديد:
 *    1. أضف أجزاء المسار (segments) وأسماءها في SEGMENT_LABELS.
 *    2. إذا كانت الصفحة مستثناة من Breadcrumb أضفها إلى EXCLUDED_PATHS
 *       أو EXCLUDED_PREFIXES.
 *    3. لا حاجة لأي تعديل في مكوّن Breadcrumb.tsx.
 *
 * ─────────────────────────────────────────────────────────────
 */

/**
 * تعريف بنية كل مستوى في مسار التنقل.
 */
export interface BreadcrumbItem {
  /** الاسم المعروض للمستخدم */
  label: string
  /** الرابط — undefined للمستوى الأخير (الصفحة الحالية) */
  href?: string
}

/**
 * خريطة: segment من الـ URL → اسم العرض والرابط.
 *
 * المفتاح هو الجزء الدقيق من pathname بعد تقسيمه بـ "/"
 * مثال: pathname="/dashboard/Projects" → segments=["dashboard","Projects"]
 *
 * يمكن إضافة segments جديدة هنا عند إضافة صفحات جديدة.
 */
export const SEGMENT_LABELS: Record<string, { label: string; href: string }> = {
  // ── الرئيسية ───────────────────────────────────────────────
  // (تُعالَج بشكل خاص كـ Home icon في المكوّن)

  // ── الأدوات ────────────────────────────────────────────────
  tools: { label: "الأدوات", href: "/tools" },
  "feasibility-study": {
    label: "دراسة الجدوى الذكية",
    href: "/tools/feasibility-study",
  },
  swot: { label: "تحليل SWOT", href: "/tools/swot" },
  "break-even-calculator": {
    label: "حاسبة نقطة التعادل",
    href: "/tools/break-even-calculator",
  },
  "pricing-calculator": {
    label: "حاسبة التسعير",
    href: "/tools/pricing-calculator",
  },
  "loan-calculator": {
    label: "حاسبة التمويل والأقساط",
    href: "/tools/loan-calculator",
  },
  "roi-calculator": {
    label: "حاسبة العائد على الاستثمار",
    href: "/tools/roi-calculator",
  },
  "business-plan": { label: "مولّد خطة العمل", href: "/tools/business-plan" },

  dashboard: { label: "لوحة التحكم", href: "/dashboard/Overview" },
  Overview: { label: "نظرة عامة", href: "/dashboard/Overview" },
  overview: { label: "نظرة عامة", href: "/dashboard/overview" },
  Departments: { label: "الأقسام", href: "/dashboard/Departments" },
  departments: { label: "الأقسام", href: "/dashboard/departments" },
  Plans: { label: "الخطط التشغيلية", href: "/dashboard/Plans" },
  plans: { label: "الخطط التشغيلية", href: "/dashboard/plans" },
  Projects: { label: "مشاريعي", href: "/dashboard/Projects" },
  projects: { label: "مشاريعي", href: "/dashboard/projects" },
  Reports: { label: "التقارير", href: "/dashboard/Reports" },
  reports: { label: "التقارير", href: "/dashboard/reports" },
  Settings: { label: "الإعدادات", href: "/dashboard/Settings" },
  settings: { label: "الإعدادات", href: "/dashboard/settings" },
  Team: { label: "فريق العمل", href: "/dashboard/Team" },
  team: { label: "فريق العمل", href: "/dashboard/team" },

  // ── مساحة العمل ────────────────────────────────────────────
  workspace: { label: "مساحة العمل", href: "/workspace" },
  create: { label: "إنشاء مساحة عمل", href: "/workspace/create" },

  // ── صفحات عامة ─────────────────────────────────────────────
  about: { label: "من نحن", href: "/about" },
  contact: { label: "اتصل بنا", href: "/contact" },
  features: { label: "المميزات", href: "/features" },
  pricing: { label: "الأسعار", href: "/pricing" },
}

/**
 * المسارات الكاملة التي لا تعرض Breadcrumb أبداً.
 * (مطابقة تامة مع pathname)
 */
export const EXCLUDED_PATHS: Set<string> = new Set([
  "/",          // الصفحة الرئيسية
  "/tools",     // كتالوج الأدوات (مستوى أول)
  "/about",
  "/contact",
  "/features",
  "/pricing",
])

/**
 * البوادئ التي تُستثنى كلياً من Breadcrumb.
 * أي pathname يبدأ بأحد هذه البوادئ لن يُعرض فيه Breadcrumb.
 */
export const EXCLUDED_PREFIXES: string[] = [
  "/auth/",         // صفحات المصادقة
  "/admin/",        // لوحة الإدارة
  "/api/",          // API routes
]

/**
 * Segments ديناميكية تُحذف من مسار التنقل (لا تُعرض).
 * مثلاً "start" في /tools/[slug]/start — نحذفه لأن الأداة
 * تعرض واجهتها الخاصة ولا تحتاج Breadcrumb.
 *
 * لاحظ: المسار الكامل /tools/[slug]/start مستثنى بواسطة
 * منطق الـ Breadcrumb component مباشرةً.
 */
export const HIDDEN_SEGMENTS: Set<string> = new Set(["start"])

/**
 * المسارات التي تنتهي بهذه الـ segments لا تعرض Breadcrumb.
 * مثال: /tools/swot/start → آخر segment هو "start" → لا breadcrumb.
 */
export const EXCLUDED_LAST_SEGMENTS: Set<string> = new Set([])
