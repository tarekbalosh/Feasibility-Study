/**
 * ─────────────────────────────────────────────────────────────
 *  خطط الاشتراك — المصدر الوحيد لقواعد الوصول المدفوع
 * ─────────────────────────────────────────────────────────────
 *  أي ميزة مدفوعة في المنصة تسأل هذا الملف، ولا تفحص `user.plan`
 *  بنفسها. عند تغيّر آلية الاشتراك مستقبلاً (اشتراك من الخادم،
 *  فترة تجريبية، صلاحية منتهية…) يُعدَّل `isProPlan` هنا وحده
 *  فتتبعه كل الميزات دون تعديل في المكوّنات.
 * ─────────────────────────────────────────────────────────────
 */

/** الخطط المتاحة — مطابقة لحقل plan في نموذج المستخدم */
export type PlanId = "free" | "pro" | "enterprise"

/** الخطط التي تفتح الميزات المدفوعة */
export const PAID_PLANS: PlanId[] = ["pro", "enterprise"]

/** الخطة الافتراضية لمن لا يملك اشتراكاً — أو لم يسجّل دخوله أصلاً */
export const DEFAULT_PLAN: PlanId = "free"

/** مسار صفحة الخطط والأسعار — وجهة كل أزرار الترقية */
export const UPGRADE_PATH = "/pricing"

/** الأسماء العربية المعروضة للخطط */
export const PLAN_LABELS: Record<PlanId, string> = {
  free: "المجانية",
  pro: "الاحترافية",
  enterprise: "المؤسسات",
}

/** هل تفتح هذه الخطة الميزات المدفوعة؟ */
export const isProPlan = (plan?: string | null): boolean =>
  PAID_PLANS.includes((plan ?? DEFAULT_PLAN) as PlanId)

/** توحيد أي قيمة قادمة من الخادم إلى خطة معروفة */
export const normalizePlan = (plan?: string | null): PlanId =>
  plan === "pro" || plan === "enterprise" || plan === "free"
    ? plan
    : DEFAULT_PLAN
