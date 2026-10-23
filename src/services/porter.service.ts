import apiClient from "@/lib/axios";
import type {
  PorterAnalysisDetail,
  PorterAnalysisSummary,
  PorterForces,
  PorterCreationMode,
  PorterStatus,
} from "@/types/porter";

export interface CreatePorterPayload {
  title: string;
  projectName?: string;
  projectDescription?: string;
  industry?: string;
  countryRegion?: string;
  departmentId?: string;
  planId?: string;
  mode?: PorterCreationMode;
  forces?: Partial<PorterForces>;
}

export interface UpdatePorterPayload {
  title?: string;
  projectName?: string;
  projectDescription?: string;
  industry?: string;
  countryRegion?: string;
  status?: PorterStatus;
  creationMode?: PorterCreationMode;
  forces?: Partial<PorterForces>;
}

export interface GeneratePorterPayload {
  projectDescription: string;
  projectName?: string;
  industry?: string;
  countryRegion?: string;
}

export interface GeneratePorterResponse {
  success: boolean;
  message?: string;
  forces: PorterForces;
  model: string;
  usedFallback: boolean;
}

export const porterService = {
  /** جلب قائمة التحليلات لمساحة العمل */
  async list(options?: { departmentId?: string; mine?: boolean }): Promise<PorterAnalysisSummary[]> {
    const { data } = await apiClient.get("/porter", {
      params: options,
    });
    return data.data ?? [];
  },

  /** جلب تفاصيل تحليل محدد مع قواه الخمس */
  async get(id: string): Promise<PorterAnalysisDetail> {
    const { data } = await apiClient.get(`/porter/${id}`);
    return data.data;
  },

  /** إنشاء تحليل جديد */
  async create(payload: CreatePorterPayload): Promise<PorterAnalysisDetail> {
    const { data } = await apiClient.post("/porter", payload);
    return data.data;
  },

  /** حفظ وتحديث بيانات التحليل والقوى */
  async update(id: string, payload: UpdatePorterPayload): Promise<PorterAnalysisDetail> {
    const { data } = await apiClient.put(`/porter/${id}`, payload);
    return data.data;
  },

  /** حذف تحليل */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/porter/${id}`);
  },

  /** توليد القوى الخمس بالذكاء الاصطناعي (مخرجات قابلة للمراجعة) */
  async generate(payload: GeneratePorterPayload): Promise<GeneratePorterResponse> {
    const { data } = await apiClient.post("/porter/generate", payload, {
      skipToast: true,
    });
    return data;
  },
};

export default porterService;
