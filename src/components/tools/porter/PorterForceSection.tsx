import React, { useState, useMemo } from "react";
import { PorterColumn } from "./PorterColumn";
import { GenerateMenu } from "./GenerateMenu";
import { AddPorterTrendModal } from "./AddPorterTrendModal";
import { QuickAddPorterImplicationModal } from "./QuickAddPorterImplicationModal";
import type {
  PorterForceKey,
  PorterFieldKey,
  PorterFactorItem,
  CreateLinkedPorterFactorPayload,
} from "@/types/porter";
import { PORTER_FORCE_THEMES } from "@/config/porterTheme";

interface PorterForceSectionProps {
  force: PorterForceKey;
  factors: Record<PorterFieldKey, PorterFactorItem[]>;
  generatingScopes: Set<string>;
  readOnly?: boolean;
  highlightedParentId?: string | null;
  onHighlight?: (parentId: string | null) => void;
  onAddLinkedFactor: (payload: CreateLinkedPorterFactorPayload) => Promise<any>;
  onSuggestImplications: (
    force: PorterForceKey,
    content: string
  ) => Promise<{ positiveImplication: string; negativeImplication: string }>;
  onAddMissingImplication: (
    force: PorterForceKey,
    parentFactorId: string,
    field: "positiveImpacts" | "negativeImpacts",
    content: string,
    aiSuggested?: string
  ) => Promise<any>;
  onAddFactor: (field: PorterFieldKey) => void;
  onUpdateFactor: (
    field: PorterFieldKey,
    factorId: string,
    content: string,
    parentFactorId?: string | null
  ) => void;
  onDeleteFactor: (factor: PorterFactorItem) => void;
  onMoveFactor: (
    field: PorterFieldKey,
    factorId: string,
    direction: "up" | "down"
  ) => void;
  onReorder: (field: PorterFieldKey, newOrder: PorterFactorItem[]) => void;
  onGenerateForce: (strategy: "replace" | "append") => void;
  onGenerateField: (
    field: PorterFieldKey,
    strategy: "replace" | "append"
  ) => void;
}

export const PorterForceSection: React.FC<PorterForceSectionProps> = ({
  force,
  factors,
  generatingScopes,
  readOnly = false,
  highlightedParentId = null,
  onHighlight,
  onAddLinkedFactor,
  onSuggestImplications,
  onAddMissingImplication,
  onAddFactor,
  onUpdateFactor,
  onDeleteFactor,
  onMoveFactor,
  onReorder,
  onGenerateForce,
  onGenerateField,
}) => {
  const theme = PORTER_FORCE_THEMES[force];
  const ForceIcon = theme.icon;
  const isForceGenerating =
    generatingScopes.has(`force:${force}`) || generatingScopes.has("full");

  const totalFactorsCount =
    (factors.trends?.length || 0) +
    (factors.positiveImpacts?.length || 0) +
    (factors.negativeImpacts?.length || 0);

  // حالة نموذج إضافة بند جديد
  const [isAddTrendOpen, setIsAddTrendOpen] = useState(false);
  const [modalInitial, setModalInitial] = useState<{
    content?: string;
    positive?: string;
    negative?: string;
  }>({});

  // حالة نموذج إضافة انعكاس سريع
  const [quickAddTarget, setQuickAddTarget] = useState<{
    trend: PorterFactorItem;
    field: "positiveImpacts" | "negativeImpacts";
  } | null>(null);

  // خريطة فهارس التوجهات للأبناء
  const parentTrendMap = useMemo(() => {
    const map = new Map<string, { id: string; content: string; index: number }>();
    (factors.trends || []).forEach((t, idx) => {
      map.set(t.id, { id: t.id, content: t.content, index: idx + 1 });
    });
    return map;
  }, [factors.trends]);

  // قائمة التوجهات المتاحة للربط
  const availableParentTrends = useMemo(() => {
    return (factors.trends || []).map((t, idx) => ({
      id: t.id,
      content: t.content,
      index: idx + 1,
    }));
  }, [factors.trends]);

  // خريطة الانعكاسات الناقصة لكل بند توجه
  const missingImplicationsMap = useMemo(() => {
    const map = new Map<string, ("positiveImpacts" | "negativeImpacts")[]>();
    const posParentIds = new Set(
      (factors.positiveImpacts || []).filter((f) => f.parentFactorId).map((f) => f.parentFactorId!)
    );
    const negParentIds = new Set(
      (factors.negativeImpacts || []).filter((f) => f.parentFactorId).map((f) => f.parentFactorId!)
    );

    (factors.trends || []).forEach((t) => {
      const missing: ("positiveImpacts" | "negativeImpacts")[] = [];
      if (!posParentIds.has(t.id)) missing.push("positiveImpacts");
      if (!negParentIds.has(t.id)) missing.push("negativeImpacts");
      if (missing.length > 0) map.set(t.id, missing);
    });
    return map;
  }, [factors.trends, factors.positiveImpacts, factors.negativeImpacts]);

  // فتح نافذة الإضافة الموحدة للتوجه وانعكاسيه
  const handleOpenAddTrendModal = () => {
    setModalInitial({});
    setIsAddTrendOpen(true);
  };

  // فتح نافذة الإضافة لإعادة اقتراح الانعكاسين لبند قائم
  const handleResuggestForTrend = (trendId: string) => {
    const trend = (factors.trends || []).find((t) => t.id === trendId);
    if (!trend) return;
    const pos = (factors.positiveImpacts || []).find((p) => p.parentFactorId === trendId);
    const neg = (factors.negativeImpacts || []).find((n) => n.parentFactorId === trendId);
    setModalInitial({
      content: trend.content,
      positive: pos?.content || "",
      negative: neg?.content || "",
    });
    setIsAddTrendOpen(true);
  };

  // إضافة انعكاس ناقص لبند توجه
  const handleOpenQuickAdd = (
    trendId: string,
    field: "positiveImpacts" | "negativeImpacts"
  ) => {
    const trend = (factors.trends || []).find((t) => t.id === trendId);
    if (!trend) return;
    setQuickAddTarget({ trend, field });
  };

  return (
    <section
      className={`rounded-3xl border ${theme.border} bg-white shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden relative`}
      dir="rtl"
    >
      {/* Soft gradient background tint */}
      <div
        className={`absolute inset-0 bg-gradient-to-b ${theme.gradientLight} pointer-events-none`}
      />

      {/* Force Header matching Pest */}
      <div
        className={`relative px-5 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 ${theme.headerBg}`}
      >
        <div className="flex items-center gap-3.5">
          {/* Glowing Squircle Icon */}
          <div
            className={`w-11 h-11 rounded-2xl ${theme.iconBg} flex items-center justify-center shrink-0 shadow-md transition-transform hover:scale-105`}
          >
            <ForceIcon className="w-5 h-5" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {theme.title}
              </h3>
              <span className="text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded-md bg-white/80 border border-slate-200 text-slate-500 uppercase">
                {theme.englishLabel}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/90 border border-slate-200/90 text-xs font-bold text-slate-700 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{totalFactorsCount} بنود</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 hidden sm:block font-medium">
              {theme.subtitle}
            </p>
          </div>
        </div>

        {!readOnly && (
          <div className="flex items-center gap-2 print:hidden relative z-10">
            <GenerateMenu
              label="توليد القوة"
              isLoading={isForceGenerating}
              onGenerate={onGenerateForce}
            />
          </div>
        )}
      </div>

      {/* Three Columns Grid matching Pest: Trends full-width, then 2 side-by-side columns */}
      <div className="relative p-4 sm:p-5 flex flex-col gap-4">
        {/* Trends & Indicators — Full Width */}
        <PorterColumn
          force={force}
          field="trends"
          factors={factors.trends || []}
          isGenerating={
            generatingScopes.has(`field:${force}:trends`) || isForceGenerating
          }
          readOnly={readOnly}
          highlightedParentId={highlightedParentId}
          missingImplicationsMap={missingImplicationsMap}
          onAddFactor={handleOpenAddTrendModal}
          onUpdateFactor={(id, content, parentId) =>
            onUpdateFactor("trends", id, content, parentId)
          }
          onDeleteFactor={(id) => {
            const factor = (factors.trends || []).find((f) => f.id === id);
            if (factor) onDeleteFactor(factor);
          }}
          onMoveFactor={(id, dir) => onMoveFactor("trends", id, dir)}
          onReorder={(list) => onReorder("trends", list)}
          onGenerateCategory={(strat) => onGenerateField("trends", strat)}
          onHighlightParent={onHighlight}
          onAddMissingImplication={handleOpenQuickAdd}
          onResuggestImplications={handleResuggestForTrend}
          fullWidth
        />

        {/* Positive Impacts (Opportunities) & Negative Impacts (Risks) — 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PorterColumn
            force={force}
            field="positiveImpacts"
            factors={factors.positiveImpacts || []}
            isGenerating={
              generatingScopes.has(`field:${force}:positiveImpacts`) ||
              isForceGenerating
            }
            readOnly={readOnly}
            highlightedParentId={highlightedParentId}
            parentTrendMap={parentTrendMap}
            availableParentTrends={availableParentTrends}
            onAddFactor={() => {
              if (availableParentTrends.length > 0) {
                handleOpenQuickAdd(availableParentTrends[0].id, "positiveImpacts");
              } else {
                handleOpenAddTrendModal();
              }
            }}
            onUpdateFactor={(id, content, parentId) =>
              onUpdateFactor("positiveImpacts", id, content, parentId)
            }
            onDeleteFactor={(id) => {
              const factor = (factors.positiveImpacts || []).find((f) => f.id === id);
              if (factor) onDeleteFactor(factor);
            }}
            onMoveFactor={(id, dir) =>
              onMoveFactor("positiveImpacts", id, dir)
            }
            onReorder={(list) => onReorder("positiveImpacts", list)}
            onGenerateCategory={(strat) =>
              onGenerateField("positiveImpacts", strat)
            }
            onHighlightParent={onHighlight}
          />

          <PorterColumn
            force={force}
            field="negativeImpacts"
            factors={factors.negativeImpacts || []}
            isGenerating={
              generatingScopes.has(`field:${force}:negativeImpacts`) ||
              isForceGenerating
            }
            readOnly={readOnly}
            highlightedParentId={highlightedParentId}
            parentTrendMap={parentTrendMap}
            availableParentTrends={availableParentTrends}
            onAddFactor={() => {
              if (availableParentTrends.length > 0) {
                handleOpenQuickAdd(availableParentTrends[0].id, "negativeImpacts");
              } else {
                handleOpenAddTrendModal();
              }
            }}
            onUpdateFactor={(id, content, parentId) =>
              onUpdateFactor("negativeImpacts", id, content, parentId)
            }
            onDeleteFactor={(id) => {
              const factor = (factors.negativeImpacts || []).find((f) => f.id === id);
              if (factor) onDeleteFactor(factor);
            }}
            onMoveFactor={(id, dir) =>
              onMoveFactor("negativeImpacts", id, dir)
            }
            onReorder={(list) => onReorder("negativeImpacts", list)}
            onGenerateCategory={(strat) =>
              onGenerateField("negativeImpacts", strat)
            }
            onHighlightParent={onHighlight}
          />
        </div>
      </div>

      {/* نموذج إضافة بند توجه جديد مع انعكاسيه */}
      <AddPorterTrendModal
        isOpen={isAddTrendOpen}
        force={force}
        initialContent={modalInitial.content}
        initialPositive={modalInitial.positive}
        initialNegative={modalInitial.negative}
        onClose={() => setIsAddTrendOpen(false)}
        onSubmit={async (data) => {
          await onAddLinkedFactor({
            force,
            content: data.content,
            positiveImplication: data.positiveImplication,
            negativeImplication: data.negativeImplication,
            positiveSource: data.aiSuggested?.positive ? "ai" : "manual",
            negativeSource: data.aiSuggested?.negative ? "ai" : "manual",
          });
        }}
        onSuggest={(content) => onSuggestImplications(force, content)}
      />

      {/* نموذج إضافة انعكاس ناقص */}
      {quickAddTarget && (
        <QuickAddPorterImplicationModal
          isOpen={Boolean(quickAddTarget)}
          force={force}
          parentFactor={quickAddTarget.trend}
          field={quickAddTarget.field}
          onClose={() => setQuickAddTarget(null)}
          onSubmit={async (content, aiSuggested) => {
            await onAddMissingImplication(
              force,
              quickAddTarget.trend.id,
              quickAddTarget.field,
              content,
              aiSuggested
            );
          }}
          onSuggest={(content) => onSuggestImplications(force, content)}
        />
      )}
    </section>
  );
};

export default PorterForceSection;
