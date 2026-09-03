import type { LucideIcon } from "lucide-react"

/**
 * حالة الأداة داخل المنصة
 * live  → جاهزة للاستخدام
 * beta  → متاحة لكنها تجريبية
 * soon  → قيد التطوير (تُعرض في الكتالوج بشارة "قريباً")
 */
export type ToolStatus = "live" | "beta" | "soon"

/** تصنيفات الأدوات المستخدمة في فلترة الكتالوج */
export type ToolCategory = "financial" | "planning" | "analysis"

/**
 * ألوان الأداة — مأخوذة حصراً من لوحة ألوان المشروع الحالية
 * (نفس الأسلوب المتبع في بطاقات المشاريع داخل لوحة التحكم)
 */
export interface ToolAccent {
  /** تدرّج لوني لرأس البطاقة */
  gradient: string
  /** لون النص المميز */
  text: string
  /** خلفية فاتحة لحاوية الأيقونة */
  bg: string
  /** لون الحدود الفاتحة */
  border: string
  /** لون النقطة المستخدمة في قوائم المخرجات */
  dot: string
}

/** تعريف أداة واحدة داخل سجلّ الأدوات */
export interface ToolDefinition {
  /** المعرّف في الرابط: /tools/<slug> */
  slug: string
  /** اسم الأداة بالعربية */
  name: string
  /** وصف مختصر يظهر داخل البطاقة */
  shortDescription: string
  /** وصف تفصيلي يظهر في صفحة الأداة */
  longDescription: string
  /** أيقونة من lucide-react */
  icon: LucideIcon
  category: ToolCategory
  status: ToolStatus
  accent: ToolAccent
  /** هل تتطلب تسجيل الدخول للوصول إليها؟ */
  requiresAuth: boolean
  /** ترتيب العرض في الكتالوج */
  order: number
  /**
   * هل تُعرض هذه الأداة في شبكة البطاقات على الصفحة الرئيسية؟
   * الكتالوج الكامل (/tools) يعرض كل الأدوات بصرف النظر عن هذا الحقل.
   */
  featured?: boolean
  /** أبرز مخرجات الأداة */
  highlights?: string[]
  /** الوقت التقديري لإنجازها بالدقائق */
  estimatedMinutes?: number
  /** مسار قديم يظل يعمل للحفاظ على الروابط السابقة */
  legacyPath?: string
}

/** بيانات عرض التصنيف */
export interface ToolCategoryMeta {
  key: ToolCategory | "all"
  label: string
}
