import OpenAI from "openai"
import { openAIConfig } from "@/config/openai.config"
import { logger } from "@/utils/logger"
import { normalizeArabic, suggestionDetail } from "@/config/swotSuggestions"
import { hasAnySelection } from "@/utils/swotSelections"
import {
  createReportId,
  isHorizon,
  sortPriorities,
  strategyById,
} from "@/utils/swotReport"
import {
  MAX_PRIORITIES,
  type SwotAnalysis,
  type SwotImportance,
  type SwotInput,
  type SwotItem,
  type SwotPriority,
  type SwotQuadrantKey,
  type SwotSelectionPayload,
  type SwotStage,
  type SwotStrategies,
} from "@/types/swot"

/**
 * ─────────────────────────────────────────────────────────────
 *  محرّك تحليل SWOT — يُستخدم من الخادم فقط
 * ─────────────────────────────────────────────────────────────
 *  المسار الأساسي: توليد المصفوفة بالذكاء الاصطناعي (OpenAI).
 *  مسار الاحتياط: توليدها بقواعد المنصة عند غياب مفتاح OpenAI
 *  أو تعذّر الاتصال — حتى لا تتعطّل الأداة في أي بيئة تشغيل.
 * ─────────────────────────────────────────────────────────────
 */

const STAGE_LABELS: Record<SwotStage, string> = {
  idea: "فكرة لم تُنفَّذ بعد",
  running: "مشروع قائم ويعمل حالياً",
  expansion: "مشروع قائم في مرحلة توسّع",
}

/** الحد الأدنى والأقصى لعدد البنود في كل ربع */
const MIN_ITEMS = 3
const MAX_ITEMS = 5

// ─────────────────────────────────────────────────────────────
//  1. التوليد بالذكاء الاصطناعي
// ─────────────────────────────────────────────────────────────

const QUADRANT_LABELS: Record<SwotQuadrantKey, string> = {
  strengths: "نقاط القوة",
  weaknesses: "نقاط الضعف",
  opportunities: "الفرص",
  threats: "المخاطر",
}

const QUADRANT_KEYS: SwotQuadrantKey[] = [
  "strengths",
  "weaknesses",
  "opportunities",
  "threats",
]

/**
 * قسم موجِّه يحمل ما اختاره المستخدم في شاشة اختيار العناصر.
 * الاختيارات مُدخلات لا مخرجات: النموذج ملزَم بتوسيع كل بند منها،
 * ولا يُسمح له بحذف أي بند حتى لو رآه متعارضاً مع بيانات المشروع.
 */
const buildSelectionsSection = (
  selections?: SwotSelectionPayload | null
): string => {
  if (!hasAnySelection(selections)) return ""

  const blocks = QUADRANT_KEYS.filter(
    (key) => selections!.items[key]?.length
  ).map(
    (key) =>
      `${QUADRANT_LABELS[key]}:\n${selections!.items[key]
        .map((item) => `- ${item}`)
        .join("\n")}`
  )

  const conflictBlock = selections!.conflicts.length
    ? `\n\nبنود متعارضة ظاهرياً اختارها المستخدم معاً:\n${selections!.conflicts
        .map((c) => `- «${c.strength}» مع «${c.weakness}»`)
        .join(
          "\n"
        )}\nلا تحذف أي طرف من هذين الطرفين. عالِج التعارض في الشرح: قد يكون التفاوت بين أقسام المشروع أو خطوطه أو مواقعه حقيقياً، فوضّح في أي جانب تظهر القوة وفي أي جانب يظهر الضعف.`
    : ""

  return `

── البنود التي اختارها صاحب المشروع بنفسه ──
${blocks.join("\n\n")}${conflictBlock}

قواعد إلزامية في التعامل مع هذه البنود:
1. كل بند من البنود أعلاه يجب أن يظهر في التحليل النهائي في ربعه نفسه، موسَّعاً إلى: عنوان مختصر (title) + شرح (detail) مرتبط فعلياً بقطاع المشروع ونشاطه الموصوف + درجة أهمية (importance). الشرح خاصّ بهذا المشروع، لا تعريفاً عاماً للمصطلح.
2. ضع "source": "user" لكل بند مصدره اختيار المستخدم، و"source": "ai" لكل بند أضفته من عندك.
3. لا تُضف أي بند من عندك في ربع اختار فيه صاحب المشروع بنوداً — اقتصر على بنوده هو موسَّعةً. أمّا الأرباع التي لم يختر فيها شيئاً فاملأها أنت بالكامل.
4. إذا تعارض بند اختاره المستخدم بوضوح مع بيانات المشروع، لا تحذفه: أبقِه ووضّح تحفّظك داخل الشرح نفسه.
5. ابنِ استراتيجيات التقاطعات على القائمة المدمجة كاملةً (اختيارات المستخدم + إضافاتك).`
}

const buildSwotPrompt = (
  input: SwotInput,
  selections?: SwotSelectionPayload | null
): string => {
  const lines = [
    `اسم المشروع: ${input.projectName}`,
    `القطاع: ${input.sector}`,
    `مرحلة المشروع: ${STAGE_LABELS[input.stage]}`,
    `وصف النشاط: ${input.description}`,
  ]

  if (input.targetMarket?.trim()) {
    lines.push(`الفئة المستهدفة: ${input.targetMarket.trim()}`)
  }
  if (input.competitors?.trim()) {
    lines.push(`المنافسون الرئيسيون: ${input.competitors.trim()}`)
  }

  return `أنت مستشار استراتيجي متخصص في تحليل المشاريع الصغيرة والمتوسطة في الأسواق العربية.

حلّل المشروع التالي تحليلاً رباعياً (SWOT):

${lines.join("\n")}${buildSelectionsSection(selections)}

المطلوب:
- ما لا يقل عن ${MIN_ITEMS} بنود في كل ربع من أرباع المصفوفة الأربعة.
- كل بند: عنوان مختصر (title) لا يتجاوز ثمانِ كلمات، وشرح (detail) من جملة إلى جملتين محددتين وقابلتين للتنفيذ أو القياس، مرتبطتين بهذا المشروع بعينه وبقطاعه — لا عبارات عامة تصلح لأي مشروع.
- درجة أهمية لكل بند (importance): high أو medium أو low.
- التزم بالتمييز الصحيح: نقاط القوة والضعف عوامل داخلية يملكها المشروع، والفرص والمخاطر عوامل خارجية في السوق والمحيط.
- استخرج استراتيجيات من تقاطعات المصفوفة: من بندين إلى ثلاثة في كل تقاطع.
- ثلاث أولويات تنفيذية (priorities) لأول ٩٠ يوماً، بهذه القيود الملزِمة:
  • كل أولوية مشتقّة من استراتيجية موجودة فعلاً في strategies أعلاه — ممنوع إدخال فكرة جديدة لم تظهر في التحليل.
  • sourceStrategyId يشير إلى تلك الاستراتيجية بالصيغة «so-1» أي أول عنصر في strategies.so، و«wt-2» أي ثاني عنصر في strategies.wt. لا تشر إلى عنصر غير موجود.
  • action: فعل تنفيذي مباشر يبدأ بفعل أمر (ثبّت، اختبر، تفاوض، أطلق…) لا وصفاً ولا نصيحة عامة.
  • rationale: سطر واحد يربط الإجراء ببند محدد من المصفوفة.
  • successMetric: رقم أو حدث يُعرف به الإنجاز، لا عبارة إنشائية.
  • horizon: إحدى القيم 30d أو 60d أو 90d، وليكن لكل أولوية أفق مختلف.
- ملخص تنفيذي من جملتين إلى ثلاث يوضّح الموقف الاستراتيجي العام للمشروع.
- اكتب كل المخرجات بالعربية الفصحى المبسّطة، دون ترقيم أو رموز في بداية البنود.

أعِد النتيجة بصيغة JSON حصراً وبهذا الشكل تماماً:
{
  "summary": "نص الملخص التنفيذي",
  "strengths": [
    { "title": "عنوان البند", "detail": "شرح مرتبط بنشاط المشروع", "importance": "high", "source": "user" }
  ],
  "weaknesses": [{ "title": "...", "detail": "...", "importance": "medium", "source": "ai" }],
  "opportunities": [{ "title": "...", "detail": "...", "importance": "high", "source": "ai" }],
  "threats": [{ "title": "...", "detail": "...", "importance": "low", "source": "ai" }],
  "strategies": {
    "so": ["استراتيجيات هجومية: استثمار القوة في اقتناص الفرص"],
    "wo": ["استراتيجيات تطويرية: معالجة الضعف لاستغلال الفرص"],
    "st": ["استراتيجيات دفاعية: استخدام القوة لمواجهة المخاطر"],
    "wt": ["استراتيجيات انكفائية: تقليل الضعف وتجنّب المخاطر"]
  },
  "priorities": [
    {
      "action": "فعل أمر تنفيذي",
      "rationale": "سطر يربطه ببند في المصفوفة",
      "successMetric": "رقم أو حدث يُعرف به الإنجاز",
      "horizon": "30d",
      "sourceStrategyId": "so-1"
    }
  ]
}`
}

const generateWithAI = async (
  input: SwotInput,
  selections?: SwotSelectionPayload | null
): Promise<SwotAnalysis> => {
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: openAIConfig.timeout,
  })

  const response = await client.chat.completions.create({
    model: openAIConfig.model,
    temperature: openAIConfig.temperature,
    max_tokens: openAIConfig.maxTokens,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "أنت مستشار استراتيجي عربي. تُجيب دائماً بصيغة JSON صالحة ومطابقة للمخطط المطلوب، دون أي نص خارج الـ JSON.",
      },
      { role: "user", content: buildSwotPrompt(input, selections) },
    ],
  })

  const raw = response.choices?.[0]?.message?.content
  if (!raw) throw new Error("استجابة فارغة من مزوّد الذكاء الاصطناعي")

  logger.info("SWOT analysis generated", {
    model: openAIConfig.model,
    tokens: response.usage?.total_tokens ?? 0,
    userItems: selections
      ? QUADRANT_KEYS.reduce(
          (total, key) => total + (selections.items[key]?.length ?? 0),
          0
        )
      : 0,
  })

  return normalizeAnalysis(JSON.parse(raw), input, "ai", selections)
}

// ─────────────────────────────────────────────────────────────
//  2. تطبيع المخرجات — لا نثق في شكل ناتج النموذج كما هو
// ─────────────────────────────────────────────────────────────

/** تنظيف نص واحد: إزالة الترقيم والرموز والمسافات الزائدة */
const cleanItem = (value: unknown): string =>
  String(value ?? "")
    .replace(/^[\s\-–—•*·.]+/, "")
    .replace(/^\d+[).\-\s]+/, "")
    .replace(/\s+/g, " ")
    .trim()

const toImportance = (value: unknown): SwotImportance | undefined =>
  value === "high" || value === "medium" || value === "low" ? value : undefined

/**
 * تحويل أي قيمة إلى قائمة بنود مطبَّعة.
 * النموذج قد يعيد نصوصاً بدل كائنات، أو يخلط الشكلين — نتعامل مع الحالتين.
 */
const toItemList = (value: unknown, max: number): SwotItem[] => {
  const source = Array.isArray(value)
    ? value
    : typeof value === "string"
    ? value.split(/\r?\n/)
    : []

  const items = source
    .map((entry): SwotItem | null => {
      if (typeof entry === "string") {
        const title = cleanItem(entry)
        return title.length > 1 ? { title, source: "ai" } : null
      }
      if (entry && typeof entry === "object") {
        const raw = entry as Record<string, unknown>
        const title = cleanItem(raw.title ?? raw.text ?? raw.label)
        if (title.length <= 1) return null
        const detail = cleanItem(raw.detail ?? raw.description ?? raw.explanation)
        return {
          title,
          detail: detail.length > 1 ? detail : undefined,
          source: raw.source === "user" ? "user" : "ai",
          importance: toImportance(raw.importance),
        }
      }
      return null
    })
    .filter((item): item is SwotItem => item !== null)

  // إزالة التكرار بمقارنة العناوين بعد التطبيع
  const seen = new Set<string>()
  const unique: SwotItem[] = []
  for (const item of items) {
    const key = normalizeArabic(item.title)
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(item)
  }

  return unique.slice(0, max)
}

/**
 * يضمن ظهور كل بند اختاره المستخدم في ربعه.
 * إن أسقط النموذج بنداً أو أعاد صياغته بعيداً عن الأصل، نُدرجه كما
 * اختاره المستخدم مصحوباً بشرحه الافتراضي من القوائم المرجعية — فلا
 * يظهر اختيار المستخدم عنواناً عارياً بجوار بنود مشروحة. البنود التي
 * كتبها المستخدم بنفسه لا شرح افتراضي لها، فتبقى بعنوانها.
 */
const ensureUserItems = (
  items: SwotItem[],
  userLabels: string[]
): SwotItem[] => {
  if (userLabels.length === 0) return items

  const result = [...items]

  for (const label of userLabels) {
    const normalized = normalizeArabic(label)
    const match = result.find((item) => {
      const title = normalizeArabic(item.title)
      return (
        title === normalized ||
        title.includes(normalized) ||
        normalized.includes(title)
      )
    })

    if (match) {
      // النموذج قد يُغفل الوسم — الاختيار وسم يُعتمد عليه في الواجهة
      match.source = "user"
      // وقد يعيد البند بلا شرح — نُكمله من القوائم المرجعية
      if (!match.detail) match.detail = suggestionDetail(match.title) ?? suggestionDetail(label)
    } else {
      result.push({
        title: label,
        detail: suggestionDetail(label),
        source: "user",
      })
    }
  }

  // بنود المستخدم أولاً، ثم إضافات النموذج — بترتيب مستقر
  return [
    ...result.filter((item) => item.source === "user"),
    ...result.filter((item) => item.source !== "user"),
  ]
}

/**
 * تطبيع أولويات الـ ٩٠ يوماً.
 * الشرط الحاسم: كل أولوية تشير إلى استراتيجية موجودة فعلاً في التحليل
 * النهائي. ما لا يستوفي ذلك يسقط ولا يُستبدل ببند عام — ظهور أولويتين
 * صادقتين أفضل من ثلاث إحداها مخترعة.
 */
const toPriorities = (
  value: unknown,
  strategies: SwotStrategies
): SwotPriority[] => {
  if (!Array.isArray(value)) return []

  const seen = new Set<string>()
  const priorities: SwotPriority[] = []

  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue
    const raw = entry as Record<string, unknown>

    const action = cleanItem(raw.action)
    const rationale = cleanItem(raw.rationale)
    const successMetric = cleanItem(raw.successMetric ?? raw.metric)
    const horizon = raw.horizon
    const sourceStrategyId = String(raw.sourceStrategyId ?? "").trim().toLowerCase()

    if (action.length <= 1 || rationale.length <= 1 || successMetric.length <= 1) {
      continue
    }
    if (!isHorizon(horizon)) continue
    if (!strategyById(strategies, sourceStrategyId)) {
      logger.warn("أولوية تشير إلى استراتيجية غير موجودة — أُسقطت", {
        sourceStrategyId,
      })
      continue
    }

    const key = normalizeArabic(action)
    if (seen.has(key)) continue
    seen.add(key)

    priorities.push({
      action,
      rationale,
      successMetric,
      horizon,
      sourceStrategyId,
    })
    if (priorities.length === MAX_PRIORITIES) break
  }

  return sortPriorities(priorities)
}

/**
 * يضمن أن الناتج مطابق للعقد: أربعة أرباع غير فارغة، واستراتيجيات،
 * وملخص. أي ربع يعود ناقصاً من النموذج يُكمَّل من المولّد القاعدي.
 */
const normalizeAnalysis = (
  raw: any,
  input: SwotInput,
  source: SwotAnalysis["source"],
  selections?: SwotSelectionPayload | null
): SwotAnalysis => {
  const fallback = buildHeuristicAnalysis(input)

  const quadrants = QUADRANT_KEYS.reduce((acc, key) => {
    const userLabels = selections?.items[key] ?? []
    // سقف الربع يتّسع لاختيارات المستخدم كاملةً فوق حصّة النموذج، وإلا
    // قُصَّ بندٌ وسّعه النموذج ثم أُعيد إدراجه عارياً في ensureUserItems
    const max = userLabels.length + MAX_ITEMS
    const items = toItemList(raw?.[key], max)

    // نُكمل من المولّد القاعدي أي ربع لم يبلغ الحد الأدنى من البنود
    const withFallback =
      items.length >= MIN_ITEMS
        ? items
        : toItemList([...items, ...fallback[key]], max)

    const merged = ensureUserItems(withFallback, userLabels)

    // اختار صاحب المشروع بنوداً في هذا الربع؟ إذاً هي وحدها ما يُعرض:
    // البنود اختياره لا اقتراحنا، ولا معنى لإغراقها بإضافات لم يطلبها.
    // الأرباع التي تركها فارغة نملؤها كاملةً.
    acc[key] = userLabels.length
      ? merged.filter((item) => item.source === "user")
      : merged
    return acc
  }, {} as Record<SwotQuadrantKey, SwotItem[]>)

  const rawStrategies = raw?.strategies ?? {}
  const strategies = (["so", "wo", "st", "wt"] as const).reduce((acc, key) => {
    const items = Array.isArray(rawStrategies[key])
      ? rawStrategies[key].map(cleanItem).filter((item: string) => item.length > 1)
      : typeof rawStrategies[key] === "string"
      ? String(rawStrategies[key])
          .split(/\r?\n/)
          .map(cleanItem)
          .filter((item) => item.length > 1)
      : []
    const unique = Array.from(new Set<string>(items)).slice(0, 3)
    acc[key] = unique.length > 0 ? unique : fallback.strategies[key]
    return acc
  }, {} as SwotAnalysis["strategies"])

  const summary = cleanItem(raw?.summary)

  return {
    ...quadrants,
    id: createReportId(),
    generatedAt: new Date().toISOString(),
    summary: summary.length > 10 ? summary : fallback.summary,
    strategies,
    // تُقاس الأولويات على الاستراتيجيات بعد تطبيعها لا كما وردت من
    // النموذج، فلا تنجو إشارة إلى استراتيجية حُذفت في التطبيع
    priorities: toPriorities(raw?.priorities, strategies),
    source,
  }
}

// ─────────────────────────────────────────────────────────────
//  3. المولّد القاعدي (الاحتياطي)
// ─────────────────────────────────────────────────────────────

/** بنود خاصة بكل قطاع — مفاتيحها هي نفس قطاعات أداة دراسة الجدوى */
const SECTOR_INSIGHTS: Record<
  string,
  { strengths: string[]; weaknesses: string[]; opportunities: string[]; threats: string[] }
> = {
  "مطاعم وأغذية": {
    strengths: [
      "هامش ربح مرتفع نسبياً على المشروبات والأصناف المحضّرة داخلياً",
      "تكرار شراء عالٍ يبني قاعدة عملاء دائمين بسرعة",
    ],
    weaknesses: [
      "نسبة هدر مرتفعة في المواد الخام قصيرة الصلاحية",
      "الاعتماد على مهارة الطاهي يجعل جودة المنتج عرضة للتقلّب",
    ],
    opportunities: [
      "نمو الطلب على التوصيل عبر التطبيقات يوسّع النطاق الجغرافي دون فروع جديدة",
      "الطلب المتزايد على الخيارات الصحية يفتح مجالاً لأصناف بهامش أعلى",
    ],
    threats: [
      "تقلّب أسعار المواد الغذائية يضغط على هامش الربح مباشرة",
      "متطلبات التراخيص الصحية والتفتيش الدوري ترفع الكلفة التشغيلية",
    ],
  },
  "تجارة وتجزئة": {
    strengths: [
      "تنوّع الأصناف يسمح بتوزيع المخاطر على أكثر من خط إيراد",
      "دورة تحويل نقدي قصيرة عند البيع المباشر للمستهلك",
    ],
    weaknesses: [
      "رأس مال مجمّد في المخزون يحدّ من مرونة السيولة",
      "قوة تفاوضية محدودة مع الموردين في بداية النشاط",
    ],
    opportunities: [
      "الدمج بين المتجر والقنوات الرقمية يرفع المبيعات دون مضاعفة الإيجار",
      "بناء علامة خاصة على أصناف مختارة يرفع الهامش",
    ],
    threats: [
      "منافسة المتاجر الكبرى والمنصات الإلكترونية على السعر",
      "تراكم المخزون الراكد وتقادمه يقتطع من الربحية",
    ],
  },
  خدمات: {
    strengths: [
      "احتياج رأسمالي منخفض للبدء مقارنة بالمشاريع السلعية",
      "قابلية تسعير الخدمة حسب القيمة المقدَّمة لا حسب التكلفة فقط",
    ],
    weaknesses: [
      "ارتباط الإيراد بساعات عمل الفريق يحدّ من قابلية التوسّع",
      "صعوبة إثبات جودة الخدمة قبل الشراء يطيل دورة البيع",
    ],
    opportunities: [
      "تحويل الخدمة إلى باقات اشتراك شهرية يثبّت الإيراد المتكرر",
      "التعاقد مع جهات مؤسسية يرفع متوسط قيمة العقد",
    ],
    threats: [
      "انتقال الكفاءات إلى المنافسين يهدّد استمرارية الجودة",
      "سهولة الدخول للسوق تجذب منافسين جدداً بأسعار أقل",
    ],
  },
  "تقني وناشئ": {
    strengths: [
      "كلفة حدية شبه صفرية لخدمة كل مستخدم إضافي",
      "قابلية القياس الدقيق لسلوك المستخدمين وتحسين المنتج بسرعة",
    ],
    weaknesses: [
      "فترة تطوير طويلة قبل أول إيراد فعلي",
      "الاعتماد على فريق تقني صغير يخلق مخاطرة تمركز المعرفة",
    ],
    opportunities: [
      "التوسّع الجغرافي بلا كلفة تشغيلية إضافية تُذكر",
      "بناء تكامل مع منصات قائمة يفتح قناة استحواذ منخفضة الكلفة",
    ],
    threats: [
      "نسخ الميزة الأساسية من قبل لاعب أكبر خلال أشهر",
      "ارتفاع كلفة استحواذ المستخدم مع اشتداد المنافسة الإعلانية",
    ],
  },
  صناعي: {
    strengths: [
      "التحكّم الكامل في الجودة والتكلفة عبر سلسلة الإنتاج",
      "وفرة الحجم تخفض تكلفة الوحدة عند رفع الطاقة الإنتاجية",
    ],
    weaknesses: [
      "استثمار رأسمالي ضخم يطيل فترة استرداد رأس المال",
      "تكاليف ثابتة مرتفعة ترفع نقطة التعادل",
    ],
    opportunities: [
      "توجّهات إحلال الواردات تدعم المنتج المحلي",
      "التصدير إلى الأسواق المجاورة يوسّع قاعدة الطلب",
    ],
    threats: [
      "تقلّب أسعار الطاقة والمواد الخام يصعّب تثبيت التسعير",
      "توقّف خط الإنتاج لأي خلل فني يوقف الإيراد بالكامل",
    ],
  },
}

/** بنود عامة تُستخدم للقطاعات غير المعرّفة أو لإكمال النقص */
const GENERIC_INSIGHTS = {
  strengths: [
    "مرونة عالية في تعديل المنتج والتسعير سريعاً استجابة للسوق",
    "هيكل تنظيمي بسيط يجعل قرارات التشغيل سريعة ومنخفضة الكلفة",
  ],
  weaknesses: [
    "غياب وعي بالعلامة يجعل أول عملاء المشروع الأصعب والأغلى",
    "محدودية الموارد التسويقية أمام المنافسين المستقرين",
  ],
  opportunities: [
    "قنوات التسويق الرقمي تتيح الوصول للفئة المستهدفة بميزانية محدودة",
    "برامج دعم المشاريع الصغيرة تفتح باب تمويل وتأهيل بكلفة منخفضة",
  ],
  threats: [
    "دخول منافس بتمويل أكبر قادر على تحمّل حرب أسعار",
    "تغيّر سلوك الشراء أو الظروف الاقتصادية يضغط على الطلب المتوقع",
  ],
}

/** بنود مرتبطة بمرحلة المشروع */
const STAGE_INSIGHTS: Record<
  SwotStage,
  { strengths: string; weaknesses: string; opportunities: string; threats: string }
> = {
  idea: {
    strengths: "إمكانية تصميم نموذج العمل من الصفر دون التزامات أو أصول موروثة",
    weaknesses: "عدم وجود بيانات تشغيلية فعلية يجعل كل التقديرات المالية افتراضية",
    opportunities: "اختبار الفكرة بنموذج مبدئي مصغّر قبل ضخّ رأس المال الكامل",
    threats: "بدء التنفيذ قبل التحقّق من وجود طلب حقيقي على المنتج",
  },
  running: {
    strengths: "وجود تاريخ تشغيلي وبيانات مبيعات فعلية تُبنى عليها القرارات",
    weaknesses: "عمليات وأنظمة قائمة يصعب تغييرها دون تعطيل الإيراد الحالي",
    opportunities: "رفع القيمة الشرائية للعملاء الحاليين أرخص من استقطاب عملاء جدد",
    threats: "الجمود التشغيلي أمام تغيّر تفضيلات العملاء الحاليين",
  },
  expansion: {
    strengths: "نموذج عمل مُختبَر وقابل للتكرار في موقع أو قناة جديدة",
    weaknesses: "ضغط التوسّع على السيولة التشغيلية للنشاط القائم",
    opportunities: "الاستفادة من وفرة الحجم في التفاوض مع الموردين",
    threats: "تراجع جودة الخدمة أو تماسك الفريق مع تسارع التوسّع",
  },
}

/**
 * يبني تحليلاً رباعياً بقواعد المنصة — مخصَّصاً حسب القطاع والمرحلة
 * والفئة المستهدفة والمنافسين، وليس نصاً ثابتاً.
 */
export const buildHeuristicAnalysis = (
  input: SwotInput,
  selections?: SwotSelectionPayload | null
): SwotAnalysis => {
  const sector = SECTOR_INSIGHTS[input.sector] ?? GENERIC_INSIGHTS
  const stage = STAGE_INSIGHTS[input.stage]
  const name = input.projectName.trim() || "المشروع"
  const market = input.targetMarket?.trim()
  const competitors = input.competitors?.trim()

  const strengths = [...sector.strengths, stage.strengths]
  const weaknesses = [...sector.weaknesses, stage.weaknesses]
  const opportunities = [...sector.opportunities, stage.opportunities]
  const threats = [...sector.threats, stage.threats]

  if (market) {
    strengths.push(`استهداف واضح لفئة «${market}» يسمح بتوجيه التسويق بدقة وبكلفة أقل`)
    opportunities.push(`توسيع العرض داخل فئة «${market}» عبر منتجات أو باقات مكمّلة`)
  } else {
    weaknesses.push("عدم تحديد الفئة المستهدفة بدقة يبعثر الجهد التسويقي وميزانيته")
  }

  if (competitors) {
    threats.push(`ضغط تنافسي مباشر من ${competitors} على السعر وحصة السوق`)
    strengths.push("معرفة المنافسين المباشرين تتيح بناء تمايز واضح في العرض")
  } else {
    weaknesses.push("غياب مسح للمنافسين يجعل التسعير والتمايز مبنيين على التخمين")
  }

  /**
   * بنود الربع الواحد: إن اختار صاحب المشروع بنوداً فيه فهي وحدها ما
   * يُعرض — موسَّعةً بشروحها المرجعية. وإن تركه فارغاً نملؤه من بنود
   * القطاع والمرحلة ثم البنود العامة.
   */
  const complete = (
    key: SwotQuadrantKey,
    items: string[],
    generic: string[]
  ): SwotItem[] => {
    const userLabels = selections?.items[key] ?? []
    if (userLabels.length) return ensureUserItems([], userLabels)

    return Array.from(new Set([...items, ...generic]))
      .slice(0, MAX_ITEMS)
      .map((title) => ({ title, source: "ai" as const }))
  }

  const quadrants = {
    strengths: complete("strengths", strengths, GENERIC_INSIGHTS.strengths),
    weaknesses: complete("weaknesses", weaknesses, GENERIC_INSIGHTS.weaknesses),
    opportunities: complete(
      "opportunities",
      opportunities,
      GENERIC_INSIGHTS.opportunities
    ),
    threats: complete("threats", threats, GENERIC_INSIGHTS.threats),
  }

  const strategies: SwotStrategies = {
    so: [
      `استثمار سرعة القرار في «${name}» لاختبار قنوات تسويق رقمية منخفضة الكلفة والتوسّع في الأنجح منها`,
      "ترجمة نقاط القوة التشغيلية إلى رسالة تسويقية واحدة واضحة تخاطب الفئة المستهدفة",
    ],
    wo: [
      "معالجة ضعف وعي العلامة ببناء محتوى ودليل اجتماعي (تجارب عملاء) قبل زيادة الإنفاق الإعلاني",
      "الاستفادة من برامج دعم المشاريع الصغيرة لتغطية فجوة الموارد التسويقية والتأهيلية",
    ],
    st: [
      "التمايز بالقيمة والخدمة لا بالسعر، لتجنّب الدخول في حرب أسعار مع منافس أكبر تمويلاً",
      "تثبيت التكاليف الحسّاسة عبر اتفاقيات توريد أطول أجلاً لحماية هامش الربح",
    ],
    wt: [
      "إبقاء التكاليف الثابتة في أدنى مستوى ممكن حتى تثبيت نقطة التعادل شهرياً",
      "تجزئة التوسّع إلى مراحل مشروطة بمؤشرات أداء، بدل التزام رأسمالي واحد كبير",
    ],
  }

  /**
   * أولويات المسار القاعدي: كل بند ترجمة تنفيذية لاستراتيجية من
   * الاستراتيجيات أعلاه بعينها، لا فكرة مضافة من خارج التحليل.
   */
  const priorities: SwotPriority[] = [
    {
      action: "ثبّت قائمة التكاليف الثابتة واحسب نقطة التعادل الشهرية",
      rationale:
        "الاستراتيجية الانكفائية تقوم على إبقاء التكاليف الثابتة في أدنى مستوى حتى تثبيت نقطة التعادل.",
      successMetric:
        "قائمة تكاليف ثابتة مكتوبة، ورقم تعادل شهري واحد معتمد ومكتوب",
      horizon: "30d",
      sourceStrategyId: "wt-1",
    },
    {
      action: "اختبر قناة تسويق رقمية واحدة وقِس كلفة العميل الواحد",
      rationale: `الاستراتيجية الهجومية تقوم على استثمار سرعة القرار في «${name}» لاختبار قنوات منخفضة الكلفة.`,
      successMetric: "كلفة استحواذ العميل الواحد معروفة برقم من إنفاق فعلي",
      horizon: "60d",
      sourceStrategyId: "so-1",
    },
    {
      action: "تفاوض على تثبيت أسعار بنود التوريد الأعلى كلفة",
      rationale:
        "الاستراتيجية الدفاعية تقوم على تثبيت التكاليف الحسّاسة عبر اتفاقيات توريد أطول أجلاً.",
      successMetric: "اتفاقية توريد واحدة موقّعة تثبّت السعر ستة أشهر فأكثر",
      horizon: "90d",
      sourceStrategyId: "st-2",
    },
  ]

  return {
    ...quadrants,
    id: createReportId(),
    generatedAt: new Date().toISOString(),
    summary: `يعمل «${name}» في قطاع ${input.sector} وهو ${STAGE_LABELS[input.stage]}. يقوم موقعه الاستراتيجي على استثمار مرونته وقربه من ${
      market || "فئته المستهدفة"
    }، في مقابل تحديين أساسيين: محدودية الموارد أمام المنافسين المستقرين، وحساسية الربحية لتقلّب التكاليف. الأولوية في المرحلة القادمة هي تثبيت مصدر إيراد متكرر قبل التوسّع في النفقات الثابتة.`,
    strategies,
    priorities,
    source: "heuristic",
  }
}

// ─────────────────────────────────────────────────────────────
//  4. نقطة الدخول
// ─────────────────────────────────────────────────────────────

/**
 * ينتج تحليل SWOT للمدخلات المعطاة.
 * يحاول الذكاء الاصطناعي أولاً، ويسقط إلى المولّد القاعدي عند
 * غياب المفتاح أو أي فشل في الاتصال — فلا يفشل الطلب أبداً.
 */
export const generateSwotAnalysis = async (
  input: SwotInput,
  selections?: SwotSelectionPayload | null
): Promise<SwotAnalysis> => {
  if (!process.env.OPENAI_API_KEY) {
    logger.warn("OPENAI_API_KEY غير مضبوط — استخدام المولّد القاعدي لتحليل SWOT")
    return buildHeuristicAnalysis(input, selections)
  }

  try {
    return await generateWithAI(input, selections)
  } catch (error) {
    logger.error("تعذّر توليد تحليل SWOT بالذكاء الاصطناعي", { error })
    return buildHeuristicAnalysis(input, selections)
  }
}
