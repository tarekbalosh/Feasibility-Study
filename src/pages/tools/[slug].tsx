import React from "react"
import Head from "next/head"
import type { GetServerSideProps } from "next"
import { PublicLayout } from "@/layouts/PublicLayout"
import { ComingSoon } from "@/components/tools/ComingSoon"
import { getAvailableTools, getToolBySlug } from "@/config/tools.registry"

/**
 * صفحة الأداة الاحتياطية.
 * الأدوات الجاهزة لها صفحات تعريف مخصّصة (مثل /tools/feasibility-study
 * و /tools/swot) وهي تسبق هذا المسار في توجيه Next.js. أما أدوات
 * خارطة الطريق فتصل إلى هنا وتُعرض بشاشة "قريباً" — فتبقى بطاقتها في
 * الكتالوج قابلة للنقر بدل أن تؤدي إلى 404.
 *
 * المعرّفات غير الموجودة في السجلّ تُرجع 404 حقيقية من الخادم،
 * حتى لا تُفهرس محركات البحث صفحات وهمية.
 */
interface ToolFallbackPageProps {
  slug: string
}

export default function ToolFallbackPage({ slug }: ToolFallbackPageProps) {
  const tool = getToolBySlug(slug)

  // getServerSideProps تضمن وجود الأداة قبل الوصول إلى هنا
  if (!tool) return null

  return (
    <PublicLayout>
      <Head>
        <title>{tool.name} | Feasibility Suite</title>
        <meta name="description" content={tool.shortDescription} />
        {/* أدوات قيد التطوير لا تُفهرس حتى تُتاح فعلياً */}
        {tool.status === "soon" && <meta name="robots" content="noindex" />}
      </Head>

      <section className="py-16 bg-slate-50 min-h-[70vh]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <ComingSoon tool={tool} suggestions={getAvailableTools().slice(0, 2)} />
        </div>
      </section>
    </PublicLayout>
  )
}

export const getServerSideProps: GetServerSideProps<
  ToolFallbackPageProps
> = async ({ params }) => {
  const slug = typeof params?.slug === "string" ? params.slug : ""

  if (!getToolBySlug(slug)) {
    return { notFound: true }
  }

  return { props: { slug } }
}
