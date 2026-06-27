import React, { useState } from "react"
import Link from "next/link"
import { PublicLayout } from "@/layouts/PublicLayout"
import { Button } from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Check } from "lucide-react"

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false)

  const plans = [
    {
      name: "الباقة التجريبية",
      priceMonthly: 0,
      priceAnnual: 0,
      description: "للمبتدئين لاستكشاف مميزات المنصة وتجربة المعالج المالي.",
      features: [
        "توليد دراسة جدوى واحدة فقط",
        "تحليل مالي أساسي (نقطة التعادل وفترة الاسترداد)",
        "معاينة التقرير على الويب للقراءة فقط",
        "دعم فني عادي عبر البريد",
      ],
      ctaText: "ابدأ مجاناً",
      ctaLink: "/signup",
      popular: false,
    },
    {
      name: "الباقة الاحترافية",
      priceMonthly: 149,
      priceAnnual: 119,
      description: "الباقة المثالية لرواد الأعمال وأصحاب المشاريع الصغيرة لبناء خطة متكاملة.",
      features: [
        "توليد دراسات جدوى غير محدودة",
        "تحليل SWOT ومنافسين كامل بالذكاء الاصطناعي",
        "حساب التدفق النقدية والمؤشرات لـ 3 سنوات",
        "تصدير التقارير بصيغة PDF و Word (DOCX)",
        "تفعيل روابط مشاركة عامة للقراءة فقط",
        "دعم فني ذو أولوية",
      ],
      ctaText: "اشترك الآن",
      ctaLink: "/signup?plan=standard",
      popular: true,
    },
    {
      name: "باقة المستشارين",
      priceMonthly: 499,
      priceAnnual: 399,
      description: "مخصصة للمكاتب الاستشارية والمحاسبين المستقلين الذين يخدمون عملاء متعددين.",
      features: [
        "توليد دراسات غير محدودة وحفظ غير محدود",
        "حساب التنبؤات والتحليلات لـ 5 سنوات كاملة",
        "إزالة شعار المنصة من التقارير المصدرة (White-label)",
        "تصدير الجداول المالية لملفات Excel (XLSX) عارية",
        "مدير حساب مخصص ودعم فني هاتفي مباشر",
      ],
      ctaText: "تواصل معنا",
      ctaLink: "/contact",
      popular: false,
    },
  ]

  return (
    <PublicLayout>
      {/* Header Section */}
      <section className="bg-slate-50 border-b border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center gap-6">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">خطط الأسعار والاشتراكات</h1>
          <p className="text-lg text-slate-600 max-w-2xl leading-relaxed">
            اختر الباقة المناسبة لاحتياجاتك وابدأ في صياغة دراسة الجدوى الاحترافية لمشروعك اليوم.
          </p>

          {/* Toggle Switch */}
          <div className="flex items-center gap-4 bg-white border border-slate-200 rounded-full p-1 shadow-sm mt-4">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-150 ${
                !isAnnual ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              دفع شهري
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-150 flex items-center gap-1.5 ${
                isAnnual ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              دفع سنوي
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                وفر 20%
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Plan Cards Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {plans.map((plan, i) => {
              const price = isAnnual ? plan.priceAnnual : plan.priceMonthly
              return (
                <Card
                  key={i}
                  className={`flex flex-col relative h-full transition-all duration-200 ${
                    plan.popular
                      ? "border-2 border-indigo-600 shadow-md ring-4 ring-indigo-50 lg:scale-[1.03]"
                      : "border border-slate-200 hover:shadow-md"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2">
                      <Badge variant="success" className="px-3 py-1 font-bold text-xs uppercase tracking-wider">
                        الأكثر شعبية
                      </Badge>
                    </div>
                  )}

                  <CardContent className="p-8 flex flex-col flex-grow gap-6">
                    {/* Header */}
                    <div className="flex flex-col gap-2">
                      <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                      <p className="text-xs text-slate-500 leading-relaxed min-h-[40px]">{plan.description}</p>
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline gap-1 py-4 border-y border-slate-100">
                      <span className="text-4xl font-black text-slate-900 font-mono">
                        {price}
                      </span>
                      <span className="text-sm font-semibold text-slate-500">ريال سعودي</span>
                      {price > 0 && (
                        <span className="text-xs text-slate-400 font-medium mr-1">/ شهرياً</span>
                      )}
                    </div>

                    {/* Features list */}
                    <ul className="flex flex-col gap-3 flex-grow text-slate-600 text-sm">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex gap-2.5 items-start text-right">
                          <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    <Link href={plan.ctaLink} passHref className="mt-4">
                      <Button
                        variant={plan.popular ? "primary" : "ghost"}
                        className={`w-full py-3 font-bold ${
                          !plan.popular ? "border border-slate-200 bg-white hover:bg-slate-50 text-slate-700" : ""
                        }`}
                      >
                        {plan.ctaText}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Trust & Guarantee Section */}
      <section className="py-16 bg-slate-50 border-t border-slate-200 text-center">
        <div className="max-w-xl mx-auto px-4 flex flex-col items-center gap-4">
          <h3 className="text-lg font-bold text-slate-900">ضمان استرجاع الأموال بنسبة 100%</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            إذا لم تعجبك مخرجات التحليل المالي والتقارير المكتوبة بالذكاء الاصطناعي، تواصل معنا خلال 7 أيام من الدفع وسنعيد لك كامل المبلغ المدفوع بدون شروط.
          </p>
        </div>
      </section>
    </PublicLayout>
  )
}
