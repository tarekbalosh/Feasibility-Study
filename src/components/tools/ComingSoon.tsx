import React from "react"
import Link from "next/link"
import clsx from "clsx"
import { ArrowLeft, BellRing, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { getToolPath } from "@/config/tools.registry"
import type { ToolDefinition } from "@/types/tool"

interface ComingSoonProps {
  tool: ToolDefinition
  /** أدوات جاهزة نقترحها كبديل */
  suggestions?: ToolDefinition[]
}

/** الشاشة المعروضة للأدوات التي ما زالت قيد التطوير */
export const ComingSoon: React.FC<ComingSoonProps> = ({
  tool,
  suggestions = [],
}) => {
  const Icon = tool.icon

  return (
    <div className="flex flex-col gap-8">
      <Card className="overflow-hidden">
        <div className={clsx("h-1.5 bg-gradient-to-l", tool.accent.gradient)} />
        <CardContent className="flex flex-col items-center gap-5 text-center py-14">
          <div
            className={clsx(
              "w-16 h-16 rounded-2xl flex items-center justify-center border",
              tool.accent.bg,
              tool.accent.border,
              tool.accent.text
            )}
          >
            <Icon className="w-8 h-8" />
          </div>

          <div className="flex flex-col items-center gap-3">
            <Badge variant="default">قريباً</Badge>
            <h2 className="text-2xl font-bold text-slate-900">{tool.name}</h2>
            <p className="text-slate-600 leading-relaxed max-w-2xl">
              {tool.longDescription}
            </p>
          </div>

          {tool.highlights && tool.highlights.length > 0 && (
            <ul className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 mt-2">
              {tool.highlights.map((highlight) => (
                <li
                  key={highlight}
                  className="inline-flex items-center gap-2 text-sm text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2"
                >
                  <CheckCircle2 className={clsx("w-4 h-4 shrink-0", tool.accent.text)} />
                  {highlight}
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-center gap-2 text-sm text-slate-500 mt-2">
            <BellRing className="w-4 h-4" />
            هذه الأداة قيد التطوير حالياً وستُتاح على المنصة قريباً.
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <Link href="/tools" passHref>
              <Button variant="primary" className="w-full sm:w-auto">
                استعرض الأدوات المتاحة
              </Button>
            </Link>
            <Link href="/contact" passHref>
              <Button
                variant="ghost"
                className="w-full sm:w-auto border border-slate-200 bg-white hover:bg-slate-50"
              >
                اقترح ميزة
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {suggestions.length > 0 && (
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-bold text-slate-900">
            جاهزة للاستخدام الآن
          </h3>
          <div className="flex flex-col gap-3">
            {suggestions.map((suggestion) => {
              const SuggestionIcon = suggestion.icon
              return (
                <Link
                  key={suggestion.slug}
                  href={getToolPath(suggestion.slug)}
                  className="group flex items-center gap-4 bg-white border border-slate-200 rounded-xl p-4 hover:border-indigo-200 hover:shadow-sm transition-all duration-150"
                >
                  <div
                    className={clsx(
                      "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border",
                      suggestion.accent.bg,
                      suggestion.accent.border,
                      suggestion.accent.text
                    )}
                  >
                    <SuggestionIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0 text-right">
                    <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {suggestion.name}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {suggestion.shortDescription}
                    </p>
                  </div>
                  <ArrowLeft className="w-4 h-4 text-slate-400 shrink-0 group-hover:-translate-x-1 transition-transform duration-150" />
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default ComingSoon
