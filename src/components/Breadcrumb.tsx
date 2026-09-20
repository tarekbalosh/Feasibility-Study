/**
 * ─────────────────────────────────────────────────────────────
 *  Breadcrumb.tsx
 *  مكوّن مسار التنقل الديناميكي لمنصة Feasibility Suite
 * ─────────────────────────────────────────────────────────────
 *
 *  الاستخدام:
 *
 *    // بدون تخصيص (يعمل تلقائياً من الـ URL)
 *    <Breadcrumb />
 *
 *    // مع overrides لاستبدال IDs بأسماء حقيقية
 *    <Breadcrumb overrides={{ "abc123": "مشروع المطعم" }} />
 *
 *  كيف يعمل:
 *    1. يقرأ pathname من useRouter()
 *    2. يتحقق من القائمة المستثناة (EXCLUDED_PATHS / EXCLUDED_PREFIXES)
 *    3. يقسّم الـ pathname إلى segments
 *    4. يبني label لكل segment من SEGMENT_LABELS أو getToolBySlug()
 *       أو overrides المُمرَّرة
 *    5. يُرجع null للصفحات المستثناة
 *
 * ─────────────────────────────────────────────────────────────
 */

import React, { useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/router"
import { Home, ChevronLeft } from "lucide-react"
import {
  SEGMENT_LABELS,
  EXCLUDED_PATHS,
  EXCLUDED_PREFIXES,
  EXCLUDED_LAST_SEGMENTS,
} from "@/config/breadcrumb.config"
import { getToolBySlug } from "@/config/tools.registry"
import type { BreadcrumbItem } from "@/config/breadcrumb.config"

// ─── Types ──────────────────────────────────────────────────

interface BreadcrumbProps {
  /**
   * استبدال ديناميكي: يُمرَّر عندما يحتوي المسار على IDs
   * لا تريد عرضها للمستخدم.
   *
   * مثال:
   * overrides={{ "8f93ab12": "مشروع المطعم" }}
   *
   * سيستبدل أي segment يطابق المفتاح بالقيمة المقابلة.
   */
  overrides?: Record<string, string>
  /** className إضافية لتخصيص المكوّن من الخارج */
  className?: string
}

// ─── Helper: بناء مسار التنقل من pathname ────────────────────

function buildBreadcrumbs(
  pathname: string,
  query: Record<string, string | string[] | undefined>,
  overrides: Record<string, string>
): BreadcrumbItem[] | null {
  // ── 1. هل الصفحة مستثناة كلياً؟ ──────────────────────────
  if (EXCLUDED_PATHS.has(pathname)) return null

  for (const prefix of EXCLUDED_PREFIXES) {
    if (pathname.startsWith(prefix)) return null
  }

  // ── 2. نقسّم الـ pathname إلى segments ─────────────────────
  // /dashboard/Projects → ["dashboard", "Projects"]
  const rawSegments = pathname.split("/").filter(Boolean)

  if (rawSegments.length === 0) return null

  // ── 3. هل آخر segment مستثنى؟ (مثل "start") ────────────────
  const lastSegment = rawSegments[rawSegments.length - 1]
  if (EXCLUDED_LAST_SEGMENTS.has(lastSegment)) return null

  // ── 4. نبني مسار التنقل ─────────────────────────────────────
  const items: BreadcrumbItem[] = []

  // الصفحة الرئيسية دائماً أول عنصر
  items.push({ label: "الرئيسية", href: "/" })

  let accumulatedPath = ""

  for (let i = 0; i < rawSegments.length; i++) {
    const segment = rawSegments[i]
    accumulatedPath += `/${segment}`
    const isLast = i === rawSegments.length - 1

    // ── a. هل هو dynamic segment مثل [slug] أو [id]؟ ──────────
    // Next.js يضع Next router params في query
    // نتعرف على dynamic segments بأنهم يطابقون قيمة ما في query
    const isDynamic = Object.values(query).some((val) =>
      Array.isArray(val) ? val.includes(segment) : val === segment
    )

    if (isDynamic) {
      // ── b. هل هو override (ID للمشروع مثلاً)؟ ───────────────
      if (overrides[segment]) {
        items.push({
          label: overrides[segment],
          href: isLast ? undefined : accumulatedPath,
        })
        continue
      }

      // ── c. هل هو slug أداة؟ ──────────────────────────────────
      const tool = getToolBySlug(segment)
      if (tool) {
        items.push({
          label: tool.name,
          href: isLast ? undefined : accumulatedPath,
        })
        continue
      }

      // ── d. لا نعرف هذا الـ dynamic segment — نتجاهله ────────
      // (لا نعرض IDs خاماً للمستخدم)
      continue
    }

    // ── e. static segment — نجد الاسم من SEGMENT_LABELS ────────
    const config = SEGMENT_LABELS[segment]

    if (config) {
      items.push({
        label: config.label,
        href: isLast ? undefined : config.href,
      })
    } else {
      // segment غير معرّف في الـ config — نعرضه كما هو (fallback)
      items.push({
        label: segment,
        href: isLast ? undefined : accumulatedPath,
      })
    }
  }

  // إذا كان المسار مستوى واحد فقط (الرئيسية) لا نعرض Breadcrumb
  if (items.length <= 1) return null

  return items
}

// ─── Separator ───────────────────────────────────────────────

const Separator: React.FC = () => (
  <ChevronLeft
    size={14}
    className="text-gray-300 shrink-0 mx-0.5"
    aria-hidden="true"
  />
)

// ─── Main Component ──────────────────────────────────────────

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  overrides = {},
  className = "",
}) => {
  const router = useRouter()

  const items = useMemo(
    () =>
      buildBreadcrumbs(
        router.pathname,
        router.query as Record<string, string | string[] | undefined>,
        overrides
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router.pathname, router.query]
  )

  // لا نعرض شيئاً في الصفحات المستثناة
  if (!items || items.length === 0) return null

  return (
    <nav
      aria-label="مسار التنقل"
      dir="rtl"
      className={`flex items-center flex-wrap gap-0.5 mb-3 ${className}`}
    >
      <ol className="flex items-center flex-wrap gap-0.5 min-w-0">
        {items.map((item, index) => {
          const isFirst = index === 0
          const isLast = index === items.length - 1

          return (
            <li key={index} className="flex items-center gap-0.5 min-w-0">
              {/* Separator (ليس قبل العنصر الأول) */}
              {!isFirst && <Separator />}

              {isLast ? (
                // ── الصفحة الحالية — غير قابلة للضغط ────────────
                <span
                  aria-current="page"
                  className="text-sm font-medium text-gray-700 truncate max-w-[10rem] sm:max-w-none"
                >
                  {item.label}
                </span>
              ) : isFirst && item.href ? (
                // ── الرئيسية — أيقونة Home فقط ──────────────────
                <Link
                  href={item.href}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-150 flex items-center shrink-0"
                  aria-label="الرئيسية"
                >
                  <Home size={14} />
                </Link>
              ) : item.href ? (
                // ── مستويات وسطى — روابط قابلة للضغط ────────────
                <Link
                  href={item.href}
                  className="text-sm text-gray-400 hover:text-gray-600 transition-colors duration-150 truncate max-w-[8rem] sm:max-w-none"
                >
                  {item.label}
                </Link>
              ) : (
                // ── مستوى وسطى بلا رابط (fallback) ──────────────
                <span className="text-sm text-gray-400 truncate max-w-[8rem] sm:max-w-none">
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export default Breadcrumb
