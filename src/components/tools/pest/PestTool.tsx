import React, { useState, useEffect } from "react"
import Head from "next/head"
import { useRouter } from "next/router"
import { Loader2 } from "lucide-react"
import { PestStart } from "./PestStart"
import { PestTable } from "./PestTable"
import { Breadcrumb } from "@/components/Breadcrumb"

export const PestTool: React.FC = () => {
  const router = useRouter()
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null)

  useEffect(() => {
    if (!router.isReady) return
    const id = router.query.id || router.query.run
    if (typeof id === "string") {
      setSelectedAnalysisId(id)
    } else {
      setSelectedAnalysisId(null)
    }
  }, [router.isReady, router.query.id, router.query.run])

  const handleSelect = (id: string) => {
    setSelectedAnalysisId(id)
    router.push(
      {
        pathname: router.pathname,
        query: { ...router.query, id },
      },
      undefined,
      { shallow: true }
    )
  }

  const handleBack = () => {
    setSelectedAnalysisId(null)
    const nextQuery = { ...router.query }
    delete nextQuery.id
    delete nextQuery.run
    router.push(
      {
        pathname: router.pathname,
        query: nextQuery,
      },
      undefined,
      { shallow: true }
    )
  }

  if (!router.isReady) {
    return (
      <div className="bg-slate-50 min-h-screen py-6 sm:py-10 flex items-center justify-center" dir="rtl">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">جارٍ التحميل...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-slate-50 min-h-screen py-6 sm:py-10" dir="rtl">
      <Head>
        <title>أداة تحليل PEST | Feasibility Suite</title>
        <meta
          name="description"
          content="تحليل البيئة الخارجية والمؤشرات السياسية والاقتصادية والاجتماعية والتقنية والقانونية لمشروعك."
        />
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4 print:hidden">
        <Breadcrumb
          appendItems={
            selectedAnalysisId
              ? [{ label: "تحليل PEST", href: "/tools/pest" }, { label: "الجدول والتحرير" }]
              : [{ label: "تحليل PEST" }]
          }
        />
      </div>

      {selectedAnalysisId ? (
        <PestTable analysisId={selectedAnalysisId} onBackToList={handleBack} />
      ) : (
        <PestStart onSelectAnalysis={handleSelect} />
      )}
    </div>
  )
}

export default PestTool
