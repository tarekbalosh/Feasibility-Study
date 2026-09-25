import type { NextApiRequest, NextApiResponse } from "next"
import OpenAI from "openai"
import { z } from "zod"
import { openAIConfig } from "@/config/openai.config"
import { requireWorkspaceApi } from "@/lib/requireWorkspaceApi"
import { buildSmartGoalsPrompt } from "@/prompts/feasibility.prompts"
import type { SmartGoal, SmartGoalsApiResponse, SwotQuadrantKey } from "@/types/swot"

// ── Heuristic SMART Goal Builder — متنوع وواقعي لكل نوع SWOT ─────────────
//
// كل ربع يملك 5 قوالب مختلفة تدور على العناصر بالتناوب لضمان:
// - تنوع الفعل الإجرائي لكل هدف
// - تنوع المؤشر القابل للقياس
// - تنوع الإطار الزمني
// النمط مستوحى من buildHeuristicAnalysis في swot.service.ts

interface GoalTemplate {
  verb: string
  action?: string
  metric: string
  pct?: string
  unit?: string
  months: number
  strategy: SmartGoal["strategy_type"]
}

const STRENGTH_TEMPLATES: GoalTemplate[] = [
  { verb: "زيادة الاستثمار في", metric: "نسبة مساهمتها في إيرادات الشركة", pct: "25", months: 6,  strategy: "SO" },
  { verb: "توظيف", action: "لتوسيع حصة السوق", metric: "عدد العملاء الجدد المكتسبين بسببها", pct: "30", months: 9, strategy: "SO" },
  { verb: "تعزيز وتطوير", metric: "مستوى جودة الخدمة (NPS أو رضا العملاء)", pct: "20", months: 6, strategy: "ST" },
  { verb: "استثمار", action: "لمواجهة المنافسين وتعزيز الولاء", metric: "معدل الاحتفاظ بالعملاء", pct: "15", months: 12, strategy: "SO" },
  { verb: "تطوير", action: "وتحويلها إلى ميزة تنافسية راسخة", metric: "حصة السوق المكتسبة", pct: "20", months: 9, strategy: "SO" },
]

const WEAKNESS_TEMPLATES: GoalTemplate[] = [
  { verb: "تقليص أثر", metric: "معدل الشكاوى أو الأخطاء المرتبطة بها", pct: "40", months: 6, strategy: "WO" },
  { verb: "معالجة جذر مشكلة", metric: "وقت الإنجاز أو تكلفة التشغيل المرتبطة بها", pct: "30", months: 9, strategy: "WO" },
  { verb: "تحسين مستوى الأداء في مجال", metric: "مؤشر الكفاءة التشغيلية لهذا المجال", pct: "35", months: 6, strategy: "WT" },
  { verb: "خفض التأثير السلبي لـ", metric: "تكلفة الإصلاح أو المعالجة الناتجة عنها", pct: "25", months: 12, strategy: "WO" },
  { verb: "تطوير خطة علاج موثقة لـ", metric: "نسبة الانحراف عن المعيار المستهدف", pct: "50", months: 9, strategy: "WT" },
]

const OPPORTUNITY_TEMPLATES: GoalTemplate[] = [
  { verb: "استغلال فرصة", metric: "عدد العملاء الجدد المكتسبين من هذه الفرصة", pct: "20", months: 12, strategy: "SO" },
  { verb: "دخول سوق", metric: "حصة السوق المحققة في هذا المجال", pct: "15", months: 9, strategy: "SO" },
  { verb: "إطلاق مبادرة لاستثمار", metric: "الإيرادات المتولدة من هذا المحور", pct: "25", months: 12, strategy: "WO" },
  { verb: "بناء شراكات لتحقيق", metric: "عدد الشراكات المنجزة أو العقود الموقعة", unit: "3 شراكات على الأقل", months: 9, strategy: "SO" },
  { verb: "توسيع قاعدة العملاء عبر", metric: "معدل نمو الإيرادات الناتج عن هذا المحور", pct: "30", months: 12, strategy: "SO" },
]

const THREAT_TEMPLATES: GoalTemplate[] = [
  { verb: "وضع خطة طوارئ لمواجهة", metric: "نسبة تقليص التأثير المالي لهذا الخطر", pct: "50", months: 6, strategy: "ST" },
  { verb: "بناء سياج وقائي لتقليل أثر", metric: "احتمالية تحقق الضرر (Risk Score)", pct: "40", months: 9, strategy: "WT" },
  { verb: "تنويع مصادر الإيراد للحد من تأثير", metric: "نسبة الاعتماد على المصدر المعرَّض للخطر", pct: "30", months: 12, strategy: "ST" },
  { verb: "تدريب الفريق على التعامل مع", metric: "عدد الحوادث المرتبطة بهذا الخطر", unit: "صفر حوادث سنوياً", months: 6, strategy: "ST" },
  { verb: "مراقبة وتحليل مستمر لـ", metric: "وقت الاستجابة عند تحقق هذا الخطر", pct: "60", months: 3, strategy: "WT" },
]

const pick = (arr: GoalTemplate[], idx: number): GoalTemplate => arr[idx % arr.length]

const buildHeuristicGoals = (
  strengths:     { id: string; title: string }[],
  weaknesses:    { id: string; title: string }[],
  opportunities: { id: string; title: string }[],
  threats:       { id: string; title: string }[],
): SmartGoal[] => {
  let num = 0
  const goals: SmartGoal[] = []

  // ── نقاط القوة ────────────────────────────────────────────────────────────
  strengths.forEach((item, idx) => {
    num++
    const t = pick(STRENGTH_TEMPLATES, idx)
    const action = t.action ? ` ${t.action}` : ""
    goals.push({
      goal_number:   num,
      source_type:   "قوة",
      source_id:     item.id,
      source_text:   item.title,
      strategy_type: t.strategy,
      goal:    `${t.verb} "${item.title}"${action} بنسبة ${t.pct}٪ خلال ${t.months} أشهر من خلال برنامج تطوير مستهدف.`,
      metric:  `${t.metric} يرتفع بنسبة ${t.pct}٪`,
      deadline: `خلال ${t.months} أشهر من بدء التنفيذ`,
    })
  })

  // ── نقاط الضعف ────────────────────────────────────────────────────────────
  weaknesses.forEach((item, idx) => {
    num++
    const t = pick(WEAKNESS_TEMPLATES, idx)
    goals.push({
      goal_number:   num,
      source_type:   "ضعف",
      source_id:     item.id,
      source_text:   item.title,
      strategy_type: t.strategy,
      goal:    `${t.verb} "${item.title}" بنسبة ${t.pct}٪ خلال ${t.months} أشهر عبر خطة تحسين قابلة للقياس.`,
      metric:  `${t.metric} ينخفض بنسبة ${t.pct}٪`,
      deadline: `خلال ${t.months} أشهر من بدء التنفيذ`,
    })
  })

  // ── الفرص ─────────────────────────────────────────────────────────────────
  opportunities.forEach((item, idx) => {
    num++
    const t = pick(OPPORTUNITY_TEMPLATES, idx)
    const target = t.unit ?? `${t.pct}٪ في المؤشر المستهدف`
    goals.push({
      goal_number:   num,
      source_type:   "فرصة",
      source_id:     item.id,
      source_text:   item.title,
      strategy_type: t.strategy,
      goal:    `${t.verb} "${item.title}" بتحقيق ${target} خلال ${t.months} أشهر.`,
      metric:  t.unit ? `${t.metric}: ${t.unit}` : `${t.metric} بنسبة ${t.pct}٪`,
      deadline: `خلال ${t.months} أشهر من بدء التنفيذ`,
    })
  })

  // ── المخاطر ───────────────────────────────────────────────────────────────
  threats.forEach((item, idx) => {
    num++
    const t = pick(THREAT_TEMPLATES, idx)
    const target = t.unit ?? `${t.pct}٪`
    goals.push({
      goal_number:   num,
      source_type:   "خطر",
      source_id:     item.id,
      source_text:   item.title,
      strategy_type: t.strategy,
      goal:    `${t.verb} "${item.title}" وخفض احتمالية تأثيره إلى ${target} خلال ${t.months} أشهر.`,
      metric:  t.unit ? `${t.metric}: ${t.unit}` : `${t.metric} بمقدار ${t.pct}٪`,
      deadline: `خلال ${t.months} أشهر من بدء التنفيذ`,
    })
  })

  return goals
}

// ── Zod schema: بند SWOT واحد ─────────────────────────────────
const swotItemSchema = z.object({
  title: z.string().trim().min(1).max(300),
  detail: z.string().trim().max(500).optional(),
  source: z.enum(["user", "ai"]),
  importance: z.enum(["high", "medium", "low"]).optional(),
})

// ── schema للطلب الكامل ──────────────────────────────────────
const requestSchema = z.object({
  projectContext: z
    .string()
    .trim()
    .min(10, "سياق المشروع قصير جداً")
    .max(800, "سياق المشروع طويل جداً"),
  strengths:     z.array(swotItemSchema).max(40).default([]),
  weaknesses:    z.array(swotItemSchema).max(40).default([]),
  opportunities: z.array(swotItemSchema).max(40).default([]),
  threats:       z.array(swotItemSchema).max(40).default([]),
})

// ── Rate limiting: 5 طلبات/ساعة لكل IP ─────────────────────
const RATE_LIMIT = 5
const RATE_WINDOW_MS = 60 * 60 * 1000
const requestLog = new Map<string, number[]>()

const getClientKey = (req: NextApiRequest): string => {
  const forwarded = req.headers["x-forwarded-for"]
  const ip = Array.isArray(forwarded)
    ? forwarded[0]
    : forwarded?.split(",")[0].trim()
  return ip || req.socket.remoteAddress || "unknown"
}

const isRateLimited = (key: string): boolean => {
  const now = Date.now()
  const recent = (requestLog.get(key) ?? []).filter(
    (ts) => now - ts < RATE_WINDOW_MS
  )
  recent.push(now)
  requestLog.set(key, recent)
  return recent.length > RATE_LIMIT
}

// ── استخراج JSON من استجابة النموذج بأمان ──────────────────
const extractJSON = (raw: string): SmartGoal[] => {
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim()
  const parsed = JSON.parse(cleaned)
  if (!Array.isArray(parsed?.goals)) {
    throw new Error("الاستجابة لا تحتوي على مصفوفة goals")
  }
  return parsed.goals as SmartGoal[]
}

// ── Handler الرئيسي ──────────────────────────────────────────
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SmartGoalsApiResponse | { message: string; errors?: unknown }>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST")
    return res.status(405).json({ message: "الطريقة غير مسموحة" })
  }

  const parsed = requestSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({
      message: "البيانات المُدخلة غير مكتملة أو غير صالحة",
      errors: parsed.error.flatten().fieldErrors,
    })
  }

  if (isRateLimited(getClientKey(req))) {
    return res.status(429).json({
      message: `تم تجاوز الحد المسموح (${RATE_LIMIT} طلبات/ساعة). يرجى المحاولة لاحقاً.`,
    })
  }

  const workspace = await requireWorkspaceApi(req, res)
  if (!workspace) return

  const { projectContext, strengths, weaknesses, opportunities, threats } = parsed.data

  const totalItems =
    strengths.length + weaknesses.length + opportunities.length + threats.length
  if (totalItems === 0) {
    return res
      .status(400)
      .json({ message: "لا توجد عناصر SWOT كافية لتوليد الأهداف." })
  }

  const toIdList = (
    items: { title: string; detail?: string; source: "user" | "ai"; importance?: "high" | "medium" | "low" }[],
    prefix: string
  ) => items.map((item, idx) => ({ id: `${prefix}-${idx}`, text: item.title }))

  // ── حارس API key — fallback محلي عند غيابه بدلاً من 500 error ──
  if (!process.env.OPENAI_API_KEY) {
    console.warn("[WARN] OPENAI_API_KEY غير مضبوط — استخدام المولّد القاعدي لأهداف SMART")
    const heuristicGoals = buildHeuristicGoals(
      strengths.map((s, i) => ({ id: `s-${i}`, title: s.title })),
      weaknesses.map((w, i) => ({ id: `w-${i}`, title: w.title })),
      opportunities.map((o, i) => ({ id: `o-${i}`, title: o.title })),
      threats.map((t, i) => ({ id: `t-${i}`, title: t.title })),
    )
    return res.status(200).json({ goals: heuristicGoals })
  }

  const prompt = buildSmartGoalsPrompt(
    projectContext,
    toIdList(strengths,     "s"),
    toIdList(weaknesses,    "w"),
    toIdList(opportunities, "o"),
    toIdList(threats,       "t"),
  )

  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: openAIConfig.timeout,
    })

    const response = await client.chat.completions.create({
      model: openAIConfig.model,
      temperature: 0.4,
      max_tokens: Math.min(totalItems * 200 + 500, 4000),
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "أنت خبير استراتيجي. أجب بـ JSON فقط بالصيغة المطلوبة تماماً دون أي نص إضافي.",
        },
        { role: "user", content: prompt },
      ],
    })

    const rawContent = response.choices?.[0]?.message?.content?.trim() ?? ""
    const goals = extractJSON(rawContent)
    return res.status(200).json({ goals })
  } catch (error) {
    console.error("[ERROR] SMART goals generation failed", error)
    // Fallback عند فشل OpenAI بدلاً من 500
    const heuristicGoals = buildHeuristicGoals(
      strengths.map((s, i) => ({ id: `s-${i}`, title: s.title })),
      weaknesses.map((w, i) => ({ id: `w-${i}`, title: w.title })),
      opportunities.map((o, i) => ({ id: `o-${i}`, title: o.title })),
      threats.map((t, i) => ({ id: `t-${i}`, title: t.title })),
    )
    return res.status(200).json({ goals: heuristicGoals })
  }
}
