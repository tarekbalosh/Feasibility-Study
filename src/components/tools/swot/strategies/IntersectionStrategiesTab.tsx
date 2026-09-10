import React from "react";
import clsx from "clsx";
import { STRATEGY_GROUPS } from "../report/reportMeta";
import type { SwotAnalysis } from "@/types/swot";

interface IntersectionStrategiesTabProps {
  analysis: SwotAnalysis;
}

const ar = (value: number): string => value.toLocaleString("ar-EG");

export const IntersectionStrategiesTab: React.FC<IntersectionStrategiesTabProps> = ({ analysis }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      {STRATEGY_GROUPS.map((group) => (
        <div
          key={group.key}
          className={clsx(
            "border rounded-xl p-5 flex flex-col gap-3",
            group.accent
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-bold">{group.title}</h4>
            <span className="text-xs font-semibold opacity-70 bg-white/70 rounded-full px-2.5 py-0.5">
              {group.formula}
            </span>
          </div>
          <ul className="flex flex-col gap-2">
            {(analysis.strategies?.[group.key] ?? []).map((strategy, index) => (
              <li
                key={index}
                className="text-sm text-slate-700 leading-relaxed flex items-start gap-2"
              >
                <span className="font-bold opacity-60 shrink-0">
                  {ar(index + 1)}.
                </span>
                {strategy}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};
