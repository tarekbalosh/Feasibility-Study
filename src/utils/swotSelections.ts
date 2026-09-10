/**
 * ─────────────────────────────────────────────────────────────
 *  أدوات مساعدة لاختيارات SWOT
 * ─────────────────────────────────────────────────────────────
 *  مشتركة بين المتصفح (شاشة الاختيار) والخادم (بناء الـ Prompt)،
 *  فلا يوجد منطق مكرَّر على الطرفين.
 * ─────────────────────────────────────────────────────────────
 */

import {
  MAX_CUSTOM_ITEMS_PER_CATEGORY,
  MAX_CUSTOM_ITEM_LENGTH,
  SWOT_CATEGORY_ORDER,
  normalizeArabic,
  swotSuggestionIndex,
  swotSuggestions,
} from "@/config/swotSuggestions"
import type { SwotSuggestion } from "@/config/swotSuggestions"
import {
  emptySwotSelections,
  type SwotCategorySelection,
  type SwotItem,
  type SwotQuadrantKey,
  type SwotSelectionPayload,
  type SwotSelections,
} from "@/types/swot"

/**
 * بنود مجموعة واحدة كما تُعرض على الشاشة: القوائم الجاهزة أولاً
 * ثم البنود التي أضافها المستخدم.
 */
export interface DisplayChip extends SwotSuggestion {
  isCustom: boolean
}

export const getCategoryChips = (
  category: SwotQuadrantKey,
  selection: SwotCategorySelection
): DisplayChip[] => [
  ...swotSuggestions[category].map((s) => ({ ...s, isCustom: false })),
  ...selection.customItems.map((item) => ({
    id: item.id,
    label: item.label,
    isCustom: true,
  })),
]

/** نص أي بند بمعرّفه — جاهزاً كان أو مخصّصاً */
export const labelOf = (
  id: string,
  selection: SwotCategorySelection
): string | undefined =>
  swotSuggestionIndex[id]?.label ??
  selection.customItems.find((item) => item.id === id)?.label

/** عدد الاختيارات في مجموعة واحدة */
export const countSelected = (selection: SwotCategorySelection): number =>
  selection.selectedIds.length

/** العدد الإجمالي للاختيارات في المجموعات الأربع */
export const countAllSelected = (selections: SwotSelections): number =>
  SWOT_CATEGORY_ORDER.reduce(
    (total, category) => total + countSelected(selections[category]),
    0
  )

/**
 * أزواج القوة/الضعف التي اختار المستخدم طرفيها معاً.
 * لا نمنع الاختيار — قد يقصد تفاوتاً بين أقسام المشروع — بل نُبلغه
 * ونمرّر التعارض للنموذج ليعالجه في الشرح.
 */
export interface SwotConflict {
  strengthId: string
  weaknessId: string
  strength: string
  weakness: string
}

export const findConflicts = (selections: SwotSelections): SwotConflict[] => {
  const weaknessSelected = new Set(selections.weaknesses.selectedIds)

  return selections.strengths.selectedIds
    .map((strengthId) => {
      const suggestion = swotSuggestionIndex[strengthId]
      const weaknessId = suggestion?.pairId
      if (!weaknessId || !weaknessSelected.has(weaknessId)) return null
      return {
        strengthId,
        weaknessId,
        strength: suggestion.label,
        weakness: swotSuggestionIndex[weaknessId]?.label ?? "",
      }
    })
    .filter((conflict): conflict is SwotConflict => conflict !== null)
}

/** معرّفات البنود المتعارضة — لعرض التنبيه تحت البطاقة المعنيّة */
export const conflictIdSet = (conflicts: SwotConflict[]): Set<string> =>
  new Set(conflicts.flatMap((c) => [c.strengthId, c.weaknessId]))

/**
 * تحويل الاختيارات إلى حِمل الإرسال: نصوص فقط + أزواج التعارض.
 * ترتيب البنود يتبع ترتيب القوائم المرجعية ثم البنود المخصّصة،
 * فلا يتغيّر الـ Prompt بتغيّر ترتيب النقر.
 */
export const buildSelectionPayload = (
  selections: SwotSelections
): SwotSelectionPayload => {
  const items = SWOT_CATEGORY_ORDER.reduce((acc, category) => {
    const selection = selections[category]
    const selected = new Set(selection.selectedIds)
    acc[category] = getCategoryChips(category, selection)
      .filter((chip) => selected.has(chip.id))
      .map((chip) => chip.label)
    return acc
  }, {} as Record<SwotQuadrantKey, string[]>)

  return {
    items,
    conflicts: findConflicts(selections).map(({ strength, weakness }) => ({
      strength,
      weakness,
    })),
  }
}

/** هل هناك أي اختيار على الإطلاق؟ */
export const hasAnySelection = (payload?: SwotSelectionPayload | null): boolean =>
  Boolean(
    payload &&
      SWOT_CATEGORY_ORDER.some((category) => payload.items[category]?.length)
  )

// ─────────────────────────────────────────────────────────────
//  التحقق من البنود المخصّصة
// ─────────────────────────────────────────────────────────────

/**
 * يتحقّق من بند مخصّص جديد ويعيد رسالة خطأ عربية أو null عند القبول.
 * المقارنة تتجاهل التشكيل والمسافات الزائدة، وتشمل القائمة الجاهزة
 * والبنود المخصّصة معاً — فلا يُضاف بند موجود أصلاً بصياغة مختلفة شكلاً.
 */
export const validateCustomItem = (
  rawValue: string,
  category: SwotQuadrantKey,
  selection: SwotCategorySelection
): string | null => {
  const value = rawValue.trim()

  if (!value) return "اكتب نص البند قبل الإضافة"
  if (value.length > MAX_CUSTOM_ITEM_LENGTH) {
    return `الحد الأقصى ${MAX_CUSTOM_ITEM_LENGTH} حرفاً (الحالي ${value.length})`
  }
  if (selection.customItems.length >= MAX_CUSTOM_ITEMS_PER_CATEGORY) {
    return `بلغت الحد الأقصى ${MAX_CUSTOM_ITEMS_PER_CATEGORY} بنود مخصّصة في هذه المجموعة`
  }

  const normalized = normalizeArabic(value)
  const existing = getCategoryChips(category, selection)
  if (existing.some((chip) => normalizeArabic(chip.label) === normalized)) {
    return "هذا البند موجود في القائمة بالفعل"
  }

  return null
}

/**
 * يتحقّق من نص معدَّل لبند مخصّص قائم. يطابق validateCustomItem في كل شيء
 * عدا سقفَي العدد والتكرار مع الذات: التعديل لا يضيف بنداً جديداً، والبند
 * نفسه — بصياغته القديمة — لا يُحتسب تكراراً لصياغته الجديدة.
 */
export const validateEditCustomItem = (
  rawValue: string,
  category: SwotQuadrantKey,
  selection: SwotCategorySelection,
  itemId: string
): string | null => {
  const value = rawValue.trim()

  if (!value) return "اكتب نص البند قبل الحفظ"
  if (value.length > MAX_CUSTOM_ITEM_LENGTH) {
    return `الحد الأقصى ${MAX_CUSTOM_ITEM_LENGTH} حرفاً (الحالي ${value.length})`
  }

  const normalized = normalizeArabic(value)
  const existing = getCategoryChips(category, selection)
  if (
    existing.some(
      (chip) => chip.id !== itemId && normalizeArabic(chip.label) === normalized
    )
  ) {
    return "هذا البند موجود في القائمة بالفعل"
  }

  return null
}

// ─────────────────────────────────────────────────────────────
//  توافُق المسودات القديمة
// ─────────────────────────────────────────────────────────────

/**
 * المسودات المحفوظة قبل هذه المرحلة تحمل الأرباع كقوائم نصوص
 * (string[]) لا كبنود (SwotItem[]). نرقّيها عند القراءة حتى لا يرى
 * المستخدم شاشة فارغة أو خطأ تصيير.
 */
export const toSwotItems = (value: unknown): SwotItem[] => {
  if (!Array.isArray(value)) return []
  return value
    .map((entry): SwotItem | null => {
      if (typeof entry === "string") {
        const title = entry.trim()
        return title ? { title, source: "ai" } : null
      }
      if (entry && typeof entry === "object") {
        const raw = entry as Partial<SwotItem> & { text?: string }
        const title = String(raw.title ?? raw.text ?? "").trim()
        if (!title) return null
        return {
          title,
          detail: raw.detail ? String(raw.detail).trim() : undefined,
          source: raw.source === "user" ? "user" : "ai",
          importance:
            raw.importance === "high" ||
            raw.importance === "medium" ||
            raw.importance === "low"
              ? raw.importance
              : undefined,
        }
      }
      return null
    })
    .filter((item): item is SwotItem => item !== null)
}

/** يرقّي كائن اختيارات مقروء من التخزين إلى الشكل الكامل الحالي */
export const normalizeStoredSelections = (value: unknown): SwotSelections => {
  const base = emptySwotSelections()
  if (!value || typeof value !== "object") return base

  const stored = value as Partial<Record<SwotQuadrantKey, unknown>>

  for (const category of SWOT_CATEGORY_ORDER) {
    const entry = stored[category] as Partial<SwotCategorySelection> | undefined
    if (!entry) continue

    const customItems = Array.isArray(entry.customItems)
      ? entry.customItems
          .filter(
            (item): item is { id: string; label: string } =>
              Boolean(item) &&
              typeof (item as any).id === "string" &&
              typeof (item as any).label === "string"
          )
          .slice(0, MAX_CUSTOM_ITEMS_PER_CATEGORY)
          .map((item) => ({
            id: item.id,
            label: item.label.slice(0, MAX_CUSTOM_ITEM_LENGTH),
          }))
      : []

    const validIds = new Set([
      ...swotSuggestions[category].map((s) => s.id),
      ...customItems.map((item) => item.id),
    ])

    base[category] = {
      customItems,
      // نُسقط أي معرّف لم يبقَ موجوداً (بند حُذف من القوائم المرجعية)
      selectedIds: Array.isArray(entry.selectedIds)
        ? Array.from(
            new Set(
              entry.selectedIds.filter(
                (id): id is string => typeof id === "string" && validIds.has(id)
              )
            )
          )
        : [],
    }
  }

  return base
}
