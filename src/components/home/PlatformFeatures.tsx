import React from "react"
import Link from "next/link"
import { ArrowLeft, Cpu, Shield, TrendingUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/Card"

/** مميزات المنصة — نفس محاور صفحة /features مختصرةً */
const FEATURES = [
  {
    icon: Cpu,
    title: "ذكاء اصطناعي متطور",
    description:
      "يحلل فكرة مشروعك ويصوغ لك تحليلات كاملة للسوق والمنافسين ونقاط القوة والضعف (SWOT) بأسلوب مهني مقنع.",
  },
  {
    icon: TrendingUp,
    title: "حسابات مالية دقيقة",
    description:
      "حساب تلقائي للتدفق النقدي التقديري، قائمة الدخل، فترة استرداد رأس المال، ونقطة التعادل لتجنب الحسابات الخاطئة.",
  },
  {
    icon: Shield,
    title: "تقارير جاهزة للبنوك",
    description:
      "احصل على ملفات PDF احترافية ومشاريع جاهزة لتقديمها للجهات التمويلية المختلفة أو المستثمرين للبدء الفوري.",
  },
]

export const PlatformFeatures: React.FC = () => (
  <section id="features" className="py-20 bg-white scroll-mt-16">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-16 flex flex-col gap-4">
        <h2 className="text-3xl font-bold text-slate-900">
          لماذا تعتمد على Feasibility Suite؟
        </h2>
        <p className="text-slate-600">
          نحن نجمع أحدث تقنيات الذكاء الاصطناعي مع القواعد المالية والرياضية
          الصلبة لنوفر لك أدق النتائج — في كل أداة من أدوات المنصة.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {FEATURES.map((feature) => {
          const Icon = feature.icon
          return (
            <Card
              key={feature.title}
              className="hover:shadow-md transition-shadow duration-200"
            >
              <CardContent className="flex flex-col gap-4 p-6">
                <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="flex justify-center mt-12">
        <Link
          href="/features"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors duration-150"
        >
          استعرض جميع المميزات بالتفصيل
          <ArrowLeft className="w-4 h-4" />
        </Link>
      </div>
    </div>
  </section>
)

export default PlatformFeatures
