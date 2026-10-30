import { z } from "zod";
import OpenAI from "openai";
import {
  PEST_DIMENSIONS,
  PEST_CATEGORIES,
  PestDimensionKey,
  PestCategoryKey,
  PestFactorSourceKey,
  APPEND_COUNT_PER_CELL,
  DIMENSION_LABELS,
  CATEGORY_LABELS,
  MAX_FACTOR_CHARS,
  LINKED_TRENDS_COUNT,
} from "./pestConstants";
import { ImplicationCategory, isImplicationCategory } from "./pestLinks";
import { logger } from "../../utils/logger";

// ─────────────────────────────────────────────────────────────
// Zod Schemas
// ─────────────────────────────────────────────────────────────

export const generateRequestSchema = z.object({
  scope: z.enum(["full", "dimension", "category"]),
  dimension: z.enum(PEST_DIMENSIONS).optional(),
  category: z.enum(PEST_CATEGORIES).optional(),
  strategy: z.enum(["replace", "append"]).default("replace"),
  confirmOverwrite: z.boolean().default(false),
}).refine(
  (data) => {
    if (data.scope === "dimension" && !data.dimension) return false;
    if (data.scope === "category" && (!data.dimension || !data.category)) return false;
    return true;
  },
  {
    message: "يجب تحديد البُعد والفئة عند اختيار نطاق جزئي (dimension أو category).",
    path: ["dimension"],
  }
);

export type GenerateRequestInput = z.infer<typeof generateRequestSchema>;

const generatedTextSchema = z.string().trim().min(3).max(MAX_FACTOR_CHARS);

/** بند توجه مولّد مع انعكاسيه — البنية الإلزامية لمخرجات النموذج */
export const aiLinkedItemSchema = z.object({
  content: generatedTextSchema,
  positiveImplication: generatedTextSchema,
  negativeImplication: generatedTextSchema,
});
export type AiLinkedItem = z.infer<typeof aiLinkedItemSchema>;

/** انعكاس مولّد لبند موجود (توليد عمود الإيجابيات أو السلبيات) */
export const aiImplicationRefSchema = z.object({
  ref: z.string().trim().min(1),
  implication: generatedTextSchema,
});

/** اقتراح انعكاسين لبند واحد (زر «اقتراح بالذكاء الاصطناعي» في النموذج) */
export const aiSingleSuggestionSchema = z.object({
  positiveImplication: generatedTextSchema,
  negativeImplication: generatedTextSchema,
});

/**
 * يستخرج البنود الصالحة فقط من { items: [...] }. أي عنصر ينقصه أحد الحقول الثلاثة يُستبعد،
 * فلا يمكن أن يُحفظ توجه بلا انعكاسين أو انعكاس بلا بند أب.
 */
export function parseLinkedItems(raw: unknown): AiLinkedItem[] {
  const items = (raw as any)?.items;
  if (!Array.isArray(items)) return [];
  const valid: AiLinkedItem[] = [];
  for (const it of items) {
    const res = aiLinkedItemSchema.safeParse(it);
    if (res.success) valid.push(res.data);
  }
  return valid;
}

export function parseFullLinkedOutput(raw: unknown): Record<PestDimensionKey, AiLinkedItem[]> {
  const out = {} as Record<PestDimensionKey, AiLinkedItem[]>;
  for (const dim of PEST_DIMENSIONS) {
    out[dim] = parseLinkedItems((raw as any)?.[dim]);
  }
  return out;
}

export function parseImplicationRefs(raw: unknown, validRefs: Set<string>): Map<string, string> {
  const items = (raw as any)?.items;
  const result = new Map<string, string>();
  if (!Array.isArray(items)) return result;
  for (const it of items) {
    const res = aiImplicationRefSchema.safeParse(it);
    if (res.success && validRefs.has(res.data.ref) && !result.has(res.data.ref)) {
      result.set(res.data.ref, res.data.implication);
    }
  }
  return result;
}

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface ExistingFactor {
  id: string;
  dimension: PestDimensionKey;
  category: PestCategoryKey;
  content: string;
  sortOrder: number;
  source: PestFactorSourceKey;
  parentFactorId?: string | null;
}

/** صيغة قديمة لبند مقترح منفرد (محفوظة للتوافق مع الاختبارات القائمة) */
export interface ProposedFactor {
  dimension: PestDimensionKey;
  category: PestCategoryKey;
  content: string;
  source: PestFactorSourceKey;
}

/** بند توجه مقترح مع انعكاسيه */
export interface ProposedTriple {
  dimension: PestDimensionKey;
  content: string;
  positiveImplication: string;
  negativeImplication: string;
  source: PestFactorSourceKey;
}

/** انعكاس مقترح لبند توجه قائم */
export interface ProposedImplication {
  dimension: PestDimensionKey;
  category: ImplicationCategory;
  parentFactorId: string;
  content: string;
  source: PestFactorSourceKey;
}

export interface ProposedGeneration {
  triples: ProposedTriple[];
  implications: ProposedImplication[];
}

export interface GenerationContext {
  projectName: string;
  projectDescription?: string | null;
  industry?: string | null;
  countryRegion?: string | null;
  existingFactors: ExistingFactor[];
}

export interface MergeResult<T = ProposedFactor[]> {
  hasProtectedManualConflict: boolean;
  protectedManualCount: number;
  factorsToCreate: T;
  factorsToDeleteIds: string[];
}

type Tokens = { prompt: number; completion: number; total: number };
const ZERO_TOKENS: Tokens = { prompt: 0, completion: 0, total: 0 };

// ─────────────────────────────────────────────────────────────
// Pure Strategy / Merge Logic (Easily Testable)
// ─────────────────────────────────────────────────────────────

/** البنود الواقعة في النطاق المستهدف (مع انعكاسات التوجهات المستهدفة لأنها تُحذف معها) */
export function factorsInScope(
  scope: "full" | "dimension" | "category",
  targetDimension: PestDimensionKey | undefined,
  targetCategory: PestCategoryKey | undefined,
  existingFactors: ExistingFactor[]
): ExistingFactor[] {
  const direct = existingFactors.filter((f) => {
    if (scope === "full") return true;
    if (scope === "dimension") return f.dimension === targetDimension;
    if (scope === "category") return f.dimension === targetDimension && f.category === targetCategory;
    return false;
  });

  if (scope === "category" && targetCategory === "trend") {
    const trendIds = new Set(direct.map((f) => f.id));
    const children = existingFactors.filter(
      (f) => f.parentFactorId && trendIds.has(f.parentFactorId)
    );
    return [...direct, ...children];
  }
  return direct;
}

/**
 * دالة نقية تحدد ما الذي سيُحذف وما الذي سيُنشأ بناء على الاستراتيجية، النطاق، وحماية البنود اليدوية.
 */
export function computeMergePlan<T>(
  scope: "full" | "dimension" | "category",
  strategy: "replace" | "append",
  targetDimension: PestDimensionKey | undefined,
  targetCategory: PestCategoryKey | undefined,
  existingFactors: ExistingFactor[],
  newItems: T,
  confirmOverwrite: boolean
): MergeResult<T> {
  const empty = (Array.isArray(newItems) ? [] : newItems) as T;

  if (strategy === "append") {
    return {
      hasProtectedManualConflict: false,
      protectedManualCount: 0,
      factorsToCreate: newItems,
      factorsToDeleteIds: [],
    };
  }

  const inScopeExisting = factorsInScope(scope, targetDimension, targetCategory, existingFactors);

  // وضع replace: فحص البنود اليدوية والمعدلة
  const protectedItems = inScopeExisting.filter(
    (f) => f.source === "manual" || f.source === "ai_edited"
  );

  if (protectedItems.length > 0 && !confirmOverwrite) {
    return {
      hasProtectedManualConflict: true,
      protectedManualCount: protectedItems.length,
      factorsToCreate: empty,
      factorsToDeleteIds: [],
    };
  }

  return {
    hasProtectedManualConflict: false,
    protectedManualCount: protectedItems.length,
    factorsToCreate: newItems,
    factorsToDeleteIds: inScopeExisting.map((f) => f.id),
  };
}

/**
 * التوجهات المستهدفة عند توليد عمود الانعكاسات:
 *  - replace: كل توجهات البُعد (يُعاد توليد انعكاسها).
 *  - append: التوجهات التي ينقصها هذا النوع من الانعكاس فقط.
 */
export function selectImplicationTargets(
  existingFactors: ExistingFactor[],
  dimension: PestDimensionKey,
  category: ImplicationCategory,
  strategy: "replace" | "append"
): ExistingFactor[] {
  const trends = existingFactors
    .filter((f) => f.dimension === dimension && f.category === "trend")
    .sort((a, b) => a.sortOrder - b.sortOrder);
  if (strategy === "replace") return trends;
  const linked = new Set(
    existingFactors
      .filter((f) => f.category === category && f.parentFactorId)
      .map((f) => f.parentFactorId as string)
  );
  return trends.filter((t) => !linked.has(t.id));
}

/** هل الطلب يولّد انعكاسات لتوجهات قائمة (عمود الإيجابيات أو السلبيات)؟ */
export function isImplicationScope(
  scope: "full" | "dimension" | "category",
  category?: PestCategoryKey
): category is ImplicationCategory {
  return scope === "category" && isImplicationCategory(category);
}

// ─────────────────────────────────────────────────────────────
// OpenAI Prompt Builders
// ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `أنت خبير استراتيجي واقتصادي متخصص في دراسات الجدوى وتحليل البيئة الكلية والبيئة الخارجية للشركات (PEST Analysis).
مهمتك توليد بنود دقيقة، واقعية، ذات صلة ومحددة تماماً للمشروع المحدد، الدولة/المنطقة، والقطاع.
كل بند توجه أو مؤشر يجب أن يرافقه انعكاس إيجابي (فرصة) وانعكاس سلبي (مخاطرة) ناتجان عنه مباشرة وخاصّان به، وليسا عامّين.
تجنب العموميات والعبارات البديهية، وركز على التحديات والفرص التشريعية، الاقتصادية، الاجتماعية، والتقنية المؤثرة فعلياً على هذا النشاط.
أجب فقط بصيغة JSON صالحة دون أي نصوص تمهيدية أو Markdown خارج صيغة JSON.`;

const LINKED_ITEM_JSON = `{ "content": "نص التوجه أو المؤشر", "positiveImplication": "الانعكاس الإيجابي والفرصة الناتجة عن هذا التوجه", "negativeImplication": "الانعكاس السلبي والمخاطر الناتجة عن هذا التوجه" }`;

function projectBlock(ctx: GenerationContext): string {
  return `بيانات المشروع:
- اسم المشروع: ${ctx.projectName}
- وصف المشروع: ${ctx.projectDescription || "غير محدد"}
- القطاع: ${ctx.industry || "عام"}
- الدولة / المنطقة الجغرافية: ${ctx.countryRegion || "المملكة العربية السعودية / الشرق الأوسط"}`;
}

function existingBlock(ctx: GenerationContext): string {
  if (ctx.existingFactors.length === 0) return "";
  const list = ctx.existingFactors
    .map((f) => `- [${DIMENSION_LABELS[f.dimension]} / ${CATEGORY_LABELS[f.category]}] (${f.source}): ${f.content}`)
    .join("\n");
  return `
البنود الموجودة مسبقاً لدى المستخدم في هذا التحليل (يجب مراعاتها، عدم تكرارها أو نسخها حرفياً، بل البناء عليها واقتراح بنود إضافية تكاملية):
${list}
`;
}

export function buildLinkedPrompt(
  ctx: GenerationContext,
  scope: "full" | "dimension" | "category",
  strategy: "replace" | "append",
  targetDimension?: PestDimensionKey
): { system: string; user: string } {
  let instructions = "";
  let jsonFormat = "";

  if (scope === "full") {
    const n = strategy === "append" ? APPEND_COUNT_PER_CELL : LINKED_TRENDS_COUNT.full;
    instructions = `المطلوب توليد تحليل PEST متكامل لجميع الأبعاد الخمسة (${PEST_DIMENSIONS.map((d) => DIMENSION_LABELS[d]).join("، ")}).
لكل بُعد ${n} بنود في "أبرز التوجهات والمؤشرات"، ولكل بند انعكاس إيجابي واحد وانعكاس سلبي واحد مرتبطان به.`;
    jsonFormat = `{
${PEST_DIMENSIONS.map((d) => `  "${d}": { "items": [ ${LINKED_ITEM_JSON} ] }`).join(",\n")}
}`;
  } else if (targetDimension) {
    const n = strategy === "append" ? APPEND_COUNT_PER_CELL : LINKED_TRENDS_COUNT.dimension;
    instructions = `المطلوب توليد ${n} بنود جديدة في "أبرز التوجهات والمؤشرات" للبُعد [${DIMENSION_LABELS[targetDimension]}] فقط،
ولكل بند انعكاس إيجابي واحد وانعكاس سلبي واحد مرتبطان به.`;
    jsonFormat = `{ "items": [ ${LINKED_ITEM_JSON} ] }`;
  }

  const user = `${projectBlock(ctx)}
${existingBlock(ctx)}
${instructions}

يجب أن تكون مخرجاتك JSON تماماً بالهيكل التالي (الحقول الثلاثة إلزامية لكل بند):
${jsonFormat}`;

  return { system: SYSTEM_PROMPT, user };
}

export function buildImplicationsPrompt(
  ctx: GenerationContext,
  dimension: PestDimensionKey,
  category: ImplicationCategory,
  targets: Array<{ ref: string; content: string }>
): { system: string; user: string } {
  const kind =
    category === "positive_impact"
      ? "انعكاساً إيجابياً واحداً (فرصة) ناتجاً عنه مباشرة"
      : "انعكاساً سلبياً واحداً (مخاطرة) ناتجاً عنه مباشرة";
  const list = targets.map((t) => `- [${t.ref}] ${t.content}`).join("\n");
  const user = `${projectBlock(ctx)}

البُعد: ${DIMENSION_LABELS[dimension]}
اكتب لكل بند من بنود التوجهات التالية ${kind}، خاصاً بهذا المشروع:
${list}

يجب أن تكون مخرجاتك JSON تماماً بالهيكل التالي، مع إعادة نفس المعرّف ref لكل بند:
{ "items": [ { "ref": "t1", "implication": "..." } ] }`;
  return { system: SYSTEM_PROMPT, user };
}

export function buildSingleSuggestionPrompt(
  ctx: GenerationContext,
  dimension: PestDimensionKey,
  content: string
): { system: string; user: string } {
  const user = `${projectBlock(ctx)}

البُعد: ${DIMENSION_LABELS[dimension]}
بند التوجه أو المؤشر: «${content}»

اقترح انعكاساً إيجابياً واحداً (فرصة) وانعكاساً سلبياً واحداً (مخاطرة) ناتجين مباشرة عن هذا البند وخاصّين بهذا المشروع.
يجب أن تكون مخرجاتك JSON تماماً بالهيكل التالي:
{ "positiveImplication": "...", "negativeImplication": "..." }`;
  return { system: SYSTEM_PROMPT, user };
}

// ─────────────────────────────────────────────────────────────
// Heuristic fallback (بدون مفتاح OpenAI أو عند فشل الاستدعاء)
// ─────────────────────────────────────────────────────────────

function buildHeuristicPool(ctx: GenerationContext): Record<PestDimensionKey, Record<PestCategoryKey, string[]>> {
  const project = ctx.projectName || "المشروع";
  const industry = ctx.industry?.trim() || "القطاع العام";
  const country = ctx.countryRegion?.trim() || "المملكة العربية السعودية";

  const isFood = /أكل|طعام|مطعم|أغذية|وجبات|كافيه|مقهى|food|beverage/i.test(industry);

  return {
    political: {
      trend: [
        `مبادرات التمكين الحكومي وتشجيع المنشآت الصغيرة والمتوسطة في ${country}.`,
        `سياسات دعم توطين المحتوى المحلي وتعزيز سلاسل التوريد الوطنية لمشروعات ${industry}.`,
        `التوجهات الاستراتيجية لتنويع الاقتصاد ودعم الاستثمارات الواعدة في ${country}.`,
        `حزم التسهيلات الحكومية لرواد الأعمال في القطاعات الإنتاجية والخدمية.`,
      ],
      positive_impact: [
        `فرص الاستفادة من مبادرات التمويل التنموي وحاضنات الأعمال الداعمة لمشروع «${project}».`,
        `أولوية المناقصات والفرص المحلية للشركات الناشئة المسجلة نظامياً في ${country}.`,
        `استقرار السياسات الاقتصادية والبيئة الاستثمارية الداعمة لنمو المشروع وتوسعه.`,
        `تسريع إجراءات التأسيس والحصول على الحوافز المخصصة لرواد الأعمال.`,
      ],
      negative_impact: [
        `الالتزامات التنظيمية والرسوم المرتبطة بمتطلبات التوطين وتراخيص العمل.`,
        `التقلبات المحتملة في السياسات الجمركية أو قيود استيراد المواد الخام.`,
        `احتمالية تعديل تسعيرة الخدمات والمرافق الحكومية وارتفاع تكاليف التشغيل الأولية.`,
        `اشتداد المنافسة من مشاريع جديدة تستفيد من نفس الحوافز الحكومية.`,
      ],
    },
    economic: {
      trend: [
        isFood
          ? `تقلبات أسعار المواد الغذائية والمنتجات الزراعية وتكاليف سلاسل التبريد في ${country}.`
          : `تحولات القوة الشرائية وسلوك المستهلك نحو الموازنة بين الجودة والقيمة السعرية في ${country}.`,
        `ارتفاع معدلات التضخم وأثرها على تكاليف التشغيل وهوامش الربحية لمشاريع ${industry}.`,
        `تنامي الطلب المحلي على الحلول والمنتجات التنافسية ذات القيمة المضافة العالية.`,
        `تغير أنماط الإنفاق الأسري مع التركيز على الأساسيات والخدمات الأكثر كفاءة.`,
      ],
      positive_impact: [
        `فرصة الاستحواذ على حصة سوقية عبر تقديم خيارات تسعيرية مرنة ومدروسة.`,
        `إمكانية تحقيق هوامش ربحية ممتازة لمشروع «${project}» عبر ضبط الهدر وإدارة التكاليف بذكاء.`,
        `نمو حجم سوق ${industry} مع زيادة الكثافة السكانية ومعدلات الإنفاق في ${country}.`,
        `جذب شريحة العملاء الباحثين عن القيمة مقابل السعر بعروض مركّزة.`,
      ],
      negative_impact: [
        `حساسية العملاء تجاه تغير الأسعار في ظل الضغوط التضخمية.`,
        `ارتفاع تكاليف الإيجارات والمرافق في المواقع التجارية الحيوية.`,
        `المنافسة السعرية الحادة من المنافسين الكبار والبدائل المتوفرة في السوق.`,
        `تراجع الإنفاق على المنتجات غير الأساسية في فترات التباطؤ.`,
      ],
    },
    social: {
      trend: [
        isFood
          ? `الإقبال العالي على التجارب الغذائية المبتكرة وتنامي ثقافة ارتياد المطاعم والمقاهي كنمط حياة.`
          : `تنامي الوعي المجتمعي بجودة الخدمة وتفضيل العلامات الوطنية ذات الموثوقية العالية.`,
        `الاعتماد المتزايد على القنوات الرقمية والتوصيل السريع لمنتجات ${industry}.`,
        `التغيرات الديموغرافية وارتفاع نسبة فئة الشباب الباحثين عن خيارات سريعة وعصرية.`,
        `اهتمام المستهلكين بالممارسات الصحية ومعايير السلامة والاستدامة.`,
      ],
      positive_impact: [
        `بناء قاعدة عملاء وفية لمشروع «${project}» بالتركيز على جودة التجربة والخدمة المتميزة.`,
        `استثمار قنوات التواصل الاجتماعي للتسويق المباشر وصناعة محتوى مؤثر بتكلفة منخفضة.`,
        `استجابة المشروع السريعة لتطلعات المجتمع مقارنة بالشركات التقليدية البطيئة.`,
        `تمييز العلامة بممارسات صحية ومستدامة تعزز الثقة والسمعة.`,
      ],
      negative_impact: [
        `صعوبة تلبية التوقعات المرتفعة للعملاء في مراحل التأسيس الأولى.`,
        `التأثر السريع بانطباعات العملاء وتقييماتهم الرقمية عبر منصات التواصل والتقييم.`,
        `سرعة تحول أذواق المستهلكين وصعوبة المحافظة على ولائهم دون تجديد وابتكار مستمر.`,
        `تكاليف إضافية للالتزام بمعايير السلامة والاستدامة المتصاعدة.`,
      ],
    },
    technological: {
      trend: [
        `التوسع في حلول الدفع الإلكتروني، وأنظمة إدارة العمليات السحابية، والتحول الرقمي.`,
        isFood
          ? `التكامل مع تطبيقات التوصيل وإدارة نقاط البيع وأنظمة المطبخ السحابية الذكية.`
          : `اعتماد أدوات تحليل البيانات والذكاء الاصطناعي لتحسين المخزون وتجربة العملاء.`,
        `أتمتة العمليات التشغيلية لخفض الهدر ورفع كفاءة تلبية الطلبات.`,
        `تطور منصات التجارة الإلكترونية وسهولة الوصول للعملاء عبر الهواتف الذكية.`,
      ],
      positive_impact: [
        `أتمتة العمليات اليومية لمشروع «${project}» مما يخفض التكاليف التشغيلية ويسرع الإنجاز.`,
        `القدرة على تحليل بيانات العملاء لتحسين المنتجات وتطوير العروض الموجهة بدقة.`,
        `خفض الهدر وتحسين جودة الخدمة عبر مؤشرات تشغيل لحظية.`,
        `استخدام قنوات البيع الرقمية لتوسيع نطاق الوصول الجغرافي دون الحاجة لفروع كثيرة.`,
      ],
      negative_impact: [
        `مخاطر الأعطال التقنية في بوابات الدفع أو المنصات الرقمية وتأثيرها على سير العمل.`,
        `رسوم وعمولات منصات التوصيل والتسويق الرقمي التي تقتطع من هامش الربح.`,
        `تكاليف الاستثمار والتطوير المستمر في البنية التقنية والبرمجيات المتخصصة.`,
        `الحاجة إلى كوادر مؤهلة تقنياً لتشغيل الأنظمة وصيانتها.`,
      ],
    },
    legal: {
      trend: [
        isFood
          ? `المعايير والاشتراطات الصارمة للهيئة العامة للغذاء والدواء والبلديات بشأن سلامة التخزين والتحضير.`
          : `تشديد اللوائح التنظيمية وتراخيص النشاط لقطاع ${industry} في ${country}.`,
        `الالتزام الإلزامي بمنظومة الفوترة الإلكترونية ومعايير حماية بيانات المستهلك.`,
        `تحديثات نظام العمل ولوائح السلامة المهنية وحماية الأجور.`,
        `الرقابة المشددة على جودة المنتجات وحماية الملكية الفكرية والعلامات التجارية.`,
      ],
      positive_impact: [
        `الموثوقية العالية التي يكتسبها المشروع أمام العملاء والجهات التمويلية نتيجة الامتثال الكامل.`,
        `الحماية النظامية وحفظ حقوق مشروع «${project}» في بيئة تنافسية عادلة ومحمية بالقانون.`,
        `تقليل النزاعات العمالية والتعاقدية عبر تبني النماذج والعقود المعتمدة رسمياً.`,
        `حماية العلامة التجارية والمنتجات من التقليد وتعزيز قيمتها السوقية.`,
      ],
      negative_impact: [
        `التعرض لمخاطر الغرامات المالية عند حدوث أي تقصير في استيفاء الاشتراطات البلدية أو النظامية.`,
        `الكلفة الإدارية والمالية المستمرة لتجديد التراخيص ومواكبة التعديلات القانونية المتسارعة.`,
        `تعقيد الإجراءات البيروقراطية في بعض التراخيص النوعية وتأثيرها على سرعة التوسع.`,
        `تكاليف تسجيل الملكية الفكرية ومتابعة حالات التعدي قانونياً.`,
      ],
    },
  };
}

function pickFrom(pool: string[], index: number, used: Set<string>): string {
  const unused = pool.filter((t) => !used.has(t.trim()));
  const source = unused.length > 0 ? unused : pool;
  const chosen = source[index % source.length];
  used.add(chosen.trim());
  return chosen;
}

/** توليد احتياطي: توجهات مع انعكاسيها مقترنة بالفهرس */
export function generateHeuristicLinked(
  ctx: GenerationContext,
  dims: readonly PestDimensionKey[],
  count: number
): ProposedTriple[] {
  const pool = buildHeuristicPool(ctx);
  const used = new Set(ctx.existingFactors.map((f) => f.content.trim()));
  const result: ProposedTriple[] = [];

  for (const dim of dims) {
    const trends = pool[dim].trend;
    const unusedIdx = trends.map((t, i) => i).filter((i) => !used.has(trends[i].trim()));
    const order = (unusedIdx.length >= count ? unusedIdx : trends.map((_, i) => i)).slice(0, count);
    for (const i of order) {
      used.add(trends[i].trim());
      result.push({
        dimension: dim,
        content: trends[i],
        positiveImplication: pool[dim].positive_impact[i % pool[dim].positive_impact.length],
        negativeImplication: pool[dim].negative_impact[i % pool[dim].negative_impact.length],
        source: "ai",
      });
    }
  }
  return result;
}

/** توليد احتياطي لانعكاس بنود قائمة */
export function generateHeuristicImplications(
  ctx: GenerationContext,
  dimension: PestDimensionKey,
  category: ImplicationCategory,
  targets: ExistingFactor[]
): ProposedImplication[] {
  const pool = buildHeuristicPool(ctx);
  const used = new Set(ctx.existingFactors.map((f) => f.content.trim()));
  return targets.map((t) => {
    const pairedIdx = pool[dimension].trend.findIndex((x) => x.trim() === t.content.trim());
    const list = pool[dimension][category];
    const content =
      pairedIdx >= 0 && !used.has(list[pairedIdx % list.length].trim())
        ? list[pairedIdx % list.length]
        : pickFrom(list, 0, used);
    used.add(content.trim());
    return { dimension, category, parentFactorId: t.id, content, source: "ai" as const };
  });
}

export function generateHeuristicSuggestion(
  ctx: GenerationContext,
  dimension: PestDimensionKey,
  content: string
): { positiveImplication: string; negativeImplication: string } {
  const pool = buildHeuristicPool(ctx);
  const used = new Set(ctx.existingFactors.map((f) => f.content.trim()));
  const pairedIdx = pool[dimension].trend.findIndex((x) => x.trim() === content.trim());
  const seed = pairedIdx >= 0 ? pairedIdx : [...content].reduce((s, ch) => s + ch.charCodeAt(0), 0);
  return {
    positiveImplication: pickFrom(pool[dimension].positive_impact, seed, used),
    negativeImplication: pickFrom(pool[dimension].negative_impact, seed, used),
  };
}

// ─────────────────────────────────────────────────────────────
// OpenAI execution
// ─────────────────────────────────────────────────────────────

async function requestJson(
  prompt: { system: string; user: string },
  maxTokens: number
): Promise<{ json: unknown; tokens: Tokens; model: string } | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  const isKeyValid = Boolean(apiKey && apiKey.startsWith("sk-") && apiKey.length > 20);
  if (!isKeyValid) {
    logger.warn("OpenAI API key missing or invalid (must start with sk-) — using smart heuristic fallback generator for PEST");
    return null;
  }

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const openai = new OpenAI({ apiKey, timeout: 60000 });
  try {
    const completion = await openai.chat.completions.create({
      model,
      temperature: 0.4,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: prompt.system },
        { role: "user", content: prompt.user },
      ],
    });
    const content = completion.choices?.[0]?.message?.content;
    if (!content) return null;
    return {
      json: JSON.parse(content),
      tokens: {
        prompt: completion.usage?.prompt_tokens ?? 0,
        completion: completion.usage?.completion_tokens ?? 0,
        total: completion.usage?.total_tokens ?? 0,
      },
      model,
    };
  } catch (err: any) {
    logger.warn("OpenAI call failed for PEST generation — falling back to smart heuristic generator", {
      error: err?.message || err,
    });
    return null;
  }
}

/**
 * نقطة التوليد الموحّدة: تُرجع دائماً توجهات مع انعكاسيها، أو انعكاسات لتوجهات قائمة.
 * لا تُرجع أبداً انعكاساً بلا بند أب.
 */
export async function callOpenAIForPest(
  ctx: GenerationContext,
  scope: "full" | "dimension" | "category",
  strategy: "replace" | "append",
  targetDimension?: PestDimensionKey,
  targetCategory?: PestCategoryKey,
  implicationTargets: ExistingFactor[] = []
): Promise<{ proposal: ProposedGeneration; tokens: Tokens; model: string }> {
  // ── توليد عمود الانعكاسات لتوجهات قائمة ──
  if (isImplicationScope(scope, targetCategory) && targetDimension) {
    if (implicationTargets.length === 0) {
      return { proposal: { triples: [], implications: [] }, tokens: ZERO_TOKENS, model: "none" };
    }
    const refs = implicationTargets.map((t, i) => ({ ref: `t${i + 1}`, content: t.content, factor: t }));
    const res = await requestJson(
      buildImplicationsPrompt(ctx, targetDimension, targetCategory, refs),
      Math.min(4000, 400 + refs.length * 160)
    );
    const parsed = res ? parseImplicationRefs(res.json, new Set(refs.map((r) => r.ref))) : new Map<string, string>();
    const missing = refs.filter((r) => !parsed.has(r.ref)).map((r) => r.factor);
    const fallback = new Map(
      generateHeuristicImplications(ctx, targetDimension, targetCategory, missing).map((p) => [p.parentFactorId, p])
    );
    const implications: ProposedImplication[] = refs.map((r) =>
      parsed.has(r.ref)
        ? {
            dimension: targetDimension,
            category: targetCategory,
            parentFactorId: r.factor.id,
            content: parsed.get(r.ref)!,
            source: "ai",
          }
        : fallback.get(r.factor.id)!
    );
    if (res && missing.length > 0) {
      logger.warn("PEST implications output missing refs — filled with heuristic", { missing: missing.length });
    }
    return {
      proposal: { triples: [], implications },
      tokens: res && missing.length < refs.length ? res.tokens : ZERO_TOKENS,
      model: res && missing.length < refs.length ? res.model : "heuristic-fallback",
    };
  }

  // ── توليد توجهات مع انعكاسيها ──
  const dims: PestDimensionKey[] =
    scope === "full" ? [...PEST_DIMENSIONS] : targetDimension ? [targetDimension] : [];
  const heuristicCount = strategy === "append" ? APPEND_COUNT_PER_CELL : 3;

  const res = await requestJson(
    buildLinkedPrompt(ctx, scope, strategy, targetDimension),
    scope === "full" ? 7000 : 2500
  );

  if (!res) {
    return {
      proposal: { triples: generateHeuristicLinked(ctx, dims, heuristicCount), implications: [] },
      tokens: ZERO_TOKENS,
      model: "heuristic-fallback",
    };
  }

  const triples: ProposedTriple[] = [];
  let fallbackDims = 0;
  const byDim: Record<string, AiLinkedItem[]> =
    scope === "full" ? parseFullLinkedOutput(res.json) : { [dims[0]]: parseLinkedItems(res.json) };

  for (const dim of dims) {
    const items = byDim[dim] || [];
    if (items.length === 0) {
      fallbackDims++;
      triples.push(...generateHeuristicLinked(ctx, [dim], heuristicCount));
      continue;
    }
    for (const it of items) {
      triples.push({ dimension: dim, ...it, source: "ai" });
    }
  }

  if (fallbackDims > 0) {
    logger.warn("PEST linked generation schema mismatch for some dimensions — heuristic used", { fallbackDims });
  }

  const allFallback = fallbackDims === dims.length;
  return {
    proposal: { triples, implications: [] },
    tokens: allFallback ? ZERO_TOKENS : res.tokens,
    model: allFallback ? "heuristic-fallback" : res.model,
  };
}

/** اقتراح انعكاسين لبند واحد — لا يحفظ شيئاً */
export async function suggestImplicationsForTrend(
  ctx: GenerationContext,
  dimension: PestDimensionKey,
  content: string
): Promise<{ positiveImplication: string; negativeImplication: string; model: string }> {
  const res = await requestJson(buildSingleSuggestionPrompt(ctx, dimension, content), 600);
  if (res) {
    const parsed = aiSingleSuggestionSchema.safeParse(res.json);
    if (parsed.success) return { ...parsed.data, model: res.model };
    logger.warn("PEST single suggestion schema mismatch — heuristic used");
  }
  return { ...generateHeuristicSuggestion(ctx, dimension, content), model: "heuristic-fallback" };
}
