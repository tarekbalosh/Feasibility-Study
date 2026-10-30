export type PestDimension =
  | "political"
  | "economic"
  | "social"
  | "technological"
  | "legal"

export type PestCategory = "trend" | "positive_impact" | "negative_impact"

export type PestFactorSource = "manual" | "ai" | "ai_edited"

export type PestCreationMode = "manual" | "ai" | "hybrid"

export type PestStatus = "draft" | "completed"

export interface PestFactor {
  id: string
  analysisId: string
  dimension: PestDimension
  category: PestCategory
  content: string
  sortOrder: number
  source: PestFactorSource
  createdById?: string | null
  parentFactorId?: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateLinkedFactorPayload {
  dimension: PestDimension
  content: string
  positiveImplication: string
  negativeImplication: string
  aiSuggested?: {
    positive?: string
    negative?: string
  } | null
}

export interface CreateLinkedFactorResponse {
  trend: PestFactor
  positive: PestFactor
  negative: PestFactor
  creationMode: PestCreationMode
}

export interface SuggestImplicationsPayload {
  dimension: PestDimension
  content: string
}

export interface SuggestImplicationsResponse {
  positiveImplication: string
  negativeImplication: string
  model?: string
}

export interface PestAnalysisSummary {
  id: string
  title: string
  projectName?: string | null
  projectDescription?: string | null
  industry?: string | null
  countryRegion?: string | null
  status: PestStatus
  creationMode: PestCreationMode
  createdAt: string
  updatedAt: string
  department?: {
    id: string
    name: string
    color: string
    icon: string
  } | null
  createdBy?: {
    id: string
    name: string
    email: string
  } | null
  factorsCount: number
}

export interface PestAnalysisDetail {
  id: string
  title: string
  projectName?: string | null
  projectDescription?: string | null
  industry?: string | null
  countryRegion?: string | null
  status: PestStatus
  creationMode: PestCreationMode
  language: string
  createdAt: string
  updatedAt: string
  department?: {
    id: string
    name: string
    color: string
    icon: string
  } | null
  createdBy?: {
    id: string
    name: string
    email: string
  } | null
  accessLevel: "view" | "edit" | "manage"
  factors: Record<PestDimension, Record<PestCategory, PestFactor[]>>
  factorsFlat: PestFactor[]
}

export interface DimensionMeta {
  key: PestDimension
  title: string
  englishLabel: string
  description: string
  colors: {
    bgLight: string
    bgHeader: string
    border: string
    text: string
    badge: string
    accent: string
    inputBg: string
    zebraBg: string
    printBg: string
  }
}

export const DIMENSIONS_ORDER: PestDimension[] = [
  "political",
  "economic",
  "social",
  "technological",
  "legal",
]

export const CATEGORIES_ORDER: PestCategory[] = [
  "trend",
  "positive_impact",
  "negative_impact",
]

export const PEST_DIMENSION_CONFIG: Record<PestDimension, DimensionMeta> = {
  political: {
    key: "political",
    title: "البعد السياسي",
    englishLabel: "Political",
    description: "الاستقرار الحكومي، السياسات الضريبية والتجارية، القيود التشريعية والدولية.",
    colors: {
      bgLight: "bg-emerald-50/30",
      bgHeader: "bg-[#e2f7ed] text-[#13613c]",
      border: "border-[#bbf0d6]",
      text: "text-emerald-900",
      badge: "bg-emerald-100 text-emerald-800",
      accent: "text-emerald-600",
      inputBg: "focus:bg-emerald-50/40",
      zebraBg: "bg-[#f5fbf7]",
      printBg: "#e2f7ed",
    },
  },
  economic: {
    key: "economic",
    title: "البعد الاقتصادي",
    englishLabel: "Economic",
    description: "معدلات الفائدة والتضخم، القوة الشرائية للمستهلكين، مراحل الدورة الاقتصادية وأسعار الصرف.",
    colors: {
      bgLight: "bg-sky-50/30",
      bgHeader: "bg-[#e0f2fe] text-[#0369a1]",
      border: "border-[#bae6fd]",
      text: "text-sky-900",
      badge: "bg-sky-100 text-sky-800",
      accent: "text-sky-600",
      inputBg: "focus:bg-sky-50/40",
      zebraBg: "bg-[#f0f9ff]",
      printBg: "#e0f2fe",
    },
  },
  social: {
    key: "social",
    title: "البعد الاجتماعي",
    englishLabel: "Social",
    description: "التركيبة السكانية، أنماط الاستهلاك، الوعي الصحي والثقافي، والتغيرات المجتمعية.",
    colors: {
      bgLight: "bg-amber-50/30",
      bgHeader: "bg-[#fef3c7] text-[#92400e]",
      border: "border-[#fde68a]",
      text: "text-amber-900",
      badge: "bg-amber-100 text-amber-800",
      accent: "text-amber-600",
      inputBg: "focus:bg-amber-50/40",
      zebraBg: "bg-[#fffbeb]",
      printBg: "#fef3c7",
    },
  },
  technological: {
    key: "technological",
    title: "البعد التقني",
    englishLabel: "Technological",
    description: "الأتمتة، الابتكارات الناشئة، بنية الاتصالات والإنترنت، وسرعة التحول الرقمي.",
    colors: {
      bgLight: "bg-orange-50/30",
      bgHeader: "bg-[#ffedd5] text-[#9a3412]",
      border: "border-[#fed7aa]",
      text: "text-orange-900",
      badge: "bg-orange-100 text-orange-800",
      accent: "text-orange-600",
      inputBg: "focus:bg-orange-50/40",
      zebraBg: "bg-[#fff7ed]",
      printBg: "#ffedd5",
    },
  },
  legal: {
    key: "legal",
    title: "البعد القانوني",
    englishLabel: "Legal",
    description: "قوانين العمل وحماية المستهلك، التراخيص والمطابقة، حقوق الملكية الفكرية والبيئة.",
    colors: {
      bgLight: "bg-slate-50/40",
      bgHeader: "bg-[#e2e8f0] text-[#334155]",
      border: "border-[#cbd5e1]",
      text: "text-slate-900",
      badge: "bg-slate-200 text-slate-800",
      accent: "text-slate-600",
      inputBg: "focus:bg-slate-100/50",
      zebraBg: "bg-[#f8fafc]",
      printBg: "#e2e8f0",
    },
  },
}

export const CATEGORY_LABELS: Record<PestCategory, string> = {
  trend: "أبرز التوجهات والمؤشرات",
  positive_impact: "الانعكاسات الإيجابية المحتملة",
  negative_impact: "الانعكاسات السلبية المحتملة",
}

export const CREATION_MODE_LABELS: Record<PestCreationMode, { label: string; color: string }> = {
  manual: {
    label: "يدوي",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  ai: {
    label: "ذكاء اصطناعي",
    color: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  hybrid: {
    label: "مختلط",
    color: "bg-purple-50 text-purple-700 border-purple-200",
  },
}
