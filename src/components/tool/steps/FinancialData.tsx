import React, { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { TrendingUp, TrendingDown, Clock, DollarSign } from "lucide-react"
import { NavigationButtons } from "@/components/tool/NavigationButtons"
import type { FinancialData as FinancialDataType, UseFeasibilityToolReturn } from "@/hooks/useFeasibilityTool"

const schema = z.object({
  initialCapital: z
    .number({ invalid_type_error: "الرجاء إدخال رقم صحيح" })
    .min(1000, "رأس المال يجب أن يكون 1,000 ريال على الأقل"),
  monthlyOperatingCosts: z
    .number({ invalid_type_error: "الرجاء إدخال رقم صحيح" })
    .min(0, "التكاليف لا يمكن أن تكون سالبة"),
  expectedMonthlyRevenue: z
    .number({ invalid_type_error: "الرجاء إدخال رقم صحيح" })
    .min(0, "الإيرادات لا يمكن أن تكون سالبة"),
})

interface FinancialDataProps {
  tool: UseFeasibilityToolReturn
}

function formatNumber(num: number): string {
  return num.toLocaleString("ar-SA")
}

export const FinancialDataStep: React.FC<FinancialDataProps> = ({ tool }) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FinancialDataType>({
    resolver: zodResolver(schema),
    defaultValues: {
      initialCapital: tool.financialData.initialCapital || undefined,
      monthlyOperatingCosts: tool.financialData.monthlyOperatingCosts || undefined,
      expectedMonthlyRevenue: tool.financialData.expectedMonthlyRevenue || undefined,
    },
  })

  const values = watch()
  const revenue = values.expectedMonthlyRevenue || 0
  const costs = values.monthlyOperatingCosts || 0
  const capital = values.initialCapital || 0
  const monthlyProfit = revenue - costs
  const paybackPeriod = monthlyProfit > 0 ? capital / monthlyProfit : 0
  const isProfit = monthlyProfit > 0

  const onSubmit = (data: FinancialDataType) => {
    tool.updateFinancialData(data)
    tool.nextStep()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">البيانات المالية</h2>
          <p className="text-sm text-slate-500">أدخل التقديرات المالية الأساسية لمشروعك</p>
        </div>

        {/* رأس المال المبدئي */}
        <div className="flex flex-col gap-1.5 w-full">
          <label htmlFor="tool-capital" className="text-sm font-semibold text-slate-700">
            رأس المال المبدئي (ريال)
          </label>
          <div className="relative rounded-lg shadow-sm">
            <input
              id="tool-capital"
              type="number"
              placeholder="مثال: 100000"
              dir="ltr"
              className={`w-full px-4 py-2.5 border rounded-lg text-slate-900 text-left placeholder-slate-400 focus:outline-none focus:ring-1 transition-all duration-150 ${
                errors.initialCapital
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
              }`}
              {...register("initialCapital", { valueAsNumber: true })}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
              SAR
            </span>
          </div>
          {errors.initialCapital && (
            <span className="text-xs text-red-500 font-medium">
              {errors.initialCapital.message}
            </span>
          )}
        </div>

        {/* التكاليف التشغيلية الشهرية */}
        <div className="flex flex-col gap-1.5 w-full">
          <label htmlFor="tool-costs" className="text-sm font-semibold text-slate-700">
            التكاليف التشغيلية الشهرية (ريال)
          </label>
          <div className="relative rounded-lg shadow-sm">
            <input
              id="tool-costs"
              type="number"
              placeholder="مثال: 15000"
              dir="ltr"
              className={`w-full px-4 py-2.5 border rounded-lg text-slate-900 text-left placeholder-slate-400 focus:outline-none focus:ring-1 transition-all duration-150 ${
                errors.monthlyOperatingCosts
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
              }`}
              {...register("monthlyOperatingCosts", { valueAsNumber: true })}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
              SAR / شهر
            </span>
          </div>
          {errors.monthlyOperatingCosts && (
            <span className="text-xs text-red-500 font-medium">
              {errors.monthlyOperatingCosts.message}
            </span>
          )}
        </div>

        {/* الإيرادات المتوقعة الشهرية */}
        <div className="flex flex-col gap-1.5 w-full">
          <label htmlFor="tool-revenue" className="text-sm font-semibold text-slate-700">
            الإيرادات المتوقعة الشهرية (ريال)
          </label>
          <div className="relative rounded-lg shadow-sm">
            <input
              id="tool-revenue"
              type="number"
              placeholder="مثال: 30000"
              dir="ltr"
              className={`w-full px-4 py-2.5 border rounded-lg text-slate-900 text-left placeholder-slate-400 focus:outline-none focus:ring-1 transition-all duration-150 ${
                errors.expectedMonthlyRevenue
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
              }`}
              {...register("expectedMonthlyRevenue", { valueAsNumber: true })}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
              SAR / شهر
            </span>
          </div>
          {errors.expectedMonthlyRevenue && (
            <span className="text-xs text-red-500 font-medium">
              {errors.expectedMonthlyRevenue.message}
            </span>
          )}
        </div>
      </div>

      {/* ملخص حسابي آني */}
      {(revenue > 0 || costs > 0) && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-4">📊 ملخص حسابي تقديري</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* صافي الربح الشهري */}
            <div
              className={`p-4 rounded-xl border ${
                isProfit
                  ? "bg-emerald-50/60 border-emerald-100"
                  : "bg-red-50/60 border-red-100"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {isProfit ? (
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
                <span className="text-xs text-slate-500 font-medium">صافي الربح الشهري</span>
              </div>
              <p
                className={`text-xl font-bold tabular-nums ${
                  isProfit ? "text-emerald-700" : "text-red-600"
                }`}
              >
                {formatNumber(monthlyProfit)} <span className="text-xs font-normal">ريال</span>
              </p>
            </div>

            {/* صافي الربح السنوي */}
            <div
              className={`p-4 rounded-xl border ${
                isProfit
                  ? "bg-emerald-50/60 border-emerald-100"
                  : "bg-red-50/60 border-red-100"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-slate-500" />
                <span className="text-xs text-slate-500 font-medium">صافي الربح السنوي</span>
              </div>
              <p
                className={`text-xl font-bold tabular-nums ${
                  isProfit ? "text-emerald-700" : "text-red-600"
                }`}
              >
                {formatNumber(monthlyProfit * 12)} <span className="text-xs font-normal">ريال</span>
              </p>
            </div>

            {/* فترة الاسترداد */}
            <div className="p-4 rounded-xl border bg-slate-50/50 border-slate-100 sm:col-span-2">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-indigo-500" />
                <span className="text-xs text-slate-500 font-medium">فترة استرداد رأس المال التقريبية</span>
              </div>
              <p className="text-xl font-bold text-indigo-700 tabular-nums">
                {paybackPeriod > 0 ? (
                  <>
                    {Math.round(paybackPeriod * 10) / 10}{" "}
                    <span className="text-xs font-normal text-slate-500">شهر</span>
                    {paybackPeriod > 12 && (
                      <span className="text-xs font-normal text-slate-400 mr-2">
                        ({(paybackPeriod / 12).toFixed(1)} سنة)
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-sm text-slate-400 font-normal">
                    غير محسوبة (الإيرادات أقل من التكاليف)
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      <NavigationButtons
        currentStep={tool.currentStep}
        totalSteps={5}
        onNext={() => {}}
        onPrev={tool.prevStep}
      />
    </form>
  )
}

export default FinancialDataStep
