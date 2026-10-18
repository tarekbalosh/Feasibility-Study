import apiClient from "@/lib/axios"
import type {
  PestAnalysisDetail,
  PestAnalysisSummary,
  PestDimension,
  PestCategory,
  PestFactor,
} from "@/types/pest"

export interface CreatePestPayload {
  title: string
  projectName?: string
  projectDescription?: string
  industry?: string
  countryRegion?: string
  departmentId?: string
  planId?: string
  mode?: "manual" | "ai"
}

export interface GeneratePestPayload {
  scope: "full" | "dimension" | "category"
  dimension?: PestDimension
  category?: PestCategory
  strategy: "replace" | "append"
  confirmOverwrite?: boolean
}

export interface GeneratePestResponse {
  success: boolean
  requiresConfirmation?: boolean
  protectedManualCount?: number
  message?: string
  data?: PestAnalysisDetail
  proposedFactors?: Array<{
    dimension: PestDimension
    category: PestCategory
    content: string
    source: "ai"
  }>
}

export const pestService = {
  /** جلب قائمة التحليلات لمساحة العمل */
  async list(options?: { departmentId?: string; mine?: boolean }): Promise<PestAnalysisSummary[]> {
    const { data } = await apiClient.get("/pest", {
      params: options,
    })
    return data.data ?? []
  },

  /** جلب تفاصيل تحليل محدد مع جميع بنوده */
  async get(id: string): Promise<PestAnalysisDetail> {
    const { data } = await apiClient.get(`/pest/${id}`)
    return data.data
  },

  /** إنشاء تحليل جديد */
  async create(payload: CreatePestPayload): Promise<PestAnalysisDetail> {
    const { data } = await apiClient.post("/pest", payload)
    return data.data
  },

  /** تحديث بيانات التحليل الأساسية */
  async update(id: string, payload: Partial<CreatePestPayload> & { status?: "draft" | "completed" }): Promise<void> {
    await apiClient.patch(`/pest/${id}`, payload)
  },

  /** حذف تحليل */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/pest/${id}`)
  },

  /** توليد بالذكاء الاصطناعي */
  async generate(id: string, payload: GeneratePestPayload): Promise<GeneratePestResponse> {
    try {
      const { data } = await apiClient.post(`/pest/${id}/generate`, payload, {
        skipToast: true,
      })
      return data
    } catch (error: any) {
      if (error?.response?.status === 409 && error?.response?.data?.code === "OVERWRITE_CONFIRMATION_REQUIRED") {
        return error.response.data
      }
      throw error
    }
  },

  /** إضافة بند جديد يدوياً */
  async addFactor(
    analysisId: string,
    payload: { dimension: PestDimension; category: PestCategory; content?: string }
  ): Promise<PestFactor> {
    const { data } = await apiClient.post(`/pest/${analysisId}/factors`, payload)
    return data.data
  },

  /** تعديل محتوى بند */
  async updateFactor(analysisId: string, factorId: string, content: string): Promise<PestFactor> {
    const { data } = await apiClient.patch(`/pest/${analysisId}/factors/${factorId}`, { content })
    return data.data
  },

  /** حذف بند */
  async deleteFactor(analysisId: string, factorId: string): Promise<void> {
    await apiClient.delete(`/pest/${analysisId}/factors/${factorId}`)
  },

  /** إعادة ترتيب البنود دفعة واحدة */
  async reorderFactors(analysisId: string, items: Array<{ id: string; sortOrder: number }>): Promise<void> {
    await apiClient.post(`/pest/${analysisId}/factors/reorder`, { items })
  },
}

export default pestService
