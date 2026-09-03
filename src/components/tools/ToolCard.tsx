import React from "react"
import Link from "next/link"
import clsx from "clsx"
import { ArrowLeft, Clock, Lock } from "lucide-react"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { TOOL_STATUS_LABELS, getToolPath } from "@/config/tools.registry"
import type { ToolDefinition } from "@/types/tool"

interface ToolCardProps {
  tool: ToolDefinition
  /** فهرس البطاقة — يُستخدم لتدرّج ظهور الحركة */
  index?: number
  /** إخفاء قائمة المخرجات (مفيد في الشبكات المضغوطة داخل لوحة التحكم) */
  compact?: boolean
}

export const ToolCard: React.FC<ToolCardProps> = ({
  tool,
  index = 0,
  compact = false,
}) => {
  const Icon = tool.icon
  const isSoon = tool.status === "soon"

  const statusBadge = isSoon ? (
    <Badge variant="default">{TOOL_STATUS_LABELS.soon}</Badge>
  ) : tool.status === "beta" ? (
    <Badge variant="warning">{TOOL_STATUS_LABELS.beta}</Badge>
  ) : (
    <Badge variant="success">{TOOL_STATUS_LABELS.live}</Badge>
  )

  return (
    <Link
      href={getToolPath(tool.slug)}
      className="group block h-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-xl"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <Card
        className={clsx(
          "h-full flex flex-col overflow-hidden card-hover-glow",
          isSoon && "opacity-90"
        )}
      >
        {/* شريط لوني علوي */}
        <div className={clsx("h-1.5 bg-gradient-to-l", tool.accent.gradient)} />

        <div className="p-6 flex flex-col gap-4 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div
              className={clsx(
                "w-12 h-12 rounded-lg flex items-center justify-center shrink-0 border",
                tool.accent.bg,
                tool.accent.border,
                tool.accent.text
              )}
            >
              <Icon className="w-6 h-6" />
            </div>
            {statusBadge}
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors duration-150">
              {tool.name}
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {tool.shortDescription}
            </p>
          </div>

          {!compact && tool.highlights && tool.highlights.length > 0 && (
            <ul className="flex flex-col gap-1.5 mt-1">
              {tool.highlights.map((highlight) => (
                <li
                  key={highlight}
                  className="flex items-center gap-2 text-xs text-slate-500"
                >
                  <span
                    className={clsx(
                      "w-1.5 h-1.5 rounded-full shrink-0",
                      tool.accent.dot
                    )}
                  />
                  {highlight}
                </li>
              ))}
            </ul>
          )}

          {/* تذييل البطاقة */}
          <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 text-xs text-slate-400">
              {tool.estimatedMinutes && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {tool.estimatedMinutes} دقائق
                </span>
              )}
              {tool.requiresAuth && (
                <span className="inline-flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" />
                  يتطلب حساباً
                </span>
              )}
            </div>
            <span
              className={clsx(
                "inline-flex items-center gap-1 text-sm font-semibold transition-transform duration-150 group-hover:-translate-x-1",
                isSoon ? "text-slate-400" : tool.accent.text
              )}
            >
              {isSoon ? "اعرف المزيد" : "ابدأ الآن"}
              <ArrowLeft className="w-4 h-4" />
            </span>
          </div>
        </div>
      </Card>
    </Link>
  )
}

export default ToolCard
