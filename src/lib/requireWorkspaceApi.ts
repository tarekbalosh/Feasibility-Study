import type { NextApiRequest, NextApiResponse } from "next"
import { PRODUCTION_API_URL, sanitizeApiBaseUrl } from "./apiBaseUrl"

/**
 * حارس مساحة العمل لمسارات Next API (المسارات التي تعمل على Vercel
 * لا على خادم Express).
 *
 * لا يملك هذا المسار اتصالاً بقاعدة البيانات ولا JWT_SECRET، فيسأل
 * الخادم الخلفي عبر تمرير ترويسة Authorization كما وصلت. هذا يُبقي
 * الحقيقة في مكان واحد (جدول workspace_members) بدل تكرار منطق
 * التحقق في طبقتين قد تتباعدان.
 */


/** نفس القيمة الافتراضية في next.config.js — العنوان المحلي للخادم الخلفي */
const LOCAL_API_URL = "http://localhost:8080/api"

/**
 * عنوان الخادم الخلفي كما يراه **خادم Next** لا المتصفح.
 *
 * الفارق جوهري: المتصفح يستعمل مساراً نسبياً (/local-api) يترجمه
 * الـ rewrite، أما fetch داخل Node فيرفض أي عنوان غير مطلق ويسقط
 * بـ "Failed to parse URL". لذلك لا يصلح NEXT_PUBLIC_API_BASE_URL
 * هنا كما هو، ويُشتق العنوان بالترتيب:
 *   1. BACKEND_API_URL   — متغيّر الخادم الصريح (يضبطه next.config أيضاً)
 *   2. NEXT_PUBLIC_...   — إن كان مطلقاً
 *   3. محلي أو إنتاجي    — حسب بيئة التشغيل
 */
const getApiBaseUrl = (): string => {
  const explicit = process.env.BACKEND_API_URL
  if (explicit) return explicit.replace(/\/$/, "")

  const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || ""

  // مسار نسبي: صالح للمتصفح، عديم المعنى على الخادم
  if (!/^https?:\/\//i.test(baseURL)) {
    return process.env.NODE_ENV === "production"
      ? PRODUCTION_API_URL
      : LOCAL_API_URL
  }

  return sanitizeApiBaseUrl(baseURL).replace(/\/$/, "")
}

export interface WorkspaceContext {
  id: string
  name: string
  role: string
}

/**
 * يتحقق أن صاحب الطلب مسجَّل دخول وعضو في مساحة عمل فعّالة.
 * يكتب الاستجابة المناسبة ويعيد null عند الفشل، أو يعيد بيانات
 * المساحة عند النجاح.
 */
export async function requireWorkspaceApi(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<WorkspaceContext | null> {
  const authorization = req.headers.authorization

  if (!authorization?.startsWith("Bearer ")) {
    res.status(401).json({
      code: "AUTH_REQUIRED",
      message: "يجب تسجيل الدخول لاستخدام هذه الأداة.",
    })
    return null
  }

  let response: Response

  try {
    response = await fetch(`${getApiBaseUrl()}/workspaces/status`, {
      method: "GET",
      headers: { Authorization: authorization, Accept: "application/json" },
    })
  } catch (error) {
    // تعذّر الوصول إلى الخادم الخلفي: نرفض بدل أن نسمح — الحارس
    // المتساهل عند العطل ثغرة، لا تسامحاً مع المستخدم.
    console.error("[ERROR] workspace guard: backend unreachable", error)
    res.status(503).json({
      code: "SERVICE_UNAVAILABLE",
      message: "تعذّر التحقق من مساحة عملك حالياً. حاول مرة أخرى بعد قليل.",
    })
    return null
  }

  if (response.status === 401) {
    res.status(401).json({
      code: "AUTH_REQUIRED",
      message: "انتهت صلاحية جلستك. سجّل الدخول مرة أخرى.",
    })
    return null
  }

  if (!response.ok) {
    res.status(403).json({
      code: "WORKSPACE_REQUIRED",
      message: "يجب إنشاء مساحة عمل أولاً لاستخدام الأدوات.",
    })
    return null
  }

  const body = (await response.json().catch(() => null)) as
    | { hasWorkspace?: boolean; data?: WorkspaceContext | null }
    | null

  if (!body?.hasWorkspace || !body.data) {
    res.status(403).json({
      code: "WORKSPACE_REQUIRED",
      message: "يجب إنشاء مساحة عمل أولاً لاستخدام الأدوات.",
    })
    return null
  }

  return body.data
}
