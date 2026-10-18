import React from "react"
import Head from "next/head"
import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"
import { WorkspaceGuard } from "@/components/workspace/WorkspaceGuard"

const PestTool = dynamic(() => import("@/components/tools/pest/PestTool"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-slate-50" dir="rtl">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
        <p className="text-sm text-slate-500 font-medium">جارٍ تحميل أداة تحليل PEST...</p>
      </div>
    </div>
  ),
})

export default function PestStartPage() {
  return (
    <WorkspaceGuard>
      <Head>
        <title>مشغّل أداة تحليل PEST | Feasibility Suite</title>
        <meta name="robots" content="noindex" />
      </Head>
      <PestTool />
    </WorkspaceGuard>
  )
}
