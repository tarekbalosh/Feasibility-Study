import React from "react"
import Head from "next/head"
import Link from "next/link"
import { Check, Crown, Building2, Sparkles, MessageCircle } from "lucide-react"
import { PublicLayout } from "@/layouts/PublicLayout"
import { Button } from "@/components/ui/Button"
import { PLAN_LABELS, type PlanId } from "@/config/plans"
import { usePlanAccess } from "@/hooks/usePlanAccess"

/**
 * صفحة الخطط والأسعار — وجهة كل أزرار الترقية في المنصة (UPGRADE_PATH).
 * الأسعار لم تُعلن بعد، فالبطاقات تعرض ما تفتحه كل خطة دون رقم،
 * وزرّ التواصل هو المسار الحالي للاشتراك.
 */

interface PlanCard {
  id: PlanId
  tagline: string
  icon: typeof Sparkles
  features: string[]
  cta: { label: string; href: string }
  featured?: boolean
}

const PLANS: PlanCard[] = [
  {
    id: "free",
    tagline: "لتجربة الأدوات وبناء أول تحليل لمشروعك.",
    icon: Sparkles,
    features: [
      "أداة تحليل SWOT كاملة — بلا حد على عدد التحاليل",
      "اختيار البنود وإضافة بنودك الخاصة وتعديلها",
      "توليد التحليل والاستراتيجيات بالذكاء الاصطناعي",
      "طباعة التقرير أو تصديره PDF",
    ],
    cta: { label: "ابدأ مجاناً", href: "/tools" },
  },
  {
    id: "pro",
    tagline: "لرائد الأعمال الذي يبني دراسة يقدّمها لممول أو شريك.",
    icon: Crown,
    features: [
      "كل ما في الخطة المجانية",
      "القوائم التفصيلية لأرباع SWOT — تصنيف معمّق بأمثلة جاهزة",
      "أولوية في الوصول إلى الأدوات الجديدة",
      "حفظ التقارير في لوحة التحكم والرجوع إليها",
      "دعم عبر البريد خلال يوم عمل",
    ],
    cta: { label: "تواصل للاشتراك", href: "/contact" },
    featured: true,
  },
  {
    id: "enterprise",
    tagline: "للفرق والجهات التي تعدّ دراسات متعددة بشكل متكرّر.",
    icon: Building2,
    features: [
      "كل ما في الخطة الاحترافية",
      "حسابات متعددة للفريق",
      "قوالب ومخرجات بهوية جهتك",
      "دعم مخصّص وتدريب على الأدوات",
    ],
    cta: { label: "تحدّث إلينا", href: "/contact" },
  },
]

export default function Pricing() {
  const { plan: currentPlan, isGuest } = usePlanAccess()

  return (
    <PublicLayout>
      <Head>
        <title>الخطط والأسعار | Feasibility Suite</title>
        <meta
          name="description"
          content="خطط منصة Feasibility Suite — ابدأ مجاناً، وارتقِ إلى الخطة الاحترافية لفتح القوائم التفصيلية وبقية الميزات المدفوعة."
        />
      </Head>

      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* الترويسة */}
          <div className="text-center flex flex-col items-center gap-4 mb-12">
            <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-100 text-amber-700 px-3 py-1 text-xs font-bold">
              <Crown className="w-3.5 h-3.5" />
              الخطط والأسعار
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
              ابدأ مجاناً، وارتقِ حين تحتاج العمق
            </h1>
            <p className="text-slate-500 max-w-2xl leading-relaxed">
              الأدوات الأساسية مفتوحة للجميع بلا بطاقة دفع. الخطط المدفوعة تفتح
              الطبقات الأعمق — كالقوائم التفصيلية لأرباع SWOT — لمن يبني دراسة
              يقدّمها لممول أو شريك.
            </p>
          </div>

          {/* البطاقات */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
            {PLANS.map((planCard) => {
              const Icon = planCard.icon
              const isCurrent = !isGuest && currentPlan === planCard.id

              return (
                <div
                  key={planCard.id}
                  className={
                    planCard.featured
                      ? "relative flex flex-col gap-5 rounded-2xl border-2 border-amber-300 bg-white p-6 shadow-lg md:-mt-3"
                      : "relative flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6"
                  }
                >
                  {planCard.featured && (
                    <span className="absolute -top-3 right-6 rounded-full bg-amber-500 px-3 py-1 text-[11px] font-black text-white shadow-sm">
                      الأكثر ملاءمة
                    </span>
                  )}

                  <div className="flex items-center gap-3">
                    <span
                      className={
                        planCard.featured
                          ? "w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center"
                          : "w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 text-slate-500 flex items-center justify-center"
                      }
                    >
                      <Icon className="w-5 h-5" />
                    </span>
                    <div className="flex flex-col">
                      <h2 className="text-lg font-bold text-slate-900">
                        الخطة {PLAN_LABELS[planCard.id]}
                      </h2>
                      {isCurrent && (
                        <span className="text-[11px] font-semibold text-emerald-600">
                          خطتك الحالية
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-slate-500 leading-relaxed">
                    {planCard.tagline}
                  </p>

                  <div className="border-t border-slate-100 pt-4">
                    <p className="text-2xl font-bold text-slate-900">
                      {planCard.id === "free" ? "مجاناً" : "السعر قريباً"}
                    </p>
                    {planCard.id !== "free" && (
                      <p className="text-[11px] text-slate-400 mt-1">
                        نُعلن الأسعار قبل تفعيلها — تواصل معنا للحجز المبكر.
                      </p>
                    )}
                  </div>

                  <ul className="flex flex-col gap-2.5 flex-1">
                    {planCard.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-[13px] text-slate-600 leading-relaxed"
                      >
                        <Check
                          className={
                            planCard.featured
                              ? "w-4 h-4 shrink-0 mt-0.5 text-amber-500"
                              : "w-4 h-4 shrink-0 mt-0.5 text-emerald-500"
                          }
                          strokeWidth={3}
                        />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link href={planCard.cta.href} passHref className="w-full">
                    <Button
                      type="button"
                      variant={planCard.featured ? "primary" : "ghost"}
                      className={
                        planCard.featured
                          ? "w-full py-2.5 text-sm font-bold bg-amber-500 hover:bg-amber-600 focus:ring-amber-400"
                          : "w-full py-2.5 text-sm font-semibold border border-slate-200 bg-white hover:bg-slate-50"
                      }
                    >
                      {planCard.cta.label}
                    </Button>
                  </Link>
                </div>
              )
            })}
          </div>

          {/* سطر تواصل */}
          <div className="mt-12 max-w-3xl mx-auto rounded-2xl border border-slate-200 bg-slate-50 px-6 py-5 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-right">
            <span className="w-11 h-11 shrink-0 rounded-xl bg-white border border-slate-200 text-sky-600 flex items-center justify-center">
              <MessageCircle className="w-5 h-5" />
            </span>
            <p className="flex-1 text-sm text-slate-600 leading-relaxed">
              غير متأكد من الخطة المناسبة؟ صِف لنا مشروعك وسنقترح عليك الأنسب —
              دون التزام.
            </p>
            <Link href="/contact" passHref>
              <Button
                type="button"
                variant="ghost"
                className="shrink-0 border border-slate-200 bg-white hover:bg-white px-5 py-2.5 text-sm font-semibold"
              >
                تواصل معنا
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
