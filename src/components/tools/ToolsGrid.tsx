import React, { useMemo, useState } from "react"
import clsx from "clsx"
import { SearchX } from "lucide-react"
import { ToolCard } from "@/components/tools/ToolCard"
import { TOOL_CATEGORIES, getAllTools } from "@/config/tools.registry"
import type { ToolCategory, ToolDefinition } from "@/types/tool"

interface ToolsGridProps {
  /** قائمة أدوات مخصّصة — الافتراضي هو كل أدوات السجلّ */
  tools?: ToolDefinition[]
  /** إظهار أزرار فلترة التصنيفات */
  showFilters?: boolean
  /** بطاقات مضغوطة بدون قائمة المخرجات */
  compact?: boolean
  /** عدد الأعمدة على الشاشات الكبيرة */
  columns?: 2 | 3
  className?: string
}

export const ToolsGrid: React.FC<ToolsGridProps> = ({
  tools,
  showFilters = false,
  compact = false,
  columns = 3,
  className = "",
}) => {
  const [activeCategory, setActiveCategory] = useState<ToolCategory | "all">("all")
  const source = useMemo(() => tools ?? getAllTools(), [tools])

  const visibleTools = useMemo(
    () =>
      activeCategory === "all"
        ? source
        : source.filter((tool) => tool.category === activeCategory),
    [source, activeCategory]
  )

  // لا نعرض زر تصنيف لا يملك أي أداة
  const availableCategories = useMemo(
    () =>
      TOOL_CATEGORIES.filter(
        (category) =>
          category.key === "all" ||
          source.some((tool) => tool.category === category.key)
      ),
    [source]
  )

  return (
    <div className={clsx("flex flex-col gap-8", className)}>
      {showFilters && availableCategories.length > 2 && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {availableCategories.map((category) => {
            const isActive = activeCategory === category.key
            return (
              <button
                key={category.key}
                type="button"
                onClick={() => setActiveCategory(category.key)}
                className={clsx(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 border",
                  isActive
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                {category.label}
              </button>
            )
          })}
        </div>
      )}

      {visibleTools.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <SearchX className="w-10 h-10 text-slate-300" />
          <p className="text-sm text-slate-500 font-medium">
            لا توجد أدوات في هذا التصنيف حالياً.
          </p>
        </div>
      ) : (
        <div
          className={clsx(
            "dashboard-grid grid grid-cols-1 gap-6",
            columns === 3
              ? "sm:grid-cols-2 lg:grid-cols-3"
              : "sm:grid-cols-2"
          )}
        >
          {visibleTools.map((tool, index) => (
            <ToolCard
              key={tool.slug}
              tool={tool}
              index={index}
              compact={compact}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default ToolsGrid
