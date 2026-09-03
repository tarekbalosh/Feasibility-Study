import React from "react"
import Link from "next/link"
import clsx from "clsx"
import { ArrowLeft, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { getAllTools, getAvailableTools } from "@/config/tools.registry"

/** إحصاءات المنصة — تُحتسب من سجلّ الأدوات فلا تحتاج تحديثاً يدوياً */
const useToolStats = () => {
  const all = getAllTools()
  return {
    available: getAvailableTools().length,
    total: all.length,
  }
}

export const PlatformHero: React.FC = () => {
  const { available, total } = useToolStats()
  const previewTools = getAllTools().slice(0, 4)

  return (
    <section className="relative overflow-hidden pt-28 pb-20 lg:pt-36 lg:pb-28 bg-gradient-to-b from-indigo-50/50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* المحتوى النصي */}
          <div className="flex flex-col items-start gap-7 text-right">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              <Sparkles className="w-3.5 h-3.5" />
              منصة أدوات رقمية لرواد الأعمال
            </span>

            <h1 className="text-3xl/[1.8] sm:text-4xl/[1.8] lg:text-5xl/[1.8] font-black text-slate-900 tracking-tight py-1">
              كل ما تحتاجه لتخطيط مشروعك، في{" "}
              <span className="text-indigo-600">منصة واحدة</span>.
            </h1>

            <p className="text-lg text-slate-600 leading-relaxed max-w-xl">
              دراسة جدوى، تحليل استراتيجي، وحاسبات مالية — مجموعة أدوات ذكية تحوّل
              فكرة مشروعك إلى أرقام وقرارات واضحة خلال دقائق، بلا جداول معقّدة ولا
              مكاتب استشارية.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link href="#tools" passHref>
                <Button
                  variant="primary"
                  className="w-full sm:w-auto text-base px-8 py-3 gap-2"
                >
                  استعرض الأدوات
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/features" passHref>
                <Button
                  variant="ghost"
                  className="w-full sm:w-auto text-base border border-slate-200 bg-white hover:bg-slate-50 px-8 py-3"
                >
                  اكتشف الميزات
                </Button>
              </Link>
            </div>

            <div className="flex items-center gap-6 pt-2 text-sm">
              <span className="flex flex-col">
                <span className="text-2xl font-black text-slate-900 tabular-nums">
                  {available}
                </span>
                <span className="text-slate-500">أدوات متاحة الآن</span>
              </span>
              <span className="w-px h-10 bg-slate-200" />
              <span className="flex flex-col">
                <span className="text-2xl font-black text-slate-900 tabular-nums">
                  {total}
                </span>
                <span className="text-slate-500">أداة على خارطة الطريق</span>
              </span>
              <span className="w-px h-10 bg-slate-200" />
              <span className="flex flex-col">
                <span className="text-2xl font-black text-emerald-600">مجاناً</span>
                <span className="text-slate-500">بلا بطاقة دفع</span>
              </span>
            </div>
          </div>

          {/* لوحة بصرية — لمحة من كتالوج الأدوات */}
          <div className="relative flex justify-center">
            <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-100/50 p-6 flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-400" />
                  <span className="w-3 h-3 rounded-full bg-yellow-400" />
                  <span className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <span className="text-xs font-semibold text-slate-400">
                  كتالوج أدوات المنصة
                </span>
              </div>

              <div className="flex flex-col gap-3">
                {previewTools.map((tool) => {
                  const Icon = tool.icon
                  const isSoon = tool.status === "soon"
                  return (
                    <div
                      key={tool.slug}
                      className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/60"
                    >
                      <span
                        className={clsx(
                          "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border",
                          tool.accent.bg,
                          tool.accent.border,
                          tool.accent.text
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-bold text-slate-900 truncate">
                          {tool.name}
                        </span>
                        <span className="block text-xs text-slate-500 truncate">
                          {tool.shortDescription}
                        </span>
                      </span>
                      <span
                        className={clsx(
                          "text-[10px] font-bold rounded-full px-2 py-0.5 shrink-0",
                          isSoon
                            ? "bg-slate-200 text-slate-600"
                            : "bg-emerald-100 text-emerald-700"
                        )}
                      >
                        {isSoon ? "قريباً" : "متاحة"}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default PlatformHero
