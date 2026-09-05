/** بطاقة تحليل محفوظ كما تظهر في لوحة التحكم (بلا الحمولة الكاملة) */
export interface ToolRunSummary {
  id: string
  toolSlug: string
  title: string
  summary: string | null
  createdAt: string
  updatedAt: string
  user: { id: string; name: string } | null
}

/** تحليل محفوظ بحمولته الكاملة — لإعادة فتحه داخل أداته */
export interface ToolRunDetail<TInput = unknown, TOutput = unknown>
  extends ToolRunSummary {
  input: TInput | null
  output: TOutput | null
}

/** ما تُرسله الأداة عند الحفظ. تمرير id يعني تحديث السجل نفسه. */
export interface SaveToolRunPayload {
  id?: string
  toolSlug: string
  title: string
  summary?: string
  input: unknown
  output: unknown
}
