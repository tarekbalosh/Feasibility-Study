import React from "react"
import Link from "next/link"
import { PublicLayout } from "@/layouts/PublicLayout"
import { Button } from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import { BrainCircuit, DollarSign, FileDown, Layers, History, Settings2 } from "lucide-react"

export default function Features() {
  const mainFeatures = [
    {
      icon: <BrainCircuit className="w-8 h-8 text-indigo-600" />,
      title: "تحليل السوق بالذكاء الاصطناعي",
      description: "توليد نصوص متقدمة تدرس قطاع مشروعك بناءً على موقعك الجغرافي وتصيغ لك تحليل SWOT والمنافسين ونقاط القوة بدقة وعلمية عالية.",
    },
    {
      icon: <DollarSign className="w-8 h-8 text-indigo-600" />,
      title: "الحسابات المالية التلقائية",
      description: "احتساب فوري لقائمة الدخل المتوقعة، نقطة التعادل الشهرية، فترة الاسترداد، وتدفقات السيولة النقدية لـ 3 أو 5 سنوات.",
    },
    {
      icon: <FileDown className="w-8 h-8 text-indigo-600" />,
      title: "تصدير بصيغ PDF و Excel",
      description: "تحميل التقارير والتحليلات الجاهزة بصيغة PDF أنيقة مطبوعة أو تصدير الجداول الحسابية كأكواد Excel خام لمراجعتها.",
    },
  ]

  const subFeatures = [
    {
      icon: <Layers className="w-5 h-5 text-indigo-600" />,
      title: "قوالب قطاعية جاهزة",
      description: "اختر قالباً جاهزاً ومعداً مسبقاً لقطاعك كالمطاعم أو المتاجر الإلكترونية لتوفير وقت الإعداد.",
    },
    {
      icon: <History className="w-5 h-5 text-indigo-600" />,
      title: "الحفظ التلقائي والمسودات",
      description: "حفظ تلقائي لجميع التعديلات والبيانات المالية المدخلة لتتمكن من الرجوع إليها وإكمال دراستك بأي وقت.",
    },
    {
      icon: <Settings2 className="w-5 h-5 text-indigo-600" />,
      title: "اختبار السيناريوهات المختلفة",
      description: "غيّر أرقام المصاريف والإيرادات وشاهد تحديث نتائج فترة الاسترداد ونقطة التعادل فوراً أمامك.",
    },
  ]

  return (
    <PublicLayout>
      {/* Header Section */}
      <section className="bg-slate-50 border-b border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center gap-4">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">مميزات منصة Feasibility Suite</h1>
          <p className="text-lg text-slate-600 max-w-2xl leading-relaxed">
            استكشف الأدوات والحلول التقنية المبتكرة التي نوفرها لمساعدتك في بناء دراسات الجدوى بشكل ذكي ومهني وسريع.
          </p>
        </div>
      </section>

      {/* Main Features Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 flex flex-col gap-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">أدوات ذكية مصممة لنجاح فكرتك</h2>
            <p className="text-slate-600 max-w-xl mx-auto text-sm sm:text-base">
              نوفر لك الميزات الأساسية التي تحتاجها لصنع ملف دراسة متكامل يجذب المستثمرين والشركاء لتمويل فكرتك.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {mainFeatures.map((feat, i) => (
              <Card key={i} className="hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-8 flex flex-col gap-4">
                  <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center">
                    {feat.icon}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{feat.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{feat.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Alternating Highlights */}
      <section className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-20">
          {/* Highlight 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col items-start gap-4">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">الذكاء الاصطناعي المحلّي</span>
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">دراسة سوقية متكاملة بناءً على موقعك الجغرافي</h3>
              <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                يقوم المحرك الذكي بتحليل معطيات المنطقة التي تنشئ مشروعك بها، ليتعرف على متوسط القوة الشرائية ويفصل سلوك المنافسين ويوضح العقبات والفرص التي يجب عليك اغتنامها في دراسة السوق.
              </p>
            </div>
            <div className="bg-indigo-900 text-indigo-200 p-8 rounded-2xl shadow-lg relative flex flex-col gap-4">
              <span className="text-xs text-indigo-400 font-bold">التقرير المولّد</span>
              <h4 className="text-lg font-bold text-white">تحليل المنافسين المتوقعين</h4>
              <p className="text-xs leading-relaxed text-indigo-100">
                تظهر نتائج الفحص وجود متجرين منافسين في محيط 5 كيلومتر، يعتمدان على الأسعار المرتفعة، مما يتيح لمشروعك فرصة التنافس السعري الفعال في البداية...
              </p>
            </div>
          </div>

          {/* Highlight 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center lg:flex-row-reverse">
            <div className="bg-emerald-900 text-emerald-100 p-8 rounded-2xl shadow-lg flex flex-col gap-4 lg:order-last">
              <span className="text-xs text-emerald-400 font-bold">المؤشرات الرياضية</span>
              <h4 className="text-lg font-bold text-white">فترة الاسترداد ونقطة التعادل</h4>
              <p className="text-xs leading-relaxed text-emerald-100">
                نقطة التعادل الشهرية المقدرة: 12,400 ريال سعودي.
                معدل المبيعات اليومي المطلوب لتفادي الخسارة: 413 ريال.
                فترة الاسترداد المتوقعة لرأس المال: 11 شهراً.
              </p>
            </div>
            <div className="flex flex-col items-start gap-4">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">دقة متناهية</span>
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">محرك حسابات مالي لا يخطئ</h3>
              <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                تجنب التقديرات العشوائية في الإكسل. نقوم بعمل جميع الحسابات المعقدة بناءً على التكاليف المدخلة لحساب مؤشرات الأرباح ومستوى العائد وتقديم النتائج بتمثيل بياني تفاعلي سهل التصفح.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Secondary Features list */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 flex flex-col gap-3">
            <h2 className="text-2xl font-bold text-slate-900">خصائص إضافية مدمجة</h2>
            <p className="text-slate-600">تفاصيل صغيرة وضعناها لتجربة مستخدم خالية من العوائد.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {subFeatures.map((feat, i) => (
              <div key={i} className="flex gap-4 p-4 items-start text-right">
                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  {feat.icon}
                </div>
                <div className="flex flex-col gap-1">
                  <h4 className="text-base font-bold text-slate-900">{feat.title}</h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{feat.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-slate-50 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 text-center flex flex-col items-center gap-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">جرّب هذه المميزات بنفسك مجاناً</h2>
          <p className="text-slate-600 text-sm sm:text-base max-w-md">
            التسجيل يستغرق أقل من دقيقة، ولا يتطلب أي بطاقة ائتمانية للتجربة الأولى.
          </p>
          <Link href="/signup" passHref>
            <Button variant="primary" className="px-8 py-3">
              أنشئ دراستك الأولى الآن
            </Button>
          </Link>
        </div>
      </section>
    </PublicLayout>
  )
}
