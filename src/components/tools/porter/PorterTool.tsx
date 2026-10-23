import React, { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { Loader2 } from "lucide-react";
import { PorterStart } from "./PorterStart";
import { PorterEditor } from "./PorterEditor";
import { Breadcrumb } from "@/components/Breadcrumb";
import { usePorterEditor } from "@/hooks/usePorterEditor";

export const PorterTool: React.FC = () => {
  const router = useRouter();
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady) return;
    const id = router.query.id || router.query.run;
    if (typeof id === "string" && id !== "start") {
      setSelectedAnalysisId(id);
    } else {
      setSelectedAnalysisId(null);
    }
  }, [router.isReady, router.query.id, router.query.run]);

  const handleSelect = (id: string) => {
    setSelectedAnalysisId(id);
    router.push(
      {
        pathname: router.pathname,
        query: { ...router.query, id },
      },
      undefined,
      { shallow: true }
    );
  };

  const handleBack = () => {
    setSelectedAnalysisId(null);
    const nextQuery = { ...router.query };
    delete nextQuery.id;
    delete nextQuery.run;
    router.push(
      {
        pathname: router.pathname,
        query: nextQuery,
      },
      undefined,
      { shallow: true }
    );
  };

  if (!router.isReady) {
    return (
      <div className="bg-slate-50 min-h-screen py-6 sm:py-10 flex items-center justify-center" dir="rtl">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">جارٍ التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-6 sm:py-10" dir="rtl">
      <Head>
        <title>تحليل قوى بورتر الخمس | Feasibility Suite</title>
        <meta
          name="description"
          content="حلل البيئة التنافسية لقطاعك وقس مدى جاذبيته عبر قوى بورتر الخمس، يدوياً أو باستخدام الذكاء الاصطناعي."
        />
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4 print:hidden">
        <Breadcrumb
          appendItems={
            selectedAnalysisId
              ? [{ label: "تحليل قوى بورتر", href: "/tools/porter" }, { label: "الجدول والتحرير" }]
              : [{ label: "تحليل قوى بورتر" }]
          }
        />
      </div>

      {selectedAnalysisId ? (
        <PorterEditorWrapper analysisId={selectedAnalysisId} onBack={handleBack} />
      ) : (
        <PorterStart onSelectAnalysis={handleSelect} />
      )}
    </div>
  );
};

const PorterEditorWrapper: React.FC<{
  analysisId: string;
  onBack: () => void;
}> = ({ analysisId, onBack }) => {
  const editor = usePorterEditor(analysisId);
  return <PorterEditor editor={editor} onBackToList={onBack} />;
};

export default PorterTool;
