import { useMemo } from "react"
import { useAuth } from "@/context/AuthContext"
import {
  DEFAULT_PLAN,
  PLAN_LABELS,
  UPGRADE_PATH,
  isProPlan,
  normalizePlan,
  type PlanId,
} from "@/config/plans"

export interface PlanAccess {
  /** خطة المستخدم الحالية — free لغير المسجّل */
  plan: PlanId
  /** الاسم العربي المعروض للخطة */
  planLabel: string
  /** هل الميزات المدفوعة مفتوحة؟ */
  isPro: boolean
  /** لم يسجّل دخوله بعد — يفيد في صياغة رسالة القفل */
  isGuest: boolean
  /** ما زالت حالة الاشتراك قيد التحميل من التخزين المحلي */
  isLoading: boolean
  /** وجهة أزرار الترقية */
  upgradePath: string
}

/**
 * حالة اشتراك المستخدم كما تراها الواجهة.
 * نقطة الفحص الوحيدة للميزات المدفوعة — لا يفحص أي مكوّن
 * `user.plan` مباشرة، فيبقى تغيير آلية الاشتراك في مكان واحد.
 */
export const usePlanAccess = (): PlanAccess => {
  const { user, isAuthenticated, isLoading } = useAuth()

  return useMemo(() => {
    const plan = isAuthenticated ? normalizePlan(user?.plan) : DEFAULT_PLAN

    return {
      plan,
      planLabel: PLAN_LABELS[plan],
      isPro: isProPlan(plan),
      isGuest: !isAuthenticated,
      isLoading,
      upgradePath: UPGRADE_PATH,
    }
  }, [isAuthenticated, isLoading, user?.plan])
}

export default usePlanAccess
