import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "react-hot-toast"
import * as toolRunsService from "@/services/toolRuns.service"
import type { ToolRunSummary } from "@/types/toolRun"

export const TOOL_RUNS_KEY = ["tool-runs"] as const

/**
 * تحليلات مساحة العمل المحفوظة — من كل الأدوات.
 * enabled يمنع النداء قبل وجود جلسة: المسار محروس بمساحة العمل،
 * فنداؤه بلا رمز دخول ضجيج شبكة ورسائل 401 بلا فائدة.
 */
export const useToolRuns = (enabled = true) =>
  useQuery<ToolRunSummary[]>({
    queryKey: TOOL_RUNS_KEY,
    queryFn: () => toolRunsService.listToolRuns(),
    enabled,
    staleTime: 30_000,
  })

/** حذف تحليل محفوظ */
export const useDeleteToolRun = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => toolRunsService.deleteToolRun(id),
    onSuccess: () => {
      toast.success("تم حذف التحليل بنجاح")
      queryClient.invalidateQueries({ queryKey: TOOL_RUNS_KEY })
    },
    onError: () => {
      toast.error("تعذّر حذف التحليل. حاول مرة أخرى.")
    },
  })
}
