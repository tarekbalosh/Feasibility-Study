import React from "react"
import Head from "next/head"
import { Sparkles } from "lucide-react"
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
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50 via-white to-white border-b border-slate-200 py-20 sm:py-24">
        {/* توهّج زخرفي خفيف — بنفس لغة الفوتر */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -right-20 h-72 w-72 rounded-full bg-indigo-400/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-28 -left-16 h-64 w-64 rounded-full bg-violet-400/15 blur-3xl"
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center gap-5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-indigo-100 shadow-sm px-4 py-1.5 text-xs font-semibold text-indigo-600">
            <Sparkles className="w-3.5 h-3.5" />
            مساحة عمل واحدة، كل أدوات التخطيط
          </span>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            كتالوج الأدوات
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl leading-relaxed">
            كل أداة مستقلة داخل مساحة عملك، وتجيب عن سؤال واحد محدّد في تخطيط
            مشروعك — من دراسة الجدوى الكاملة إلى حاسبات التسعير ونقطة التعادل.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-1">
            <div className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 shadow-sm px-4 py-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-sm font-bold text-slate-900">{availableCount}</span>
              <span className="text-sm text-slate-500">أدوات متاحة الآن</span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 shadow-sm px-4 py-2">
              <span className="w-2 h-2 rounded-full bg-slate-300" />
              <span className="text-sm font-bold text-slate-900">{tools.length}</span>
              <span className="text-sm text-slate-500">على خارطة الطريق</span>
            </div>
          </div>
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
