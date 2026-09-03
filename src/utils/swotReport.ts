/**
 * ─────────────────────────────────────────────────────────────
 *  أدوات تقرير SWOT — معرّف التقرير، التواريخ، وربط الأولويات
 * ─────────────────────────────────────────────────────────────
 *  مشتركة بين الخادم (يولّد المعرّف والتاريخ) والمتصفح (يعرضهما
 *  ويرمّم التقارير المحفوظة قبل هذه المرحلة).
 * ─────────────────────────────────────────────────────────────
 */

import type {
  SwotAnalysis,
  SwotHorizon,
  SwotPriority,
  SwotStrategies,
  SwotStrategyKey,
} from "@/types/swot"

/** حروف المعرّف: بلا 0/O ولا 1/I حتى لا يُقرأ خطأً عند النسخ يدوياً */
const ID_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"
const ID_LENGTH = 5

/** معرّف تقرير قصير قابل للنسخ — مثل SWT-7F3K2 */
export const createReportId = (): string => {
  let body = ""
  for (let i = 0; i < ID_LENGTH; i += 1) {
    body += ID_ALPHABET[Math.floor(Math.random() * ID_ALPHABET.length)]
  }
  return `SWT-${body}`
}

const ID_PATTERN = new RegExp(`^SWT-[${ID_ALPHABET}]{${ID_LENGTH}}$`)

export const isReportId = (value: unknown): value is string =>
  typeof value === "string" && ID_PATTERN.test(value)

// ─────────────────────────────────────────────────────────────
//  الاستراتيجيات ومعرّفاتها
// ─────────────────────────────────────────────────────────────

export const STRATEGY_KEYS: SwotStrategyKey[] = ["so", "wo", "st", "wt"]

/** معرّف الاستراتيجية من مفتاح تقاطعها وترتيبها (صفري) داخله */
export const strategyId = (key: SwotStrategyKey, index: number): string =>
  `${key}-${index + 1}`

const STRATEGY_ID_PATTERN = /^(so|wo|st|wt)-([1-9]\d?)$/

/**
 * نصّ الاستراتيجية التي يشير إليها المعرّف، أو undefined إن لم تكن
 * موجودة فعلاً — فلا تنجو أولوية تدّعي أصلاً لا وجود له.
 */
export const strategyById = (
  strategies: SwotStrategies,
  id: string
): string | undefined => {
  const match = STRATEGY_ID_PATTERN.exec(String(id ?? "").trim().toLowerCase())
  if (!match) return undefined
  const list = strategies?.[match[1] as SwotStrategyKey]
  return list?.[Number(match[2]) - 1]
}

export const isHorizon = (value: unknown): value is SwotHorizon =>
  value === "30d" || value === "60d" || value === "90d"

/** ترتيب عرض الأولويات: الأقرب أجلاً أولاً */
const HORIZON_ORDER: Record<SwotHorizon, number> = {
  "30d": 0,
  "60d": 1,
  "90d": 2,
}

export const sortPriorities = (priorities: SwotPriority[]): SwotPriority[] =>
  [...priorities].sort(
    (a, b) => HORIZON_ORDER[a.horizon] - HORIZON_ORDER[b.horizon]
  )

// ─────────────────────────────────────────────────────────────
//  التواريخ
// ─────────────────────────────────────────────────────────────

/** تاريخ عربي مقروء: ٢٤ أغسطس ٢٠٢٦ — يعود بشرطة إن كان التاريخ تالفاً */
export const formatReportDate = (iso?: string): string => {
  if (!iso) return "—"
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return "—"
  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date)
}

/** التاريخ مع الساعة — لحقل «آخر تعديل» حيث يهمّ الفارق داخل اليوم */
export const formatReportDateTime = (iso?: string): string => {
  if (!iso) return "—"
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return "—"
  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

// ─────────────────────────────────────────────────────────────
//  ترميم التقارير المحفوظة قبل هذه المرحلة
// ─────────────────────────────────────────────────────────────

/**
 * التقارير المحفوظة في المتصفح قبل إضافة الخاتمة لا تحمل معرّفاً ولا
 * تاريخ توليد ولا أولويات. نُكمل الناقص عند القراءة بدل إسقاط المسودة
 * أو إظهار حقول فارغة في بيانات التقرير.
 */
export const withReportDefaults = (analysis: SwotAnalysis): SwotAnalysis => ({
  ...analysis,
  id: isReportId(analysis.id) ? analysis.id : createReportId(),
  generatedAt: analysis.generatedAt || new Date().toISOString(),
  priorities: Array.isArray(analysis.priorities) ? analysis.priorities : [],
})
