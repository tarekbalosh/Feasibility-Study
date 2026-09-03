import React from "react"
import Head from "next/head"
import { PublicLayout } from "@/layouts/PublicLayout"
import { ToolsGrid } from "@/components/tools/ToolsGrid"
import { getAllTools, getAvailableTools } from "@/config/tools.registry"

/** كتالوج الأدوات الكامل — كل ما في السجلّ، مع فلترة التصنيفات */
export default function ToolsCatalog() {
  const tools = getAllTools()
  const availableCount = getAvailableTools().length

  return (
    <PublicLayout>
      <Head>
        <title>كتالوج الأدوات | Feasibility Suite</title>
        <meta
          name="description"
          content="استعرض جميع أدوات منصة Feasibility Suite: دراسة الجدوى، تحليل SWOT، وحاسبات مالية للتسعير ونقطة التعادل والتمويل والعائد على الاستثمار."
        />
        <link rel="canonical" href="https://feasibilitysuite.com/tools" />
      </Head>

      {/* Header */}
      <section className="bg-slate-50 border-b border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center gap-4">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
            كتالوج الأدوات
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl leading-relaxed">
            {availableCount} أدوات متاحة الآن من أصل {tools.length} على خارطة
            الطريق. كل أداة مستقلة، تعمل بلا تسجيل، وتجيب عن سؤال واحد محدّد في
            تخطيط مشروعك.
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ToolsGrid tools={tools} showFilters columns={3} />
        </div>
      </section>
    </PublicLayout>
  )
}
