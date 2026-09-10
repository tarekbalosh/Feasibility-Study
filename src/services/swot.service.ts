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
  type SwotStrategyKey,
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
5. ملزم جداً في استراتيجيات التقاطعات (strategies): عند وجود اختيارات للمستخدم في أي محورين، يجب صياغة كل استراتيجية تقاطعية (so, wo, st, wt) بالربط المباشر بين نصوص/مفاهيم العناصر المختارة من قبل المستخدم حصراً. يمنع إدخال استراتيجيات تعتمد على مفاهيم غير موجودة في الاختيارات (مثل وعي العلامة أو سرعة القرار إن لم تكن مختارة صراحة).`
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
- استخرج استراتيجيات من تقاطعات المصفوفة: من بندين إلى ثلاثة في كل تقاطع، بشرط الإلزام: إذا كان المستخدم قد حدد اختيارات في أي ربع، فيجب أن تُشير الاستراتيجيات التقاطعية صراحةً لنصوص أو مفاهيم العناصر المختارة فقط دون إدخال عناوين أو مفاهيم خارجية غير مختارة.
- ثلاث أولويات تنفيذية (priorities) لأول ٩٠ يوماً، بهذه القيود الملزِمة:
  • كل أولوية مشتقّة من استراتيجية موجودة فعلاً في strategies أعلاه — ممنوع إدخال فكرة جديدة لم تظهر في التحليل.
  • sourceStrategyId يشير إلى تلك الاستراتيجية بالصيغة «so-1» أي أول عنصر في strategies.so، و«wt-2» أي ثاني عنصر في strategies.wt. لا تشر إلى عنصر غير موجود.
  • action: فعل تنفيذي مباشر يبدأ بفعل أمر (ثبّت، اختبر، تفاوض، أطلق…) لا وصفاً ولا نصيحة عامة.
  • rationale: سطر واحد يربط الإجراء ببند محدد من المصفوفة.
  • successMetric: رقم أو حدث يُعرف به الإنجاز، لا عبارة إنشائية.
  • horizon: إحدى القيم 30d أو 60d أو 90d، وليكن لكل أولوية أفق مختلف.
- ملخص تنفيذي احترافي مُحكَم من 3 إلى 4 جمل يوضّح الموقف الاستراتيجي العام للمشروع، ملتزماً بالهيكل والمحتوى التالي بدقة:
  • لمحة سريعة عن المشروع: يذكر اسم المشروع وقطاعه ومرحلته التشغيلية.
  • الموقف الاستراتيجي الإيجابي (القوة × الفرص): يذكر صراحةً أهم نقاط القوة والفرص المختارة من صاحب المشروع (بأسمائها أو مفاهيمها المباشرة) مبيّناً كيف تُستغل نقاط القوة لاقتناص تلك الفرص.
  • التحديات الرئيسية (الضعف × المخاطر): يذكر صراحةً أبرز نقاط الضعف والمخاطر المختارة (بأسمائها أو مفاهيمها المباشرة) كتحديات يتعين التعامل معها.
  • التوصية والأولوية الاستراتيجية: توصية واحدة محددة وقابلة للتنفيذ للمرحلة القادمة مبنية على التوفيق بين عناصر التحليل.
  * يُمنع منعاً باتاً استخدام عبارات افتراضية عامة غير مذكورة في عناصر SWOT (مثل: "استثمار مرونته"، "قربه من فئته المستهدفة"، "محدودية الموارد أمام المنافسين").
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

// ─────────────────────────────────────────────────────────────
//  توليد وتحقق استراتيجيات التقاطعات المبنية على اختيارات المستخدم
// ─────────────────────────────────────────────────────────────

const QUADRANT_PAIRS: Record<SwotStrategyKey, [SwotQuadrantKey, SwotQuadrantKey]> = {
  so: ["strengths", "opportunities"],
  wo: ["weaknesses", "opportunities"],
  st: ["strengths", "threats"],
  wt: ["weaknesses", "threats"],
}

/** استخراج الكلمات المفتاحية ذات المعنى من نص العنصر */
const getSignificantKeywords = (text: string): string[] => {
  const normalized = normalizeArabic(text)
  const stopWords = new Set(["في", "من", "على", "عن", "إلى", "مع", "أو", "و", "أن", "ما", "هذا", "هذه", "تم", "عدم", "عبر"])
  return normalized
    .split(/\s+/)
    .map((w) => w.replace(/[^\w\u0600-\u06FF]/g, ""))
    .filter((w) => w.length >= 3 && !stopWords.has(w))
}

/** فحص ما إذا كان نص الاستراتيجية يذكر أو يرتبط بأي من عناصر القائمة */
const matchesAnyItem = (strategyText: string, items: string[]): boolean => {
  if (!items || items.length === 0) return true
  const normStrategy = normalizeArabic(strategyText)

  for (const item of items) {
    const normItem = normalizeArabic(item)
    if (normStrategy.includes(normItem) || normItem.includes(normStrategy)) {
      return true
    }
    const keywords = getSignificantKeywords(item)
    if (keywords.length > 0 && keywords.some((kw) => normStrategy.includes(kw))) {
      return true
    }
  }
  return false
}

/** التأكد من أن الاستراتيجية التقاطعية ترتبط بعناصر المحورين المختارة */
const isStrategyValidForSelections = (
  strategyText: string,
  userItems1: string[],
  userItems2: string[]
): boolean => {
  const matches1 = matchesAnyItem(strategyText, userItems1)
  const matches2 = matchesAnyItem(strategyText, userItems2)
  return matches1 && matches2
}

/**
 * توليد استراتيجيات تقاطعية ديناميكياً ومباشرة من العناصر المختارة
 */
export const buildDynamicStrategiesFromSelections = (
  quadrants: Record<SwotQuadrantKey, SwotItem[]>,
  selections?: SwotSelectionPayload | null
): SwotStrategies => {
  const getItems = (key: SwotQuadrantKey): string[] => {
    const userSelected = selections?.items[key]
    if (userSelected && userSelected.length > 0) {
      return userSelected
    }
    return (quadrants[key] ?? []).map((i) => i.title).filter(Boolean)
  }

  const sList = getItems("strengths")
  const wList = getItems("weaknesses")
  const oList = getItems("opportunities")
  const tList = getItems("threats")

  // SO: Strengths x Opportunities
  const so: string[] = []
  if (sList.length && oList.length) {
    const s1 = sList[0]
    const o1 = oList[0]
    so.push(`استثمار «${s1}» اقتناصاً لـ «${o1}» والتوسع عبرها`)
    if (sList.length > 1 || oList.length > 1) {
      const s2 = sList[1] ?? s1
      const o2 = oList[1] ?? o1
      so.push(`توظيف «${s2}» للاستفادة المباشرة من «${o2}»`)
    }
  }

  // WO: Weaknesses x Opportunities
  const wo: string[] = []
  if (wList.length && oList.length) {
    const w1 = wList[0]
    const o1 = oList[0]
    wo.push(`معالجة «${w1}» عبر استغلال «${o1}»`)
    if (wList.length > 1 || oList.length > 1) {
      const w2 = wList[1] ?? w1
      const o2 = oList[1] ?? o1
      wo.push(`التغلب على «${w2}» بالاستفادة من «${o2}»`)
    }
  }

  // ST: Strengths x Threats
  const st: string[] = []
  if (sList.length && tList.length) {
    const s1 = sList[0]
    const t1 = tList[0]
    st.push(`استخدام «${s1}» لمواجهة خطر «${t1}» والحد من تأثيره`)
    if (sList.length > 1 || tList.length > 1) {
      const s2 = sList[1] ?? s1
      const t2 = tList[1] ?? t1
      st.push(`استغلال «${s2}» لحماية المشروع أمام «${t2}»`)
    }
  }

  // WT: Weaknesses x Threats
  const wt: string[] = []
  if (wList.length && tList.length) {
    const w1 = wList[0]
    const t1 = tList[0]
    wt.push(`تقليل آثار «${w1}» لتجنب التأثر بـ «${t1}»`)
    if (wList.length > 1 || tList.length > 1) {
      const w2 = wList[1] ?? w1
      const t2 = tList[1] ?? t1
      wt.push(`الحد من «${w2}» تحسباً لـ «${t2}»`)
    }
  }

  return { so, wo, st, wt }
}

/**
 * دالة التحقق والتنقيب للاستراتيجيات ضد اختيارات المستخدم
 */
export const validateAndSanitizeStrategies = (
  strategies: SwotStrategies,
  quadrants: Record<SwotQuadrantKey, SwotItem[]>,
  selections?: SwotSelectionPayload | null
): SwotStrategies => {
  if (!hasAnySelection(selections)) {
    return strategies
  }

  const dynamicFallback = buildDynamicStrategiesFromSelections(quadrants, selections)
  const sanitized: SwotStrategies = { ...strategies }

  const keys: SwotStrategyKey[] = ["so", "wo", "st", "wt"]
  for (const key of keys) {
    const [axis1, axis2] = QUADRANT_PAIRS[key]
    const userItems1 = selections?.items[axis1] ?? []
    const userItems2 = selections?.items[axis2] ?? []

    if (userItems1.length > 0 || userItems2.length > 0) {
      const currentList = sanitized[key] ?? []
      const validItems = currentList.filter((strat) =>
        isStrategyValidForSelections(strat, userItems1, userItems2)
      )

      if (validItems.length > 0) {
        sanitized[key] = validItems
      } else {
        sanitized[key] = dynamicFallback[key]
      }
    }
  }

  return sanitized
}

/**
 * توليد ملخص تنفيذي ديناميكي واحترافي يعتمد على العناصر المختارة
 * ويربط استراتيجياً بين (القوة × الفرص) و(الضعف × المخاطر).
 */
export const buildDynamicExecutiveSummary = (
  input: SwotInput,
  quadrants: Record<SwotQuadrantKey, SwotItem[]>,
  selections?: SwotSelectionPayload | null
): string => {
  const name = input.projectName.trim() || "المشروع"
  const stageLabel = STAGE_LABELS[input.stage]

  const getItemTitles = (key: SwotQuadrantKey): string[] => {
    const userSelected = selections?.items[key]
    if (userSelected && userSelected.length > 0) {
      return userSelected
    }
    return (quadrants[key] ?? []).map((i) => i.title).filter(Boolean)
  }

  const sList = getItemTitles("strengths")
  const wList = getItemTitles("weaknesses")
  const oList = getItemTitles("opportunities")
  const tList = getItemTitles("threats")

  const sText = sList.length > 1 ? `«${sList[0]}» و«${sList[1]}»` : sList.length === 1 ? `«${sList[0]}»` : ""
  const oText = oList.length > 1 ? `«${oList[0]}» و«${oList[1]}»` : oList.length === 1 ? `«${oList[0]}»` : ""
  const wText = wList.length > 1 ? `«${wList[0]}» و«${wList[1]}»` : wList.length === 1 ? `«${wList[0]}»` : ""
  const tText = tList.length > 1 ? `«${tList[0]}» و«${tList[1]}»` : tList.length === 1 ? `«${tList[0]}»` : ""

  const parts: string[] = []

  // 1. لمحة عن المشروع
  parts.push(`يعمل «${name}» في قطاع ${input.sector} وهو ${stageLabel}.`)

  // 2. الموقف الاستراتيجي الإيجابي (القوة x الفرص)
  if (sText && oText) {
    parts.push(`يعتمد موقعه الاستراتيجي على استثمار نقاط القوة المتمثلة في ${sText} لاقتناص الفرص الواعدة في ${oText}.`)
  } else if (sText) {
    parts.push(`يعتمد موقعه الاستراتيجي على مرتكزات قوة محورية تكمن في ${sText}.`)
  } else if (oText) {
    parts.push(`يتوفر للمشروع آفاق نمو واعدة تعتمد على اقتناص فرص ${oText}.`)
  }

  // 3. التحديات الرئيسية (الضعف x المخاطر)
  if (wText && tText) {
    parts.push(`في المقابل، يواجه المشروع تحديات تشغيلية تتمثل في ${wText} بالتزامن مع مخاطر سوقية تشمل ${tText}.`)
  } else if (wText) {
    parts.push(`في المقابل، تتطلب الاستمرارية معالجة نقاط الضعف الداخلية المتمثلة في ${wText}.`)
  } else if (tText) {
    parts.push(`في المقابل، يتعين على المشروع التحوط ضد المخاطر الخارجية المتمثلة في ${tText}.`)
  }

  // 4. التوصية والأولوية الاستراتيجية
  if (sList.length > 0 && (wList.length > 0 || tList.length > 0)) {
    const mainStrength = sList[0]
    const challenge = wList[0] || tList[0]
    parts.push(`وتكمن الأولوية الاستراتيجية للمرحلة القادمة في توظيف «${mainStrength}» لمعالجة وتخفيف أثر «${challenge}» وتثبيت الجاهزية التشغيلية قبل أي توسّع.`)
  } else {
    parts.push(`وتكمن الأولوية الاستراتيجية للمرحلة القادمة في تثبيت نموذج العمل وتأكيد الجاهزية التشغيلية قبل التوسع في النفقات.`)
  }

  return parts.join(" ")
}

const GENERIC_FALLBACK_PHRASES = [
  "استثمار مرونته وقربه من فئته المستهدفة",
  "استثمار مرونته وقربه من",
  "حساسية الربحية لتقلّب التكاليف",
  "محدودية الموارد أمام المنافسين المستقرين",
]

/**
 * دالة التحقق والتنقية للملخص التنفيذي ضد عناصر المستخدم المختارة.
 * تعيد ملخص الذكاء الاصطناعي إن كان جودة مستوفية، وإلا تُرجع الملخص الديناميكي المولد.
 */
export const validateAndSanitizeSummary = (
  summaryText: string,
  input: SwotInput,
  quadrants: Record<SwotQuadrantKey, SwotItem[]>,
  selections?: SwotSelectionPayload | null
): string => {
  const normSummary = normalizeArabic(summaryText ?? "")

  // إذا احتوى الملخص على العبارات العامة النمطية القديمة، يرفض فوراً
  for (const phrase of GENERIC_FALLBACK_PHRASES) {
    if (normSummary.includes(normalizeArabic(phrase))) {
      return buildDynamicExecutiveSummary(input, quadrants, selections)
    }
  }

  if (!hasAnySelection(selections)) {
    return summaryText && summaryText.length >= 30
      ? summaryText
      : buildDynamicExecutiveSummary(input, quadrants, selections)
  }

  // تجميع كافة بنود المستخدم المختارة
  const userItems: string[] = []
  for (const key of QUADRANT_KEYS) {
    const list = selections?.items[key] ?? []
    userItems.push(...list)
  }

  if (userItems.length === 0) {
    return summaryText && summaryText.length >= 30
      ? summaryText
      : buildDynamicExecutiveSummary(input, quadrants, selections)
  }

  // حساب كم بنداً مختاراً تم ذكره في الملخص
  let matchCount = 0
  for (const item of userItems) {
    if (matchesAnyItem(summaryText, [item])) {
      matchCount++
    }
  }

  // الحد الأدنى للمطابقة: إذا كان المستخدم اختار 4 بنود أو أكثر، يلزم مطابقة 4 بنود على الأقل.
  const requiredMatches = userItems.length >= 4 ? 4 : Math.min(2, userItems.length)

  if (matchCount >= requiredMatches) {
    return summaryText
  }

  // إذا لم يستوفِ التغطية، يتم استبداله بالملخص الديناميكي المُصمم
  return buildDynamicExecutiveSummary(input, quadrants, selections)
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
  const rawParsed = (["so", "wo", "st", "wt"] as const).reduce((acc, key) => {
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

  const strategies = validateAndSanitizeStrategies(rawParsed, quadrants, selections)

  const rawSummary = cleanItem(raw?.summary)
  const summary = validateAndSanitizeSummary(rawSummary, input, quadrants, selections)

  return {
    ...quadrants,
    id: createReportId(),
    generatedAt: new Date().toISOString(),
    summary,
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

  const strategies: SwotStrategies = hasAnySelection(selections)
    ? buildDynamicStrategiesFromSelections(quadrants, selections)
    : {
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
    summary: buildDynamicExecutiveSummary(input, quadrants, selections),
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
