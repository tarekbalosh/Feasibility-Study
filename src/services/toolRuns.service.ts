import apiClient from "@/lib/axios"
import type {
  SaveToolRunPayload,
  ToolRunDetail,
  ToolRunSummary,
} from "@/types/toolRun"

/**
 * خدمة مخرجات الأدوات المحفوظة.
 *
 * صامتة كخدمة مساحة العمل: الحفظ يجري في خلفية عمل المستخدم، فلا
 * يجوز أن يقطع تنبيهُ خطأ تحليلاً ظهر أمامه للتوّ. المُستدعي يقرّر
 * ما يعرضه.
 */
const SILENT = { silent: true } as const

/** كل تحليلات مساحة العمل — أحدثها أولاً */
export const listToolRuns = async (
  toolSlug?: string
): Promise<ToolRunSummary[]> => {
  const { data } = await apiClient.get("/tool-runs", {
    ...SILENT,
    params: toolSlug ? { tool: toolSlug } : undefined,
  })
  return data.data ?? []
}

/** تحليل واحد بحمولته الكاملة */
export const getToolRun = async <TInput = unknown, TOutput = unknown>(
  id: string
): Promise<ToolRunDetail<TInput, TOutput>> => {
  const { data } = await apiClient.get(`/tool-runs/${id}`, SILENT)
  return data.data
}

/** حفظ أو تحديث — يعيد السجل ليحتفظ المُستدعي بمعرّفه */
export const saveToolRun = async (
  payload: SaveToolRunPayload
): Promise<ToolRunSummary> => {
  const { data } = await apiClient.post("/tool-runs", payload, SILENT)
  return data.data
}

/** حذف تحليل من لوحة التحكم */
export const deleteToolRun = async (id: string): Promise<void> => {
  await apiClient.delete(`/tool-runs/${id}`, SILENT)
}
