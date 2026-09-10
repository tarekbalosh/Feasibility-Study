import type { SwotItem, SwotQuadrantKey } from "@/types/swot"
import { normalizeArabic } from "@/config/swotSuggestions"

export interface CategorizedItem {
  item: SwotItem
  quadrantKey: SwotQuadrantKey
}

const QUADRANT_ACTION_VERBS: Record<SwotQuadrantKey, { verb: string; goal: string }> = {
  strengths: { verb: "استثمار وتوظيف", goal: "لتأكيد التفوق التشغيلي والتنافسي" },
  weaknesses: { verb: "معالجة وتدارك", goal: "لسد الفجوة وتفادي الآثار السلبية" },
  opportunities: { verb: "اقتناص واستغلال", goal: "لتحقيق النمو والتوسع" },
  threats: { verb: "التحوط والوقاية من", goal: "لحماية استقرار المشروع وحياده" },
}

/**
 * بناء توصية فئوية ديناميكية ومباشرة تعتمد حصرياً على نصوص وعناوين البنود داخل الفئة
 */
export const generateCategoryRecommendation = (
  categoryLabel: string,
  items: CategorizedItem[]
): string => {
  if (!items || items.length === 0) {
    return "يُنصح بمراجعة هذه الفئة بشكل دوري لضمان استدامة النمو ومعالجة أي فجوات."
  }

  // إذا كانت الفئة تحتوي على عنصر واحد فقط
  if (items.length === 1) {
    const { item, quadrantKey } = items[0]
    const { verb, goal } = QUADRANT_ACTION_VERBS[quadrantKey]
    const title = item.title.trim()
    const detail = item.detail?.trim()

    if (detail && detail.length > 5 && !detail.includes(title)) {
      return `${verb} «${title}» (${detail}) ${goal}.`
    }
    return `${verb} «${title}» ${goal}.`
  }

  // إذا كانت الفئة تحتوي على أكثر من عنصر (مثل عوامل أخرى أو تجمعات مفصلة)
  const itemRecommendations = items.map(({ item, quadrantKey }, index) => {
    const { verb } = QUADRANT_ACTION_VERBS[quadrantKey]
    const title = item.title.trim()
    const detail = item.detail?.trim()
    const desc = detail && detail.length > 5 && !detail.includes(title) ? ` (${detail})` : ""
    return `${index + 1}. ${verb} «${title}»${desc}`
  })

  return `تستوجب هذه الفئة إجراءات موجهة لكل عنصر:\n${itemRecommendations.join("\n")}`
}

/** الكلمات العامة المحظورة التي تشير للقوالب الثابتة إذا كانت غير موجودة في البنود */
const FORBIDDEN_STATIC_CONCEPTS = [
  "السيولة المتاحة",
  "احتياطي طوارئ",
  "تدريب الموظفين الحاليين",
  "راقب هذه العوامل بشكل مستمر واستعد لخطط بديلة",
]

/**
 * فحص وتنقية التوصية العملية للفئة والتأكد من عدم اعتمادها على مفاهيم عامة مغايرة للبنود
 */
export const validateAndSanitizeCategoryRecommendation = (
  recommendation: string,
  categoryLabel: string,
  items: CategorizedItem[]
): string => {
  if (!items || items.length === 0) return recommendation

  const normRec = normalizeArabic(recommendation)

  // 1. التأكد من عدم وجود القوالب الثابتة الخاطئة المحظورة عند عدم وجود كلماتها في البنود
  const itemTexts = items.map((i) => `${i.item.title} ${i.item.detail ?? ""}`).join(" ")
  const normItemTexts = normalizeArabic(itemTexts)

  for (const forbidden of FORBIDDEN_STATIC_CONCEPTS) {
    const normForbidden = normalizeArabic(forbidden)
    if (normRec.includes(normForbidden) && !normItemTexts.includes(normForbidden)) {
      // تم اكتشاف قالب ثابت عام لا يطابق محتوى البنود — استبدال فوراً بمولد البنود الديناميكي
      return generateCategoryRecommendation(categoryLabel, items)
    }
  }

  // 2. التأكد من أن التوصية تشير لعناوين بنود الفئة
  const allItemsMentioned = items.every(({ item }) => {
    const normTitle = normalizeArabic(item.title)
    const keywords = normTitle
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !["في", "من", "على", "عن", "إلى", "مع", "أو", "و"].includes(w))
    return keywords.some((kw) => normRec.includes(kw))
  })

  if (!allItemsMentioned) {
    return generateCategoryRecommendation(categoryLabel, items)
  }

  return recommendation
}
