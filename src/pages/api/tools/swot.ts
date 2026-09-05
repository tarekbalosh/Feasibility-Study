import type { NextApiRequest, NextApiResponse } from "next"
import { z } from "zod"
import { generateSwotAnalysis } from "@/services/swot.service"
import { requireWorkspaceApi } from "@/lib/requireWorkspaceApi"
import type { SwotApiResponse } from "@/types/swot"

/**
 * POST /api/tools/swot
 * يستقبل مدخلات المشروع ويعيد تحليلاً رباعياً (SWOT) كاملاً.
 * التوليد يجري على الخادم حتى لا يُكشف مفتاح OpenAI للمتصفح.
 *
 * المسار مقصور على أعضاء مساحة عمل فعّالة: الحارس على الواجهة وحده
 * يُتجاوَز بنداء مباشر، فالتحقق يتكرّر هنا أيضاً.
 */

/**
 * اختيارات شاشة العناصر — اختيارية بالكامل: تُرسل كنصوص لا كمعرّفات،
 * فلا يحتاج الخادم إلى معرفة القوائم المرجعية. الحدود هنا حماية للـ
 * Prompt من حِمل ضخم، لا قيود واجهة.
 */
const MAX_SELECTED_PER_CATEGORY = 40
const MAX_SELECTION_LABEL = 120

const labelList = z
  .array(z.string().trim().min(1).max(MAX_SELECTION_LABEL))
  .max(MAX_SELECTED_PER_CATEGORY)
  .default([])

const swotSelectionsSchema = z.object({
  items: z.object({
    strengths: labelList,
    weaknesses: labelList,
    opportunities: labelList,
    threats: labelList,
  }),
  conflicts: z
    .array(
      z.object({
        strength: z.string().trim().min(1).max(MAX_SELECTION_LABEL),
        weakness: z.string().trim().min(1).max(MAX_SELECTION_LABEL),
      })
    )
    .max(MAX_SELECTED_PER_CATEGORY)
    .default([]),
})

const swotInputSchema = z.object({
  projectName: z
    .string()
    .trim()
    .min(2, "اسم المشروع مطلوب")
    .max(100, "الحد الأقصى 100 حرف"),
  sector: z.string().trim().min(1, "يرجى اختيار القطاع").max(60),
  description: z
    .string()
    .trim()
    .min(30, "الحد الأدنى لوصف المشروع 30 حرفاً")
    .max(1000, "الحد الأقصى 1000 حرف"),
  targetMarket: z.string().trim().max(200).optional(),
  competitors: z.string().trim().max(300).optional(),
  stage: z.enum(["idea", "running", "expansion"]),
  selections: swotSelectionsSchema.optional(),
})

// ── محدِّد معدّل الطلبات: 10 طلبات/ساعة لكل عنوان IP ──────────
// التوليد يستهلك رصيد OpenAI، فالحد قائم فوق حارس مساحة العمل.
const RATE_LIMIT = 10
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SwotApiResponse | { message: string; errors?: unknown }>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST")
    return res.status(405).json({ message: "الطريقة غير مسموحة" })
  }

  // التحقق يسبق محدِّد المعدّل: الطلبات غير الصالحة لا تصل إلى OpenAI،
  // فلا معنى لأن تستهلك حصة المستخدم.
  const parsed = swotInputSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({
      message: "البيانات المُدخلة غير مكتملة أو غير صالحة",
      errors: parsed.error.flatten().fieldErrors,
    })
  }

  if (isRateLimited(getClientKey(req))) {
    return res.status(429).json({
      message: `تم تجاوز الحد المسموح (${RATE_LIMIT} تحليلات/ساعة). يرجى المحاولة لاحقاً.`,
    })
  }

  // حارس مساحة العمل — يكتب استجابة الرفض بنفسه ويعيد null عند الفشل
  const workspace = await requireWorkspaceApi(req, res)
  if (!workspace) return

  try {
    const { selections, ...input } = parsed.data
    const analysis = await generateSwotAnalysis(input, selections)
    return res.status(200).json({ analysis })
  } catch (error) {
    // generateSwotAnalysis يسقط داخلياً إلى المولّد القاعدي،
    // فالوصول إلى هنا يعني خللاً غير متوقّع.
    console.error("[ERROR] SWOT endpoint failed", error)
    return res
      .status(500)
      .json({ message: "تعذّر إنشاء التحليل حالياً. يرجى المحاولة مرة أخرى." })
  }
}
