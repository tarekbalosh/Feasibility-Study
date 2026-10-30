export type PorterForceKey =
  | "newEntrants"
  | "buyers"
  | "suppliers"
  | "substitutes"
  | "rivalry";

export type PorterFieldKey = "trends" | "positiveImpacts" | "negativeImpacts";

export type PorterCreationMode = "manual" | "ai" | "hybrid";

export type PorterStatus = "draft" | "completed";

export interface PorterForceContent {
  trends: string;
  positiveImpacts: string;
  negativeImpacts: string;
  items?: PorterFactorItem[];
}

export type PorterForces = Record<PorterForceKey, PorterForceContent>;

export type PorterFactorSource = "manual" | "ai" | "ai_edited";

export interface PorterFactorItem {
  id: string;
  force: PorterForceKey;
  field: PorterFieldKey;
  content: string;
  source: PorterFactorSource;
  sortOrder?: number;
  parentFactorId?: string | null;
}

export interface CreateLinkedPorterFactorPayload {
  force: PorterForceKey;
  content: string;
  positiveImplication: string;
  negativeImplication: string;
  positiveSource?: PorterFactorSource;
  negativeSource?: PorterFactorSource;
}

export interface SuggestPorterImplicationsPayload {
  force: PorterForceKey;
  content: string;
  projectName?: string;
  projectDescription?: string;
  industry?: string;
  countryRegion?: string;
}

export interface SuggestPorterImplicationsResponse {
  success: boolean;
  data: {
    positiveImplication: string;
    negativeImplication: string;
    model: string;
  };
}

export type PorterFactorsMap = Record<
  PorterForceKey,
  Record<PorterFieldKey, PorterFactorItem[]>
>;

export interface PorterAnalysisSummary {
  id: string;
  title: string;
  projectName?: string | null;
  projectDescription?: string | null;
  industry?: string | null;
  countryRegion?: string | null;
  status: PorterStatus;
  creationMode: PorterCreationMode;
  createdAt: string;
  updatedAt: string;
  department?: {
    id: string;
    name: string;
    color: string;
    icon: string;
  } | null;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
  filledFields: number;
  totalFields: number;
}

export interface PorterAnalysisDetail {
  id: string;
  title: string;
  projectName?: string | null;
  projectDescription?: string | null;
  industry?: string | null;
  countryRegion?: string | null;
  status: PorterStatus;
  creationMode: PorterCreationMode;
  language: string;
  createdAt: string;
  updatedAt: string;
  department?: {
    id: string;
    name: string;
    color: string;
    icon: string;
  } | null;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
  accessLevel: "view" | "edit" | "manage";
  forces: PorterForces;
}

export interface ForceMeta {
  key: PorterForceKey;
  order: number;
  title: string;
  englishLabel: string;
  shortDesc: string;
  colors: {
    bgLight: string;
    bgHeader: string;
    border: string;
    borderHover: string;
    text: string;
    badge: string;
    accent: string;
    iconBg: string;
    printHeaderBg: string;
    printBorder: string;
  };
}

export const FORCES_ORDER: PorterForceKey[] = [
  "newEntrants",
  "buyers",
  "suppliers",
  "substitutes",
  "rivalry",
];

export const PORTER_FORCE_CONFIG: Record<PorterForceKey, ForceMeta> = {
  newEntrants: {
    key: "newEntrants",
    order: 1,
    title: "المنافسون الجدد",
    englishLabel: "New Entrants",
    shortDesc: "حواجز الدخول، سهولة تأسيس مشاريع منافسة، والتشريعات المنظمة للقطاع.",
    colors: {
      bgLight: "bg-emerald-50/40",
      bgHeader: "bg-[#e2f0d9] text-[#276a3c]",
      border: "border-emerald-200",
      borderHover: "hover:border-emerald-300",
      text: "text-emerald-900",
      badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
      accent: "text-emerald-600",
      iconBg: "bg-emerald-600 text-white shadow-emerald-500/20",
      printHeaderBg: "#e2f0d9",
      printBorder: "#bbf0d6",
    },
  },
  buyers: {
    key: "buyers",
    order: 2,
    title: "العملاء والجمهور",
    englishLabel: "Buyers & Customers",
    shortDesc: "القوة التفاوضية للعملاء، حساسية الأسعار، وتكلفة الانتقال لمنافس آخر.",
    colors: {
      bgLight: "bg-sky-50/40",
      bgHeader: "bg-[#d9e1f2] text-[#1f4e79]",
      border: "border-sky-200",
      borderHover: "hover:border-sky-300",
      text: "text-sky-900",
      badge: "bg-sky-100 text-sky-800 border-sky-200",
      accent: "text-sky-600",
      iconBg: "bg-sky-600 text-white shadow-sky-500/20",
      printHeaderBg: "#d9e1f2",
      printBorder: "#bae6fd",
    },
  },
  suppliers: {
    key: "suppliers",
    order: 3,
    title: "مزودو الخدمة والموردون",
    englishLabel: "Suppliers",
    shortDesc: "تركّز الموردين، قدرتهم على التحكم بالأسعار وجودة المدخلات وسلاسل الإمداد.",
    colors: {
      bgLight: "bg-amber-50/40",
      bgHeader: "bg-[#fff2cc] text-[#806000]",
      border: "border-amber-200",
      borderHover: "hover:border-amber-300",
      text: "text-amber-900",
      badge: "bg-amber-100 text-amber-800 border-amber-200",
      accent: "text-amber-600",
      iconBg: "bg-amber-600 text-white shadow-amber-500/20",
      printHeaderBg: "#fff2cc",
      printBorder: "#fde68a",
    },
  },
  substitutes: {
    key: "substitutes",
    order: 4,
    title: "المنتجات البديلة",
    englishLabel: "Substitutes",
    shortDesc: "توفر حلول وبدائل رقمية أو تقليدية تلبي نفس الحاجة بتكلفة أو مجهود أقل.",
    colors: {
      bgLight: "bg-orange-50/40",
      bgHeader: "bg-[#fce4d6] text-[#833c0c]",
      border: "border-orange-200",
      borderHover: "hover:border-orange-300",
      text: "text-orange-900",
      badge: "bg-orange-100 text-orange-800 border-orange-200",
      accent: "text-orange-600",
      iconBg: "bg-orange-600 text-white shadow-orange-500/20",
      printHeaderBg: "#fce4d6",
      printBorder: "#fed7aa",
    },
  },
  rivalry: {
    key: "rivalry",
    order: 5,
    title: "المنافسة الحالية",
    englishLabel: "Industry Rivalry",
    shortDesc: "شدة المنافسة بين اللاعبين القائمين، حروب الأسعار، وحجم النمو الكلي للسوق.",
    colors: {
      bgLight: "bg-indigo-50/40",
      bgHeader: "bg-[#e8eaf6] text-[#283593]",
      border: "border-indigo-200",
      borderHover: "hover:border-indigo-300",
      text: "text-indigo-900",
      badge: "bg-indigo-100 text-indigo-800 border-indigo-200",
      accent: "text-indigo-600",
      iconBg: "bg-indigo-600 text-white shadow-indigo-500/20",
      printHeaderBg: "#e8eaf6",
      printBorder: "#c7d2fe",
    },
  },
};

export const FIELD_LABELS: Record<PorterFieldKey, string> = {
  trends: "أبرز التوجهات والمؤشرات",
  positiveImpacts: "الانعكاسات الإيجابية المحتملة",
  negativeImpacts: "الانعكاسات السلبية المحتملة",
};

export const CREATION_MODE_LABELS: Record<
  PorterCreationMode,
  { label: string; color: string }
> = {
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
};

export function textToFactorItems(
  text: string,
  force: PorterForceKey,
  field: PorterFieldKey,
  defaultSource: PorterFactorSource = "manual"
): PorterFactorItem[] {
  if (!text) return [];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  return lines.map((line, idx) => ({
    id: `${force}-${field}-${idx}-${Math.random().toString(36).slice(2, 7)}`,
    force,
    field,
    content: line,
    source: defaultSource,
    sortOrder: idx,
  }));
}

export function factorItemsToText(items: PorterFactorItem[]): string {
  if (!items || items.length === 0) return "";
  return items
    .map((it) => it.content.trim())
    .filter(Boolean)
    .join("\n");
}

export function forcesToFactorsMap(
  forces: PorterForces,
  defaultSource: PorterFactorSource = "manual"
): PorterFactorsMap {
  const result: any = {};
  for (const f of FORCES_ORDER) {
    const rawForce = forces[f];
    const items = rawForce?.items;

    if (Array.isArray(items) && items.length > 0) {
      result[f] = {
        trends: items.filter((it) => it.field === "trends"),
        positiveImpacts: items.filter((it) => it.field === "positiveImpacts"),
        negativeImpacts: items.filter((it) => it.field === "negativeImpacts"),
      };
    } else {
      // Legacy fallback: convert lines to items and pair index i
      const trends = textToFactorItems(rawForce?.trends || "", f, "trends", defaultSource);
      const positiveImpacts = textToFactorItems(
        rawForce?.positiveImpacts || "",
        f,
        "positiveImpacts",
        defaultSource
      ).map((it, idx) => ({
        ...it,
        parentFactorId: trends[idx]?.id || null,
      }));
      const negativeImpacts = textToFactorItems(
        rawForce?.negativeImpacts || "",
        f,
        "negativeImpacts",
        defaultSource
      ).map((it, idx) => ({
        ...it,
        parentFactorId: trends[idx]?.id || null,
      }));

      result[f] = { trends, positiveImpacts, negativeImpacts };
    }
  }
  return result as PorterFactorsMap;
}

export function factorsMapToForces(map: PorterFactorsMap): PorterForces {
  const result: any = {};
  for (const f of FORCES_ORDER) {
    const trends = map[f]?.trends || [];
    const positiveImpacts = map[f]?.positiveImpacts || [];
    const negativeImpacts = map[f]?.negativeImpacts || [];
    const items = [...trends, ...positiveImpacts, ...negativeImpacts];

    result[f] = {
      trends: factorItemsToText(trends),
      positiveImpacts: factorItemsToText(positiveImpacts),
      negativeImpacts: factorItemsToText(negativeImpacts),
      items,
    };
  }
  return result as PorterForces;
}

