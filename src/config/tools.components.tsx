import React from "react"
import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"

/** شاشة التحميل أثناء جلب حزمة الأداة */
const ToolLoading: React.FC = () => (
  <div className="min-h-[60vh] flex items-center justify-center bg-slate-50" dir="rtl">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      <p className="text-sm text-slate-500 font-medium">جارٍ تحميل الأداة...</p>
    </div>
  </div>
)

/**
 * ─────────────────────────────────────────────────────────────
 *  خريطة الأدوات → المكوّنات
 * ─────────────────────────────────────────────────────────────
 *  كل أداة حالتها "live" أو "beta" في السجلّ يجب أن يكون لها
 *  مدخل هنا. التحميل كسول (dynamic) حتى لا تُحمّل حزمة أداة
 *  إلا عند فتح صفحتها فعلياً.
 *
 *  ssr: false — لأن الأدوات تعتمد على حالة المتصفح (المسودات
 *  المحفوظة في localStorage) ولا فائدة من تصييرها على الخادم.
 * ─────────────────────────────────────────────────────────────
 */
export const toolComponents: Record<string, React.ComponentType> = {
  "feasibility-study": dynamic(() => import("@/pages/tool/FeasibilityTool"), {
    ssr: false,
    loading: () => <ToolLoading />,
  }),
  swot: dynamic(() => import("@/components/tools/swot/SwotTool"), {
    ssr: false,
    loading: () => <ToolLoading />,
  }),
}

/** هل للأداة مكوّن مربوط فعلياً؟ */
export const hasToolComponent = (slug: string): boolean =>
  Object.prototype.hasOwnProperty.call(toolComponents, slug)

/** جلب مكوّن الأداة، أو undefined إن لم يكن مربوطاً بعد */
export const getToolComponent = (slug: string): React.ComponentType | undefined =>
  toolComponents[slug]
