import React from "react"
import Head from "next/head"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { PublicLayout } from "@/layouts/PublicLayout"
import { Button } from "@/components/ui/Button"
import { ToolsGrid } from "@/components/tools/ToolsGrid"
import { PlatformHero } from "@/components/home/PlatformHero"
import { PlatformFeatures } from "@/components/home/PlatformFeatures"
import { AboutSection } from "@/components/home/AboutSection"
import { ContactSection } from "@/components/home/ContactSection"
import { getFeaturedTools, getToolStartPath } from "@/config/tools.registry"

/**
 * الصفحة الرئيسية للمنصة.
 * شبكة البطاقات تُقرأ من سجلّ الأدوات (src/config/tools.registry.ts)
 * فإضافة أداة جديدة إلى الصفحة لا تتطلب أي تعديل هنا.
 */
export default function Home() {
  const featuredTools = getFeaturedTools()

  return (
    <PublicLayout>
      <Head>
        <title>Feasibility Suite | منصة أدوات تخطيط المشاريع الذكية</title>
        <meta
          name="description"
          content="منصة أدوات رقمية لرواد الأعمال: دراسة جدوى احترافية، تحليل SWOT استراتيجي، وحاسبات مالية — كلها بالذكاء الاصطناعي وخلال دقائق."
        />
        <link rel="canonical" href="https://feasibilitysuite.com/" />
      </Head>

      <PlatformHero />

      {/* شبكة الأدوات */}
      <section
        id="tools"
        className="py-20 bg-slate-50 border-y border-slate-200 scroll-mt-16"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14 flex flex-col gap-4">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              أدوات المنصة
            </span>
            <h2 className="text-3xl font-bold text-slate-900">
              اختر الأداة التي تحتاجها الآن
            </h2>
            <p className="text-slate-600">
              كل أداة مستقلة بذاتها وتعمل بلا تسجيل — ابدأ بالتي تجيب عن سؤالك
              الحالي، وانتقل لغيرها متى احتجت.
            </p>
          </div>

          <ToolsGrid tools={featuredTools} columns={3} />

          <div className="flex justify-center mt-12">
            <Link href="/tools" passHref>
              <Button
                variant="ghost"
                className="border border-slate-200 bg-white hover:bg-slate-50 px-6 py-2.5 gap-1.5"
              >
                استعرض كتالوج الأدوات كاملاً
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <PlatformFeatures />
      <AboutSection />
      <ContactSection />

      {/* CTA */}
      <section className="py-20 bg-indigo-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-800 via-indigo-950 to-slate-950 opacity-90" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 flex flex-col items-center gap-6">
          <h2 className="text-3xl sm:text-4xl font-bold">
            جاهز لإطلاق فكرة مشروعك القادم؟
          </h2>
          <p className="text-indigo-200 max-w-xl text-base leading-relaxed">
            ابدأ بأي أداة من أدوات المنصة مجاناً وبلا تسجيل، واحصل على أول
            مخرجاتك خلال دقائق معدودة.
          </p>
          <Link href={getToolStartPath("feasibility-study")} passHref>
            <Button
              variant="secondary"
              className="px-8 py-3 text-base font-bold shadow-lg shadow-emerald-950/20"
            >
              ابدأ الآن مجاناً
            </Button>
          </Link>
        </div>
      </section>
    </PublicLayout>
  )
}
