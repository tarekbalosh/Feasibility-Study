import React from "react";
import { PorterColumn } from "./PorterColumn";
import { GenerateMenu } from "./GenerateMenu";
import type {
  PorterForceKey,
  PorterFieldKey,
  PorterFactorItem,
} from "@/types/porter";
import { PORTER_FORCE_THEMES } from "@/config/porterTheme";

interface PorterForceSectionProps {
  force: PorterForceKey;
  factors: Record<PorterFieldKey, PorterFactorItem[]>;
  generatingScopes: Set<string>;
  onAddFactor: (field: PorterFieldKey) => void;
  onUpdateFactor: (
    field: PorterFieldKey,
    factorId: string,
    content: string
  ) => void;
  onDeleteFactor: (field: PorterFieldKey, factorId: string) => void;
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

        <div className="flex items-center gap-2 print:hidden relative z-10">
          <GenerateMenu
            label="توليد القوة"
            isLoading={isForceGenerating}
            onGenerate={onGenerateForce}
          />
        </div>
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
          onAddFactor={() => onAddFactor("trends")}
          onUpdateFactor={(id, content) =>
            onUpdateFactor("trends", id, content)
          }
          onDeleteFactor={(id) => onDeleteFactor("trends", id)}
          onMoveFactor={(id, dir) => onMoveFactor("trends", id, dir)}
          onReorder={(list) => onReorder("trends", list)}
          onGenerateCategory={(strat) => onGenerateField("trends", strat)}
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
            onAddFactor={() => onAddFactor("positiveImpacts")}
            onUpdateFactor={(id, content) =>
              onUpdateFactor("positiveImpacts", id, content)
            }
            onDeleteFactor={(id) => onDeleteFactor("positiveImpacts", id)}
            onMoveFactor={(id, dir) =>
              onMoveFactor("positiveImpacts", id, dir)
            }
            onReorder={(list) => onReorder("positiveImpacts", list)}
            onGenerateCategory={(strat) =>
              onGenerateField("positiveImpacts", strat)
            }
          />

          <PorterColumn
            force={force}
            field="negativeImpacts"
            factors={factors.negativeImpacts || []}
            isGenerating={
              generatingScopes.has(`field:${force}:negativeImpacts`) ||
              isForceGenerating
            }
            onAddFactor={() => onAddFactor("negativeImpacts")}
            onUpdateFactor={(id, content) =>
              onUpdateFactor("negativeImpacts", id, content)
            }
            onDeleteFactor={(id) => onDeleteFactor("negativeImpacts", id)}
            onMoveFactor={(id, dir) =>
              onMoveFactor("negativeImpacts", id, dir)
            }
            onReorder={(list) => onReorder("negativeImpacts", list)}
            onGenerateCategory={(strat) =>
              onGenerateField("negativeImpacts", strat)
            }
          />
        </div>
      </div>
    </section>
  );
};

export default PorterForceSection;
