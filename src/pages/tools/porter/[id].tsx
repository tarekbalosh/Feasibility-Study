import React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { WorkspaceGuard } from "@/components/workspace/WorkspaceGuard";
import { usePorterEditor } from "@/hooks/usePorterEditor";

const PorterEditor = dynamic(
  () => import("@/components/tools/porter/PorterEditor").then((mod) => mod.PorterEditor),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center bg-slate-50" dir="rtl">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">جارٍ تحميل التحليل...</p>
        </div>
      </div>
    ),
  }
);

export default function PorterDetailPage() {
  const router = useRouter();
  const { id, run } = router.query;

  const rawId = typeof id === "string" ? id : "";
  const runId = typeof run === "string" ? run : "";
  const analysisId = rawId === "start" ? runId : rawId;

  React.useEffect(() => {
    if (!router.isReady) return;
    if (rawId === "start" && !runId) {
      router.replace("/tools/porter");
    }
  }, [router.isReady, rawId, runId, router]);

  if (!router.isReady || !analysisId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50" dir="rtl">
        <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
      </div>
    );
  }

  return (
    <WorkspaceGuard>
      <Head>
        <title>تفاصيل تحليل قوى بورتر | Feasibility Suite</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div className="min-h-screen bg-slate-50 py-6">
        <PorterEditorWrapper
          analysisId={analysisId}
          onBack={() => router.push("/tools/porter")}
        />
      </div>
    </WorkspaceGuard>
  );
}

const PorterEditorWrapper: React.FC<{
  analysisId: string;
  onBack: () => void;
}> = ({ analysisId, onBack }) => {
  const editor = usePorterEditor(analysisId);
  return <PorterEditor editor={editor} onBackToList={onBack} />;
};
