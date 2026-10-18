import { z } from "zod";
import OpenAI from "openai";
import {
  PEST_DIMENSIONS,
  PEST_CATEGORIES,
  PestDimensionKey,
  PestCategoryKey,
  PestFactorSourceKey,
  DEFAULT_COUNTS,
  APPEND_COUNT_PER_CELL,
  DIMENSION_LABELS,
  CATEGORY_LABELS,
  MAX_FACTOR_CHARS,
} from "./pestConstants";
import { ApiError } from "../../utils/ApiError";
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

const generatedFactorSchema = z.string().trim().min(3).max(MAX_FACTOR_CHARS);

const categoryFactorsSchema = z.array(generatedFactorSchema);

const dimensionContentSchema = z.object({
  trend: categoryFactorsSchema.optional().default([]),
  positive_impact: categoryFactorsSchema.optional().default([]),
  negative_impact: categoryFactorsSchema.optional().default([]),
});

export const aiFullOutputSchema = z.object({
  political: dimensionContentSchema,
  economic: dimensionContentSchema,
  social: dimensionContentSchema,
  technological: dimensionContentSchema,
  legal: dimensionContentSchema,
});

export const aiDimensionOutputSchema = dimensionContentSchema;

export const aiCategoryOutputSchema = z.object({
  items: categoryFactorsSchema,
});

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
}

export interface ProposedFactor {
  dimension: PestDimensionKey;
  category: PestCategoryKey;
  content: string;
  source: PestFactorSourceKey;
}

export interface GenerationContext {
  projectName: string;
  projectDescription?: string | null;
  industry?: string | null;
  countryRegion?: string | null;
  existingFactors: ExistingFactor[];
}

export interface MergeResult {
  hasProtectedManualConflict: boolean;
  protectedManualCount: number;
  factorsToCreate: ProposedFactor[];
  factorsToDeleteIds: string[];
}

// ─────────────────────────────────────────────────────────────
// Pure Strategy / Merge Logic (Easily Testable)
// ─────────────────────────────────────────────────────────────

/**
 * دالة نقية تحدد ما الذي سيُحذف وما الذي سيُنشأ بناء على الاستراتيجية، النطاق، وحماية البنود اليدوية.
 */
export function computeMergePlan(
  scope: "full" | "dimension" | "category",
  strategy: "replace" | "append",
  targetDimension: PestDimensionKey | undefined,
  targetCategory: PestCategoryKey | undefined,
  existingFactors: ExistingFactor[],
  newItems: ProposedFactor[],
  confirmOverwrite: boolean
): MergeResult {
  // تصفية البنود الواقعة في النطاق المستهدف
  const inScopeExisting = existingFactors.filter((f) => {
    if (scope === "full") return true;
    if (scope === "dimension") return f.dimension === targetDimension;
    if (scope === "category") return f.dimension === targetDimension && f.category === targetCategory;
    return false;
  });

  if (strategy === "append") {
    return {
      hasProtectedManualConflict: false,
      protectedManualCount: 0,
      factorsToCreate: newItems,
      factorsToDeleteIds: [],
    };
  }

  // وضع replace:
  // فحص البنود اليدوية والمعدلة
  const protectedItems = inScopeExisting.filter(
    (f) => f.source === "manual" || f.source === "ai_edited"
  );

  if (protectedItems.length > 0 && !confirmOverwrite) {
    return {
      hasProtectedManualConflict: true,
      protectedManualCount: protectedItems.length,
      factorsToCreate: [],
      factorsToDeleteIds: [],
    };
  }

  // إذا تم التأكيد أو لم تكن هناك بنود يدوية:
  // نحذف جميع البنود التي في النطاق المستهدف
  const factorsToDeleteIds = inScopeExisting.map((f) => f.id);

  return {
    hasProtectedManualConflict: false,
    protectedManualCount: protectedItems.length,
    factorsToCreate: newItems,
    factorsToDeleteIds,
  };
}

// ─────────────────────────────────────────────────────────────
// OpenAI Prompt Builder & Execution
// ─────────────────────────────────────────────────────────────

function buildPrompt(
  ctx: GenerationContext,
  scope: "full" | "dimension" | "category",
  strategy: "replace" | "append",
  targetDimension?: PestDimensionKey,
  targetCategory?: PestCategoryKey
): { system: string; user: string } {
  const system = `أنت خبير استراتيجي واقتصادي متخصص في دراسات الجدوى وتحليل البيئة الكلية والبيئة الخارجية للشركات (PEST Analysis).
مهمتك توليد بنود دقيقة، واقعية، ذات صلة ومحددة تماماً للمشروع المحدد، الدولة/المنطقة، والقطاع.
تجنب العموميات والعبارات البديهية، وركز على التحديات والفرص التشريعية، الاقتصادية، الاجتماعية، والتقنية المؤثرة فعلياً على هذا النشاط.
أجب فقط بصيغة JSON صالحة دون أي نصوص تمهيدية أو Markdown خارج صيغة JSON.`;

  let existingContextDesc = "";
  if (ctx.existingFactors.length > 0) {
    const list = ctx.existingFactors
      .map(
        (f) =>
          `- [${DIMENSION_LABELS[f.dimension]} / ${CATEGORY_LABELS[f.category]}] (${f.source}): ${f.content}`
      )
      .join("\n");
    existingContextDesc = `
البنود الموجودة مسبقاً لدى المستخدم في هذا التحليل (يجب مراعاتها، عدم تكرارها أو نسخها حرفياً، بل البناء عليها واقتراح بنود إضافية تكاملية):
${list}
`;
  }

  let instructions = "";
  let jsonFormat = "";

  if (scope === "full") {
    instructions = `المطلوب توليد تحليل PEST متكامل لجميع الأبعاد الخمسة:
لكل بُعد (${PEST_DIMENSIONS.map((d) => DIMENSION_LABELS[d]).join("، ")}):
- ${DEFAULT_COUNTS.trend} بنود في "أبرز التوجهات والمؤشرات" (trend)
- ${DEFAULT_COUNTS.positive_impact} بنود في "الانعكاسات الإيجابية المحتملة" (positive_impact)
- ${DEFAULT_COUNTS.negative_impact} بنود في "الانعكاسات السلبية المحتملة" (negative_impact)`;

    jsonFormat = `{
  "political": { "trend": ["..."], "positive_impact": ["..."], "negative_impact": ["..."] },
  "economic": { "trend": ["..."], "positive_impact": ["..."], "negative_impact": ["..."] },
  "social": { "trend": ["..."], "positive_impact": ["..."], "negative_impact": ["..."] },
  "technological": { "trend": ["..."], "positive_impact": ["..."], "negative_impact": ["..."] },
  "legal": { "trend": ["..."], "positive_impact": ["..."], "negative_impact": ["..."] }
}`;
  } else if (scope === "dimension" && targetDimension) {
    const countTrend = strategy === "append" ? APPEND_COUNT_PER_CELL : DEFAULT_COUNTS.trend;
    const countPos = strategy === "append" ? APPEND_COUNT_PER_CELL : DEFAULT_COUNTS.positive_impact;
    const countNeg = strategy === "append" ? APPEND_COUNT_PER_CELL : DEFAULT_COUNTS.negative_impact;

    instructions = `المطلوب توليد محتوى البُعد [${DIMENSION_LABELS[targetDimension]}] فقط:
- ${countTrend} بنود لـ trend
- ${countPos} بنود لـ positive_impact
- ${countNeg} بنود لـ negative_impact`;

    jsonFormat = `{
  "trend": ["..."],
  "positive_impact": ["..."],
  "negative_impact": ["..."]
}`;
  } else if (scope === "category" && targetDimension && targetCategory) {
    const count = strategy === "append" ? APPEND_COUNT_PER_CELL : DEFAULT_COUNTS[targetCategory];

    instructions = `المطلوب توليد بنود محددة لـ [${DIMENSION_LABELS[targetDimension]} - ${CATEGORY_LABELS[targetCategory]}]:
عدد البنود المطلوبة: ${count} بنود نوعية جديدة ومختلفة عن البنود الموجودة.`;

    jsonFormat = `{
  "items": ["..."]
}`;
  }

  const user = `بيانات المشروع:
- اسم المشروع: ${ctx.projectName}
- وصف المشروع: ${ctx.projectDescription || "غير محدد"}
- القطاع: ${ctx.industry || "عام"}
- الدولة / المنطقة الجغرافية: ${ctx.countryRegion || "المملكة العربية السعودية / الشرق الأوسط"}
${existingContextDesc}
${instructions}

يجب أن تكون مخرجاتك JSON تماماً بالهيكل التالي:
${jsonFormat}`;

  return { system, user };
}

export function generateHeuristicPestFactors(
  ctx: GenerationContext,
  scope: "full" | "dimension" | "category",
  strategy: "replace" | "append",
  targetDimension?: PestDimensionKey,
  targetCategory?: PestCategoryKey
): ProposedFactor[] {
  const project = ctx.projectName || "المشروع";
  const industry = ctx.industry?.trim() || "القطاع العام";
  const country = ctx.countryRegion?.trim() || "المملكة العربية السعودية";

  const isFood = /أكل|طعام|مطعم|أغذية|وجبات|كافيه|مقهى|food|beverage/i.test(industry);

  const pool: Record<PestDimensionKey, Record<PestCategoryKey, string[]>> = {
    political: {
      trend: [
        `مبادرات التمكين الحكومي وتشجيع المنشآت الصغيرة والمتوسطة في ${country}.`,
        `سياسات دعم توطين المحتوى المحلي وتعزيز سلاسل التوريد الوطنية لمشروعات ${industry}.`,
        `التوجهات الاستراتيجية لتنويع الاقتصاد ودعم الاستثمارات الواعدة في ${country}.`,
        `حزم التسهيلات الحكومية لرواد الأعمال في القطاعات الإنتاجية والخدمية.`,
      ],
      positive_impact: [
        `فرص الاستفادة من مبادرات التمويل التنموي وحاضنات الأعمال الداعمة لمشروع «${project}».`,
        `استقرار السياسات الاقتصادية والبيئة الاستثمارية الداعمة لنمو المشروع وتوسعه.`,
        `أولوية المناقصات والفرص المحلية للشركات الناشئة المسجلة نظامياً في ${country}.`,
      ],
      negative_impact: [
        `الالتزامات التنظيمية والرسوم المرتبطة بمتطلبات التوطين وتراخيص العمل.`,
        `احتمالية تعديل تسعيرة الخدمات والمرافق الحكومية وارتفاع تكاليف التشغيل الأولية.`,
        `التقلبات المحتملة في السياسات الجمركية أو قيود استيراد المواد الخام.`,
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
        `نمو حجم سوق ${industry} مع زيادة الكثافة السكانية ومعدلات الإنفاق في ${country}.`,
        `إمكانية تحقيق هوامش ربحية ممتازة لمشروع «${project}» عبر ضبط الهدر وإدارة التكاليف بذكاء.`,
        `فرصة الاستحواذ على حصة سوقية عبر تقديم خيارات تسعيرية مرنة ومدروسة.`,
      ],
      negative_impact: [
        `المنافسة السعرية الحادة من المنافسين الكبار والبدائل المتوفرة في السوق.`,
        `حساسية العملاء تجاه تغير الأسعار في ظل الضغوط التضخمية.`,
        `ارتفاع تكاليف الإيجارات والمرافق في المواقع التجارية الحيوية.`,
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
      ],
      negative_impact: [
        `سرعة تحول أذواق المستهلكين وصعوبة المحافظة على ولائهم دون تجديد وابتكار مستمر.`,
        `التأثر السريع بانطباعات العملاء وتقييماتهم الرقمية عبر منصات التواصل والتقييم.`,
        `صعوبة تلبية التوقعات المرتفعة للعملاء في مراحل التأسيس الأولى.`,
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
        `استخدام قنوات البيع الرقمية لتوسيع نطاق الوصول الجغرافي دون الحاجة لفروع كثيرة.`,
        `القدرة على تحليل بيانات العملاء لتحسين المنتجات وتطوير العروض الموجهة بدقة.`,
      ],
      negative_impact: [
        `تكاليف الاستثمار والتطوير المستمر في البنية التقنية والبرمجيات المتخصصة.`,
        `مخاطر الأعطال التقنية في بوابات الدفع أو المنصات الرقمية وتأثيرها على سير العمل.`,
        `رسوم وعمولات منصات التوصيل والتسويق الرقمي التي تقتطع من هامش الربح.`,
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
        `الحماية النظامية وحفظ حقوق مشروع «${project}» في بيئة تنافسية عادلة ومحمية بالقانون.`,
        `الموثوقية العالية التي يكتسبها المشروع أمام العملاء والجهات التمويلية نتيجة الامتثال الكامل.`,
        `تقليل النزاعات العمالية والتعاقدية عبر تبني النماذج والعقود المعتمدة رسمياً.`,
      ],
      negative_impact: [
        `التعرض لمخاطر الغرامات المالية عند حدوث أي تقصير في استيفاء الاشتراطات البلدية أو النظامية.`,
        `الكلفة الإدارية والمالية المستمرة لتجديد التراخيص ومواكبة التعديلات القانونية المتسارعة.`,
        `تعقيد الإجراءات البيروقراطية في بعض التراخيص النوعية وتأثيرها على سرعة التوسع.`,
      ],
    },
  };

  const existingSet = new Set(ctx.existingFactors.map((f) => f.content.trim()));
  const countNeeded = strategy === "append" ? APPEND_COUNT_PER_CELL : 2;

  const result: ProposedFactor[] = [];

  const dimsToProcess = scope === "full" ? PEST_DIMENSIONS : targetDimension ? [targetDimension] : [];

  for (const dim of dimsToProcess) {
    const catsToProcess = scope === "category" && targetCategory ? [targetCategory] : PEST_CATEGORIES;
    for (const cat of catsToProcess) {
      const candidates = pool[dim]?.[cat] || [];
      const unused = candidates.filter((text) => !existingSet.has(text.trim()));
      const selected = (unused.length >= countNeeded ? unused : candidates).slice(0, countNeeded);

      for (const item of selected) {
        result.push({
          dimension: dim,
          category: cat,
          content: item,
          source: "ai",
        });
      }
    }
  }

  return result;
}

export async function callOpenAIForPest(
  ctx: GenerationContext,
  scope: "full" | "dimension" | "category",
  strategy: "replace" | "append",
  targetDimension?: PestDimensionKey,
  targetCategory?: PestCategoryKey
): Promise<{ proposedFactors: ProposedFactor[]; tokens: { prompt: number; completion: number; total: number }; model: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  const isKeyValid = Boolean(apiKey && apiKey.startsWith("sk-") && apiKey.length > 20);

  if (!isKeyValid) {
    logger.warn("OpenAI API key missing or invalid (must start with sk-) — using smart heuristic fallback generator for PEST");
    const proposedFactors = generateHeuristicPestFactors(ctx, scope, strategy, targetDimension, targetCategory);
    return {
      proposedFactors,
      tokens: { prompt: 0, completion: 0, total: 0 },
      model: "heuristic-fallback",
    };
  }

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const openai = new OpenAI({ apiKey, timeout: 60000 });

  const { system, user } = buildPrompt(ctx, scope, strategy, targetDimension, targetCategory);

  let completion;
  try {
    completion = await openai.chat.completions.create({
      model,
      temperature: 0.4,
      max_tokens: 3500,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });
  } catch (err: any) {
    logger.warn("OpenAI call failed for PEST generation — falling back to smart heuristic generator", { error: err?.message || err });
    const proposedFactors = generateHeuristicPestFactors(ctx, scope, strategy, targetDimension, targetCategory);
    return {
      proposedFactors,
      tokens: { prompt: 0, completion: 0, total: 0 },
      model: "heuristic-fallback",
    };
  }

  const content = completion.choices?.[0]?.message?.content;
  if (!content) {
    const proposedFactors = generateHeuristicPestFactors(ctx, scope, strategy, targetDimension, targetCategory);
    return {
      proposedFactors,
      tokens: { prompt: 0, completion: 0, total: 0 },
      model: "heuristic-fallback",
    };
  }

  let parsedJson: any;
  try {
    parsedJson = JSON.parse(content);
  } catch (err) {
    const proposedFactors = generateHeuristicPestFactors(ctx, scope, strategy, targetDimension, targetCategory);
    return {
      proposedFactors,
      tokens: { prompt: 0, completion: 0, total: 0 },
      model: "heuristic-fallback",
    };
  }

  const proposedFactors: ProposedFactor[] = [];

  if (scope === "full") {
    const parseRes = aiFullOutputSchema.safeParse(parsedJson);
    if (!parseRes.success) {
      logger.warn("PEST full generation schema mismatch — using heuristic fallback", { errors: parseRes.error.flatten() });
      const fallbackFactors = generateHeuristicPestFactors(ctx, scope, strategy, targetDimension, targetCategory);
      return {
        proposedFactors: fallbackFactors,
        tokens: { prompt: 0, completion: 0, total: 0 },
        model: "heuristic-fallback",
      };
    }
    const data = parseRes.data;
    for (const dim of PEST_DIMENSIONS) {
      const dimData = data[dim];
      for (const cat of PEST_CATEGORIES) {
        const items = dimData[cat] || [];
        for (const item of items) {
          proposedFactors.push({
            dimension: dim,
            category: cat,
            content: item.trim(),
            source: "ai",
          });
        }
      }
    }
  } else if (scope === "dimension" && targetDimension) {
    const parseRes = aiDimensionOutputSchema.safeParse(parsedJson);
    if (!parseRes.success) {
      logger.warn("PEST dimension generation schema mismatch — using heuristic fallback", { errors: parseRes.error.flatten() });
      const fallbackFactors = generateHeuristicPestFactors(ctx, scope, strategy, targetDimension, targetCategory);
      return {
        proposedFactors: fallbackFactors,
        tokens: { prompt: 0, completion: 0, total: 0 },
        model: "heuristic-fallback",
      };
    }
    const data = parseRes.data;
    for (const cat of PEST_CATEGORIES) {
      const items = data[cat] || [];
      for (const item of items) {
        proposedFactors.push({
          dimension: targetDimension,
          category: cat,
          content: item.trim(),
          source: "ai",
        });
      }
    }
  } else if (scope === "category" && targetDimension && targetCategory) {
    const parseRes = aiCategoryOutputSchema.safeParse(parsedJson);
    if (!parseRes.success) {
      logger.warn("PEST category generation schema mismatch — using heuristic fallback", { errors: parseRes.error.flatten() });
      const fallbackFactors = generateHeuristicPestFactors(ctx, scope, strategy, targetDimension, targetCategory);
      return {
        proposedFactors: fallbackFactors,
        tokens: { prompt: 0, completion: 0, total: 0 },
        model: "heuristic-fallback",
      };
    }
    for (const item of parseRes.data.items) {
      proposedFactors.push({
        dimension: targetDimension,
        category: targetCategory,
        content: item.trim(),
        source: "ai",
      });
    }
  }

  const promptTokens = completion.usage?.prompt_tokens ?? 0;
  const completionTokens = completion.usage?.completion_tokens ?? 0;
  const totalTokens = completion.usage?.total_tokens ?? 0;

  return {
    proposedFactors,
    tokens: {
      prompt: promptTokens,
      completion: completionTokens,
      total: totalTokens,
    },
    model,
  };
}
