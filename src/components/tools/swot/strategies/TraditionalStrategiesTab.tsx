import React, { useMemo } from "react"
import {
  Lightbulb,
  Sparkles,
  Users,
  Briefcase,
  Package,
  Coins,
  Megaphone,
  Building2,
  Handshake,
  FolderKanban,
} from "lucide-react"
import type { SwotAnalysis, SwotItem, SwotQuadrantKey } from "@/types/swot"
import {
  generateCategoryRecommendation,
  validateAndSanitizeCategoryRecommendation,
  type CategorizedItem,
} from "@/utils/swotCategory"

interface TraditionalStrategiesTabProps {
  analysis: SwotAnalysis
}

const CATEGORIES = {
  management: { label: "إدارة واستراتيجية", keywords: ["إدارة", "استراتيجية", "قيادة", "تخطيط", "تنظيم", "توجيه", "إشراف"] },
  product: { label: "منتج وإنتاج", keywords: ["منتج", "إنتاج", "جودة", "تصنيع", "خدمة", "تطوير", "ابتكار", "تصميم", "تقنية"] },
  hr: { label: "موارد بشرية وثقافة", keywords: ["موظف", "بشرية", "ثقافة", "تدريب", "توظيف", "مهارة", "فريق", "عمل", "كفاءة"] },
  finance: { label: "تمويل وموارد", keywords: ["تمويل", "مال", "ميزانية", "سيولة", "استثمار", "رأس مال", "إيرادات", "أرباح", "تكلفة", "نفقات", "تمويل"] },
  marketing: { label: "تسويق وعلاقات", keywords: ["تسويق", "علاقات", "عملاء", "مبيعات", "سوق", "علامة", "هوية", "إعلان", "ترويج", "جمهور", "ولاء"] },
  infrastructure: { label: "بنية تحتية وموقع", keywords: ["بنية", "تحتية", "موقع", "معدات", "أجهزة", "مرافق", "لوجستيات", "مساحة"] },
  partnerships: { label: "شراكات ودعم خارجي", keywords: ["شراكة", "دعم", "خارجي", "مورد", "حكومة", "قانون", "تشريع", "مستثمر", "علاقات"] },
  other: { label: "عوامل أخرى", keywords: [] },
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "إدارة واستراتيجية": <Briefcase className="w-4 h-4 text-indigo-600 shrink-0" />,
  "منتج وإنتاج": <Package className="w-4 h-4 text-emerald-600 shrink-0" />,
  "موارد بشرية وثقافة": <Users className="w-4 h-4 text-blue-600 shrink-0" />,
  "تمويل وموارد": <Coins className="w-4 h-4 text-amber-600 shrink-0" />,
  "تسويق وعلاقات": <Megaphone className="w-4 h-4 text-purple-600 shrink-0" />,
  "بنية تحتية وموقع": <Building2 className="w-4 h-4 text-teal-600 shrink-0" />,
  "شراكات ودعم خارجي": <Handshake className="w-4 h-4 text-sky-600 shrink-0" />,
  "عوامل أخرى": <FolderKanban className="w-4 h-4 text-slate-600 shrink-0" />,
}

const QUADRANT_STYLES: Record<
  SwotQuadrantKey,
  { bg: string; border: string; text: string; badgeBg: string; badgeText: string; label: string }
> = {
  strengths: {
    bg: "bg-emerald-50/70",
    border: "border-emerald-200/80",
    text: "text-emerald-950",
    badgeBg: "bg-emerald-100",
    badgeText: "text-emerald-800",
    label: "نقاط القوة",
  },
  weaknesses: {
    bg: "bg-rose-50/70",
    border: "border-rose-200/80",
    text: "text-rose-950",
    badgeBg: "bg-rose-100",
    badgeText: "text-rose-800",
    label: "نقاط الضعف",
  },
  opportunities: {
    bg: "bg-sky-50/70",
    border: "border-sky-200/80",
    text: "text-sky-950",
    badgeBg: "bg-sky-100",
    badgeText: "text-sky-800",
    label: "الفرص",
  },
  threats: {
    bg: "bg-amber-50/70",
    border: "border-amber-200/80",
    text: "text-amber-950",
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-800",
    label: "المخاطر",
  },
}

/** تنسيق نص التوصية بشكل مريح ومقسّم بصرياً */
const FormattedRecommendation: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split("\n").filter((l) => l.trim().length > 0)

  const hasMultipleSteps = lines.some((l) => /^\d+\.\s/.test(l.trim()))
  const introLine = hasMultipleSteps && !/^\d+\.\s/.test(lines[0].trim()) ? lines[0] : null
  const stepLines = hasMultipleSteps
    ? lines.filter((l) => /^\d+\.\s/.test(l.trim()))
    : lines

  const renderRichText = (str: string) => {
    const parts = str.split(/(«[^»]+»)/g)
    return parts.map((part, idx) => {
      if (part.startsWith("«") && part.endsWith("»")) {
        return (
          <span
            key={idx}
            className="inline-block mx-0.5 px-2 py-0.5 rounded-md font-semibold text-indigo-950 bg-indigo-100/80 border border-indigo-200/70 text-xs shadow-2xs"
          >
            {part}
          </span>
        )
      }
      return <span key={idx}>{part}</span>
    })
  }

  return (
    <div className="space-y-2 text-xs md:text-sm text-slate-700 leading-relaxed">
      {introLine && (
        <p className="font-medium text-indigo-950 mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <span>{introLine}</span>
        </p>
      )}

      {hasMultipleSteps ? (
        <div className="space-y-2">
          {stepLines.map((line, idx) => {
            const cleanLine = line.replace(/^\d+\.\s*/, "")
            return (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/90 border border-indigo-100/90 shadow-2xs transition-all hover:border-indigo-200"
              >
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[11px] shrink-0 mt-0.5 shadow-2xs">
                  {idx + 1}
                </span>
                <div className="flex-1 leading-normal text-slate-800">
                  {renderRichText(cleanLine)}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-white/90 border border-indigo-100/90 shadow-2xs text-slate-800 leading-relaxed">
          {renderRichText(text)}
        </div>
      )}
    </div>
  )
}

export const TraditionalStrategiesTab: React.FC<TraditionalStrategiesTabProps> = ({ analysis }) => {
  const categorizedData = useMemo(() => {
    const result: Record<string, CategorizedItem[]> = {}

    Object.values(CATEGORIES).forEach((cat) => {
      result[cat.label] = []
    })

    const classifyItem = (item: SwotItem, quadrantKey: SwotQuadrantKey) => {
      const textToSearch = `${item.title} ${item.detail ?? ""}`.toLowerCase()

      let matchedCategory = CATEGORIES.other.label
      for (const [key, category] of Object.entries(CATEGORIES)) {
        if (key === "other") continue
        if (category.keywords.some((kw) => textToSearch.includes(kw.toLowerCase()))) {
          matchedCategory = category.label
          break
        }
      }

      result[matchedCategory].push({ item, quadrantKey })
    }

    classifyItemFromQuadrant("strengths", analysis.strengths)
    classifyItemFromQuadrant("weaknesses", analysis.weaknesses)
    classifyItemFromQuadrant("opportunities", analysis.opportunities)
    classifyItemFromQuadrant("threats", analysis.threats)

    function classifyItemFromQuadrant(key: SwotQuadrantKey, items?: SwotItem[]) {
      if (!items) return
      items.forEach((item) => classifyItem(item, key))
    }

    return Object.entries(result).filter(([_, items]) => items.length > 0)
  }, [analysis])

  if (categorizedData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-slate-500 border rounded-2xl bg-slate-50 mt-4">
        <p>لا توجد بيانات كافية لتوليد الاستراتيجيات. يرجى إضافة بنود للتحليل أولاً.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
      {categorizedData.map(([categoryLabel, items], index) => {
        const rawRec = generateCategoryRecommendation(categoryLabel, items)
        const recText = validateAndSanitizeCategoryRecommendation(rawRec, categoryLabel, items)

        return (
          <div
            key={index}
            className="group border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-2xs hover:shadow-md hover:border-indigo-200 transition-all duration-200 flex flex-col"
          >
            {/* Header */}
            <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-white shadow-2xs border border-slate-200/60">
                  {CATEGORY_ICONS[categoryLabel] ?? <Briefcase className="w-4 h-4 text-slate-600" />}
                </div>
                <h4 className="font-bold text-slate-800 text-sm md:text-base">{categoryLabel}</h4>
              </div>
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-200/60 text-slate-700">
                {items.length} {items.length === 1 ? "عنصر" : "عناصر"}
              </span>
            </div>

            {/* Elements list */}
            <div className="p-4 flex-1 flex flex-col gap-2.5">
              <ul className="flex flex-col gap-2">
                {items.map((entry, idx) => {
                  const style = QUADRANT_STYLES[entry.quadrantKey]
                  return (
                    <li
                      key={idx}
                      className={`text-xs md:text-sm px-3.5 py-2.5 rounded-xl border ${style.bg} ${style.border} transition-all`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full shadow-2xs ${style.badgeBg} ${style.badgeText}`}
                        >
                          {style.label}
                        </span>
                        <span className={`font-semibold leading-relaxed ${style.text}`}>
                          {entry.item.title}
                        </span>
                      </div>
                      {entry.item.detail && (
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2 pr-1 opacity-90">
                          {entry.item.detail}
                        </p>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>

            {/* Dynamic Eye-Friendly Recommendation Section */}
            <div className="bg-gradient-to-br from-indigo-50/80 via-slate-50/40 to-blue-50/60 p-4 border-t border-indigo-100/90 mt-auto">
              <div className="flex items-center gap-1.5 mb-2.5">
                <div className="p-1 rounded-md bg-indigo-600 text-white shadow-2xs">
                  <Lightbulb className="w-3.5 h-3.5" />
                </div>
                <span className="font-bold text-indigo-950 text-xs md:text-sm">
                  توصية عملية موجهة:
                </span>
              </div>
              <FormattedRecommendation text={recText} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
