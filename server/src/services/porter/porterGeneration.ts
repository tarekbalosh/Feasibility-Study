import { z } from "zod";
import OpenAI from "openai";
import {
  PORTER_FORCES,
  PORTER_FIELDS,
  FORCE_LABELS,
  FIELD_LABELS,
  AI_POINTS_PER_FIELD,
  MAX_FIELD_CHARS,
  MIN_AI_DESCRIPTION_CHARS,
  type PorterForces,
  type PorterForceKey,
  type PorterFieldKey,
} from "./porterConstants";
import { logger } from "../../utils/logger";

// ─────────────────────────────────────────────────────────────
// Text normalisation
// ─────────────────────────────────────────────────────────────

/**
 * يوحّد نص الحقل: كل نقطة في سطر، بلا ترقيم أو رموز تعداد بادئة،
 * وبلا أسطر فارغة مكرّرة. تُستخدم على مخرجات الذكاء الاصطناعي.
 */
export function normalizePoints(text: string): string {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:[-–—•*●▪]|\d+[.)\-]|[٠-٩]+[.)\-])\s*/, "").trim())
    .filter(Boolean)
    .join("\n");
}

// ─────────────────────────────────────────────────────────────
// Zod Schemas
// ─────────────────────────────────────────────────────────────

export const generateRequestSchema = z.object({
  projectDescription: z
    .string({ required_error: "وصف المشروع مطلوب للتوليد بالذكاء الاصطناعي." })
    .trim()
    .min(
      MIN_AI_DESCRIPTION_CHARS,
      `يرجى كتابة وصف موجز للمشروع (${MIN_AI_DESCRIPTION_CHARS} حرفاً على الأقل).`
    )
    .max(2000, "وصف المشروع يجب ألا يتجاوز 2000 حرف."),
  projectName: z.string().trim().max(150).optional(),
  industry: z.string().trim().max(100).optional(),
  countryRegion: z.string().trim().max(100).optional(),
});

export type GenerateRequestInput = z.infer<typeof generateRequestSchema>;

/** حقل نصي: يقبل نصاً أو مصفوفة نقاط (يدمجها) ثم يُطبَّع ويُتحقَّق من طوله */
const aiTextField = z
  .preprocess(
    (value) => (Array.isArray(value) ? value.map((v) => String(v)).join("\n") : value),
    z.string()
  )
  .transform(normalizePoints)
  .pipe(z.string().min(3).max(MAX_FIELD_CHARS));

const aiForceSchema = z.object({
  trends: aiTextField,
  positiveImpacts: aiTextField,
  negativeImpacts: aiTextField,
});

export const aiOutputSchema = z.object({
  newEntrants: aiForceSchema,
  buyers: aiForceSchema,
  suppliers: aiForceSchema,
  substitutes: aiForceSchema,
  rivalry: aiForceSchema,
});

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface GenerationContext {
  projectDescription: string;
  projectName?: string | null;
  industry?: string | null;
  countryRegion?: string | null;
}

export interface GenerationResult {
  forces: PorterForces;
  tokens: { prompt: number; completion: number; total: number };
  model: string;
}

// ─────────────────────────────────────────────────────────────
// OpenAI Prompt Builder
// ─────────────────────────────────────────────────────────────

function buildPrompt(ctx: GenerationContext): { system: string; user: string } {
  const system = `أنت خبير استراتيجي متخصص في دراسات الجدوى وتحليل البيئة التنافسية للقطاعات وفق نموذج قوى بورتر الخمس (Porter's Five Forces).
مهمتك توليد نقاط دقيقة وواقعية ومحددة تماماً للمشروع والقطاع والدولة/المنطقة المحددة، وتجنب العموميات والعبارات البديهية.
اكتب بالعربية الفصحى المبسطة حصراً. كل نقطة جملة مفيدة قصيرة (سطر واحد).
أجب فقط بصيغة JSON صالحة دون أي نصوص تمهيدية أو Markdown خارج صيغة JSON.`;

  const forcesDesc = PORTER_FORCES.map((f) => `- ${f}: ${FORCE_LABELS[f]}`).join("\n");
  const fieldsDesc = PORTER_FIELDS.map(
    (f) => `- ${f}: ${FIELD_LABELS[f]} (${AI_POINTS_PER_FIELD[f]} نقاط)`
  ).join("\n");

  const user = `بيانات المشروع:
- اسم المشروع: ${ctx.projectName || "غير محدد"}
- وصف المشروع: ${ctx.projectDescription}
- القطاع: ${ctx.industry || "يُستنتج من الوصف"}
- الدولة / المنطقة الجغرافية: ${ctx.countryRegion || "المملكة العربية السعودية / الشرق الأوسط"}

المطلوب: تحليل قوى بورتر الخمس التالية:
${forcesDesc}

ولكل قوة ثلاثة حقول نصية:
${fieldsDesc}

قواعد صارمة لكل حقل:
- قيمة الحقل نص واحد (string) تفصل بين نقاطه بسطر جديد (\\n).
- لا تستخدم ترقيماً ولا رموز تعداد (- أو • أو 1.) في بداية النقاط.
- لا تترك أي حقل فارغاً.

يجب أن تكون مخرجاتك JSON تماماً بالهيكل التالي (المفاتيح بالإنجليزية كما هي، والقيم بالعربية):
{
  "newEntrants":  { "trends": "...", "positiveImpacts": "...", "negativeImpacts": "..." },
  "buyers":       { "trends": "...", "positiveImpacts": "...", "negativeImpacts": "..." },
  "suppliers":    { "trends": "...", "positiveImpacts": "...", "negativeImpacts": "..." },
  "substitutes":  { "trends": "...", "positiveImpacts": "...", "negativeImpacts": "..." },
  "rivalry":      { "trends": "...", "positiveImpacts": "...", "negativeImpacts": "..." }
}`;

  return { system, user };
}

// ─────────────────────────────────────────────────────────────
// Heuristic fallback — يُستخدم عند غياب مفتاح OpenAI أو فشل الاستدعاء
// ─────────────────────────────────────────────────────────────

export function generateHeuristicPorterForces(ctx: GenerationContext): PorterForces {
  const project = ctx.projectName?.trim() || "المشروع";
  const industry = ctx.industry?.trim() || "هذا القطاع";
  const country = ctx.countryRegion?.trim() || "المملكة العربية السعودية";

  const lines = (...items: string[]) => items.join("\n");

  return {
    newEntrants: {
      trends: lines(
        `تنامي اهتمام رواد الأعمال بدخول قطاع ${industry} في ${country} مع تسهيل إجراءات التأسيس والتراخيص.`,
        "توفر حاضنات ومسرّعات أعمال ومبادرات تمويل تخفض كلفة الدخول للشركات الناشئة.",
        "انتشار الحلول الرقمية الجاهزة التي تتيح إطلاق نشاط مماثل بسرعة ورأس مال أقل.",
        "اهتمام المستثمرين بالقطاعات الواعدة يجذب منافسين جدداً من خارج السوق المحلي."
      ),
      positiveImpacts: lines(
        `وجود عوائق دخول مثل الحاجة للخبرة والتراخيص والعلامة الموثوقة يحمي موقع «${project}» بعد تأسيسه.`,
        "الاستفادة المبكرة من الحصة السوقية وبناء قاعدة عملاء قبل ازدحام السوق.",
        "إمكانية بناء مزايا تنافسية يصعب تقليدها سريعاً كجودة الخدمة وعلاقات الموردين."
      ),
      negativeImpacts: lines(
        "انخفاض عوائق الدخول نسبياً يهدد بظهور منافسين جدد بأسعار أو عروض مغرية.",
        "احتمال دخول شركات كبرى بموارد مالية وتسويقية أضخم تضغط على الهوامش.",
        "الحاجة لاستثمار مستمر في التسويق والتطوير للحفاظ على التميز أمام الداخلين الجدد."
      ),
    },
    buyers: {
      trends: lines(
        `ارتفاع وعي العملاء في ${country} بالجودة والأسعار وسهولة المقارنة بين مقدمي ${industry}.`,
        "تزايد الاعتماد على التقييمات والمراجعات الرقمية في قرار الشراء.",
        "ميل العملاء إلى العروض المرنة والتجربة السلسة وسرعة الاستجابة.",
        "تنوع شرائح العملاء بين أفراد وشركات واختلاف حساسيتهم السعرية."
      ),
      positiveImpacts: lines(
        `وجود شريحة واسعة من العملاء المحتملين تمنح «${project}» فرصة نمو في الطلب.`,
        "العملاء الراضون يتحولون إلى سفراء للعلامة ويخفضون كلفة اكتساب العملاء.",
        "إمكانية بناء برامج ولاء وعقود طويلة الأمد تثبّت الإيرادات."
      ),
      negativeImpacts: lines(
        "سهولة انتقال العملاء إلى المنافسين تقوّي قدرتهم على التفاوض على الأسعار.",
        "الحساسية العالية للسعر قد تفرض خصومات تضغط على الربحية.",
        "ارتفاع التوقعات يتطلب جودة ثابتة ويضاعف أثر أي تجربة سلبية على السمعة."
      ),
    },
    suppliers: {
      trends: lines(
        `تقلب أسعار المواد والخدمات المغذية لقطاع ${industry} بفعل التضخم وسلاسل الإمداد العالمية.`,
        "اتجاه الموردين إلى عقود أطول وشروط دفع أكثر صرامة مع المشاريع الجديدة.",
        "جهود التوطين في السوق المحلي تزيد من عدد الموردين المحليين المتاحين.",
        "تركّز بعض الموردين الرئيسيين في عدد محدود من الشركات."
      ),
      positiveImpacts: lines(
        `تعدد الموردين المحليين والإقليميين يتيح لـ«${project}» مقارنة العروض والتفاوض على الشروط.`,
        "إمكانية بناء شراكات استراتيجية مع موردين موثوقين لضمان الجودة والاستمرارية.",
        "فرصة خفض التكاليف عبر الشراء بالجملة أو التعاقد المباشر مع المصدر."
      ),
      negativeImpacts: lines(
        "الاعتماد على عدد محدود من الموردين يعرّض التشغيل لمخاطر التأخير أو رفع الأسعار.",
        "ارتفاع تكاليف المدخلات قد يضغط على هوامش الربح إن تعذّر تمريره للعملاء.",
        "شروط الدفع الصارمة تزيد من احتياج المشروع للسيولة في مراحله الأولى."
      ),
    },
    substitutes: {
      trends: lines(
        `ظهور حلول وخدمات بديلة تلبي حاجة عملاء ${industry} بطرق مختلفة وبكلفة أقل أحياناً.`,
        "تسارع التحول الرقمي الذي يتيح بدائل إلكترونية أو ذاتية الخدمة.",
        "تغير أنماط الاستهلاك نحو خيارات أكثر مرونة وراحة.",
        "مقارنة العملاء المستمرة بين الحل التقليدي والبدائل الحديثة."
      ),
      positiveImpacts: lines(
        `تميّز «${project}» بقيمة مضافة يصعب على البدائل تقديمها يحد من التحول عنه.`,
        "إمكانية دمج بعض البدائل ضمن العرض (شراكات أو تكامل) لتوسيع الفائدة للعملاء.",
        "الابتكار المستمر في المنتج والخدمة يجعل البدائل أقل جاذبية."
      ),
      negativeImpacts: lines(
        "وجود بدائل أرخص أو أسهل يحدّ من قدرة المشروع على رفع الأسعار.",
        "ظهور تقنية بديلة جديدة قد يضعف الطلب على الخدمة بسرعة.",
        "انخفاض تكلفة التحول للعميل يسهّل انتقاله إلى البديل."
      ),
    },
    rivalry: {
      trends: lines(
        `تعدد المنافسين الحاليين في قطاع ${industry} في ${country} وتفاوت أحجامهم وقدراتهم.`,
        "اعتماد المنافسين على الخصومات والعروض الترويجية لكسب العملاء.",
        "تنافس متزايد على القنوات الرقمية والتسويق عبر وسائل التواصل الاجتماعي.",
        "اتجاه الشركات القائمة إلى التوسع الجغرافي وتطوير العروض."
      ),
      positiveImpacts: lines(
        "نمو حجم السوق يسمح بوجود أكثر من لاعب رابح وتوسع الطلب الإجمالي.",
        `فرصة تمايز «${project}» بجودة أعلى أو خدمة متخصصة أو تجربة عملاء أفضل.`,
        "التعلّم من ممارسات المنافسين ونقاط ضعفهم لتحسين العرض."
      ),
      negativeImpacts: lines(
        "المنافسة السعرية الحادة قد تضغط على الأسعار وهوامش الربح.",
        "ارتفاع كلفة التسويق للتميز وسط المنافسين القائمين.",
        "قدرة الشركات الكبرى على تحمل خسائر مؤقتة لإبعاد الداخلين الجدد."
      ),
    },
  };
}

// ─────────────────────────────────────────────────────────────
// OpenAI Execution
// ─────────────────────────────────────────────────────────────

const noTokens = { prompt: 0, completion: 0, total: 0 };

function fallback(ctx: GenerationContext): GenerationResult {
  return {
    forces: generateHeuristicPorterForces(ctx),
    tokens: noTokens,
    model: "heuristic-fallback",
  };
}

export async function callOpenAIForPorter(ctx: GenerationContext): Promise<GenerationResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  const isKeyValid = Boolean(apiKey && apiKey.startsWith("sk-") && apiKey.length > 20);

  if (!isKeyValid) {
    logger.warn(
      "OpenAI API key missing or invalid (must start with sk-) — using smart heuristic fallback generator for Porter"
    );
    return fallback(ctx);
  }

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const openai = new OpenAI({ apiKey, timeout: 60000 });
  const { system, user } = buildPrompt(ctx);

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
    logger.warn("OpenAI call failed for Porter generation — falling back to smart heuristic generator", {
      error: err?.message || err,
    });
    return fallback(ctx);
  }

  const content = completion.choices?.[0]?.message?.content;
  if (!content) return fallback(ctx);

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(content);
  } catch {
    logger.warn("Porter generation returned non-JSON content — using heuristic fallback");
    return fallback(ctx);
  }

  const parseRes = aiOutputSchema.safeParse(parsedJson);
  if (!parseRes.success) {
    logger.warn("Porter generation schema mismatch — using heuristic fallback", {
      errors: parseRes.error.flatten(),
    });
    return fallback(ctx);
  }

  return {
    forces: parseRes.data as Record<PorterForceKey, Record<PorterFieldKey, string>>,
    tokens: {
      prompt: completion.usage?.prompt_tokens ?? 0,
      completion: completion.usage?.completion_tokens ?? 0,
      total: completion.usage?.total_tokens ?? 0,
    },
    model,
  };
}
