import React from "react"
import Head from "next/head"
import { useRouter } from "next/router"
import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"
import { WorkspaceGuard } from "@/components/workspace/WorkspaceGuard"

const PestTable = dynamic(
  () => import("@/components/tools/pest/PestTable").then((mod) => mod.PestTable),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center bg-slate-50" dir="rtl">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">جارٍ تحميل التحليل...</p>
        </div>
      </div>
    ),
  }
)

export default function PestDetailPage() {
  const router = useRouter()
  const { id, run } = router.query

  const rawId = typeof id === "string" ? id : ""
  const runId = typeof run === "string" ? run : ""
  const analysisId = rawId === "start" ? runId : rawId

  React.useEffect(() => {
    if (!router.isReady) return
    if (rawId === "start" && !runId) {
      router.replace("/tools/pest")
    }
  }, [router.isReady, rawId, runId, router])

  if (!router.isReady || !analysisId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50" dir="rtl">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
      </div>
    )
  }

  return (
    <WorkspaceGuard>
      <Head>
        <title>تفاصيل تحليل PEST | Feasibility Suite</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div className="min-h-screen bg-slate-50 py-6">
        <PestTable
          analysisId={analysisId}
          onBackToList={() => router.push("/tools/pest")}
        />
      </div>
    </WorkspaceGuard>
  )
}
