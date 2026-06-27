import React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Input } from "@/components/ui/Input"
import { NavigationButtons } from "@/components/tool/NavigationButtons"
import type { ProjectInfoData, UseFeasibilityToolReturn } from "@/hooks/useFeasibilityTool"

const schema = z.object({
  projectName: z
    .string()
    .min(1, "اسم المشروع مطلوب")
    .max(100, "اسم المشروع يجب ألا يتجاوز 100 حرف"),
  activityType: z.string().min(1, "نوع النشاط مطلوب"),
  projectDescription: z
    .string()
    .min(50, "وصف المشروع يجب أن يكون 50 حرف على الأقل")
    .max(500, "وصف المشروع يجب ألا يتجاوز 500 حرف"),
})

const activityOptions = [
  { value: "commercial", label: "تجاري" },
  { value: "industrial", label: "صناعي" },
  { value: "service", label: "خدمي" },
  { value: "tech", label: "تقني" },
  { value: "other", label: "آخر" },
]

interface ProjectInfoProps {
  tool: UseFeasibilityToolReturn
}

export const ProjectInfo: React.FC<ProjectInfoProps> = ({ tool }) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ProjectInfoData>({
    resolver: zodResolver(schema),
    defaultValues: tool.projectInfo,
  })

  const description = watch("projectDescription", tool.projectInfo.projectDescription)
  const charCount = description?.length || 0

  const onSubmit = (data: ProjectInfoData) => {
    tool.updateProjectInfo(data)
    tool.nextStep()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">معلومات المشروع</h2>
          <p className="text-sm text-slate-500">أدخل المعلومات الأساسية لمشروعك لنبدأ بالتحليل</p>
        </div>

        {/* اسم المشروع */}
        <Input
          id="tool-projectName"
          label="اسم المشروع"
          placeholder="مثال: متجر إلكتروني لبيع العطور"
          error={errors.projectName?.message}
          {...register("projectName")}
        />

        {/* نوع النشاط */}
        <div className="flex flex-col gap-1.5 w-full">
          <label htmlFor="tool-activityType" className="text-sm font-semibold text-slate-700">
            نوع النشاط
          </label>
          <select
            id="tool-activityType"
            className={`w-full px-4 py-2.5 border rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-1 transition-all duration-150 appearance-none ${
              errors.activityType
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
            }`}
            {...register("activityType")}
          >
            <option value="">— اختر نوع النشاط —</option>
            {activityOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {errors.activityType && (
            <span className="text-xs text-red-500 font-medium">
              {errors.activityType.message}
            </span>
          )}
        </div>

        {/* وصف المشروع */}
        <div className="flex flex-col gap-1.5 w-full">
          <label htmlFor="tool-description" className="text-sm font-semibold text-slate-700">
            وصف المشروع
          </label>
          <textarea
            id="tool-description"
            rows={5}
            placeholder="اكتب وصفاً تفصيلياً لفكرة المشروع، الجمهور المستهدف، والقيمة المقدّمة..."
            className={`w-full px-4 py-3 border rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 transition-all duration-150 resize-none ${
              errors.projectDescription
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
            }`}
            {...register("projectDescription")}
          />
          <div className="flex items-center justify-between">
            {errors.projectDescription ? (
              <span className="text-xs text-red-500 font-medium">
                {errors.projectDescription.message}
              </span>
            ) : (
              <span />
            )}
            <span
              className={`text-xs font-medium tabular-nums ${
                charCount < 50
                  ? "text-amber-500"
                  : charCount > 500
                  ? "text-red-500"
                  : "text-slate-400"
              }`}
            >
              {charCount} / 500
            </span>
          </div>
        </div>
      </div>

      <NavigationButtons
        currentStep={tool.currentStep}
        totalSteps={5}
        onNext={() => {}}
        onPrev={tool.prevStep}
        showPrev={false}
      />
    </form>
  )
}

export default ProjectInfo
