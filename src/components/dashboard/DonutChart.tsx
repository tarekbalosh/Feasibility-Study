import React, { useState, useId, useMemo } from 'react';
import clsx from 'clsx';

export interface DonutSlice {
  key: string;
  label: string;
  value: number;
  displayValue?: string;
  percentage: number;
  color: string;
  secondaryLabel?: string;
  isMuted?: boolean;
}

interface DonutChartProps {
  slices: DonutSlice[];
  centerValue: string | number;
  centerLabel: string;
  ariaLabel: string;
  onSliceClick?: (slice: DonutSlice) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  showCalloutThreshold?: number; // النسبة الدنيا لظهور خط التوصيل الخارجي
  currencySymbol?: string;
  hoverSuffix?: string;
}

const W = 400;
const H = 260;
const CX = W / 2;
const CY = H / 2;
const RO = 76; // نصف القطر الخارجي
const RI = 48; // نصف القطر الداخلي

export function DonutChart({
  slices,
  centerValue,
  centerLabel,
  ariaLabel,
  onSliceClick,
  emptyTitle = 'لا توجد بيانات بعد',
  emptyDescription = 'لم يتم تسجيل أي بيانات في هذه الفترة.',
  showCalloutThreshold = 4,
  currencySymbol,
  hoverSuffix,
}: DonutChartProps) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const chartId = useId();

  const total = useMemo(() => slices.reduce((acc, s) => acc + (s.value > 0 ? s.value : 0), 0), [slices]);
  const hasData = total > 0;

  // حساب الأقواس وخطوط التوصيل
  const { arcs, callouts } = useMemo(() => {
    if (!hasData) return { arcs: [], callouts: [] };

    // إذا كانت شريحة واحدة فقط 100%
    const positiveSlices = slices.filter((s) => s.value > 0);
    const isSingleSlice = positiveSlices.length === 1;

    let currentAngle = -Math.PI / 2; // البدء من الأعلى (الساعة 12)
    const arcList: any[] = [];
    const calloutList: any[] = [];

    // إذا كانت هناك شرائح مع قيم صفرية متساوية الأقواس (مثل شهور الميزانية)
    // نوزع القوس بالنسبة أو بالتساوي إذا كانت جميعها صفر
    const allZero = slices.every((s) => s.value === 0);

    for (let i = 0; i < slices.length; i++) {
      const s = slices[i];
      let angleSpan = 0;

      if (allZero) {
        angleSpan = (2 * Math.PI) / slices.length;
      } else {
        const ratio = total > 0 ? s.value / total : 0;
        angleSpan = ratio * 2 * Math.PI;
      }

      if (angleSpan <= 0.0001 && !allZero) {
        continue;
      }

      const startAngle = currentAngle;
      const endAngle = currentAngle + angleSpan;
      const midAngle = startAngle + angleSpan / 2;

      // إزاحة خفيفة بين الشرائح إن وُجدت أكثر من شريحة
      const gap = isSingleSlice ? 0 : 0.025;
      const actualStart = startAngle + gap / 2;
      const actualEnd = endAngle - gap / 2;

      // نقاط القوس
      const x1 = CX + RO * Math.cos(actualStart);
      const y1 = CY + RO * Math.sin(actualStart);
      const x2 = CX + RO * Math.cos(actualEnd);
      const y2 = CY + RO * Math.sin(actualEnd);

      const xi1 = CX + RI * Math.cos(actualStart);
      const yi1 = CY + RI * Math.sin(actualStart);
      const xi2 = CX + RI * Math.cos(actualEnd);
      const yi2 = CY + RI * Math.sin(actualEnd);

      const largeArc = angleSpan - gap > Math.PI ? 1 : 0;

      let pathD = '';
      if (isSingleSlice) {
        // حلقة كاملة باستخدام مسارين نصف دائريين لتجنب عيوب SVG arc
        pathD = `
          M ${CX} ${CY - RO}
          A ${RO} ${RO} 0 1 1 ${CX} ${CY + RO}
          A ${RO} ${RO} 0 1 1 ${CX} ${CY - RO}
          M ${CX} ${CY - RI}
          A ${RI} ${RI} 0 1 0 ${CX} ${CY + RI}
          A ${RI} ${RI} 0 1 0 ${CX} ${CY - RI}
          Z
        `;
      } else {
        pathD = `
          M ${x1} ${y1}
          A ${RO} ${RO} 0 ${largeArc} 1 ${x2} ${y2}
          L ${xi2} ${yi2}
          A ${RI} ${RI} 0 ${largeArc} 0 ${xi1} ${yi1}
          Z
        `;
      }

      arcList.push({
        ...s,
        pathD,
        midAngle,
        actualSpan: angleSpan,
      });

      // خطوط التوصيل والتسميات الخارجية (كالصورة المرجعية)
      if (s.percentage >= showCalloutThreshold && s.value > 0) {
        const isRight = Math.cos(midAngle) >= 0;
        const rStart = RO + 3;
        const rBend = RO + 22;

        const p1 = {
          x: CX + rStart * Math.cos(midAngle),
          y: CY + rStart * Math.sin(midAngle),
        };
        const p2 = {
          x: CX + rBend * Math.cos(midAngle),
          y: CY + rBend * Math.sin(midAngle),
        };
        const p3 = {
          x: isRight ? p2.x + 24 : p2.x - 24,
          y: p2.y,
        };

        const lineD = `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} Q ${p2.x.toFixed(1)} ${p2.y.toFixed(1)} ${p3.x.toFixed(1)} ${p3.y.toFixed(1)}`;

        calloutList.push({
          key: s.key,
          label: s.label,
          percentage: s.percentage,
          displayValue: s.displayValue ?? s.value,
          lineD,
          anchor: isRight ? 'start' : 'end',
          textX: isRight ? p3.x + 4 : p3.x - 4,
          textY: p3.y,
          color: s.color,
        });
      }

      currentAngle = endAngle;
    }

    return { arcs: arcList, callouts: calloutList };
  }, [slices, total, hasData, showCalloutThreshold]);

  const activeSlice = slices.find((s) => s.key === hoveredKey);

  return (
    <div className="relative flex flex-col items-center justify-center w-full py-2">
      {/* قارئ الشاشة للوصولية */}
      <div className="sr-only">
        <h4>{ariaLabel}</h4>
        <p>القيمة المركزية: {centerValue} - {centerLabel}</p>
        <ul>
          {slices.map((s) => (
            <li key={s.key}>
              {s.label}: {s.displayValue ?? s.value} ({s.percentage}%)
            </li>
          ))}
        </ul>
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="relative flex items-center justify-center w-24 h-24 mb-3">
            <svg viewBox="0 0 100 100" className="w-full h-full text-gray-200">
              <circle
                cx="50"
                cy="50"
                r="36"
                fill="none"
                stroke="currentColor"
                strokeWidth="14"
                strokeDasharray="4 4"
                className="opacity-50"
              />
            </svg>
            <span className="absolute text-xs font-bold text-gray-400">0</span>
          </div>
          <h4 className="text-sm font-bold text-gray-700">{emptyTitle}</h4>
          <p className="mt-1 text-xs text-gray-400 max-w-xs">{emptyDescription}</p>
        </div>
      ) : (
        <div className="relative w-full overflow-visible flex justify-center" dir="ltr">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full max-w-[420px] h-auto overflow-visible"
            role="img"
            aria-label={ariaLabel}
          >
            {/* خطوط التوصيل الخارجية (Callouts) */}
            {callouts.map((c) => (
              <g key={`callout-${c.key}`} className="transition-opacity duration-200">
                <path
                  d={c.lineD}
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  className="opacity-70"
                />
                <circle
                  cx={c.textX}
                  cy={c.textY}
                  r="2"
                  fill="#94a3b8"
                />
                <text
                  x={c.textX}
                  y={c.textY - 3}
                  textAnchor={c.anchor}
                  className="text-[11px] font-bold fill-gray-800"
                  style={{ fontFamily: 'inherit' }}
                >
                  {c.label}
                </text>
                <text
                  x={c.textX}
                  y={c.textY + 11}
                  textAnchor={c.anchor}
                  className="text-[10px] font-semibold fill-gray-500"
                  style={{ fontFamily: 'inherit' }}
                >
                  {c.percentage}%
                </text>
              </g>
            ))}

            {/* شرائح الحلقة */}
            <g id={`${chartId}-slices`} className="cursor-pointer">
              {arcs.map((arc: any) => {
                const isHovered = hoveredKey === arc.key;
                return (
                  <path
                    key={arc.key}
                    d={arc.pathD}
                    fill={arc.color}
                    className={clsx(
                      'transition-all duration-300 ease-out',
                      onSliceClick && 'hover:brightness-110 active:scale-95',
                      isHovered ? 'opacity-100 filter drop-shadow-md' : 'opacity-90'
                    )}
                    style={{
                      transformOrigin: `${CX}px ${CY}px`,
                      transform: isHovered ? 'scale(1.04)' : 'scale(1)',
                    }}
                    onMouseEnter={(e) => {
                      setHoveredKey(arc.key);
                      const rect = e.currentTarget.getBoundingClientRect();
                      setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top });
                    }}
                    onMouseLeave={() => {
                      setHoveredKey(null);
                      setTooltipPos(null);
                    }}
                    onClick={() => {
                      if (onSliceClick) onSliceClick(arc);
                    }}
                  />
                );
              })}
            </g>

            {/* النصوص المركزية */}
            <g className="pointer-events-none select-none">
              <text
                x={CX}
                y={CY - 1}
                textAnchor="middle"
                className="text-2xl font-black fill-gray-900"
                style={{ fontFamily: 'inherit' }}
              >
                {centerValue}
              </text>
              <text
                x={CX}
                y={CY + 18}
                textAnchor="middle"
                className="text-xs font-semibold fill-gray-500"
                style={{ fontFamily: 'inherit' }}
              >
                {centerLabel}
              </text>
            </g>
          </svg>

          {/* تفاصيل التمرير (Tooltip) */}
          {activeSlice && (
            <div
              className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-xl bg-gray-900/95 backdrop-blur-sm px-3.5 py-2 text-xs text-white shadow-xl z-20 flex items-center gap-2 border border-white/10 animate-fade-in-up"
              dir="rtl"
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: activeSlice.color }}
              />
              <div className="flex flex-col">
                <span className="font-bold text-gray-100">{activeSlice.label}</span>
                <span className="text-[11px] text-gray-300">
                  {activeSlice.displayValue ?? activeSlice.value}
                  {currencySymbol ? ` ${currencySymbol}` : ''} ({activeSlice.percentage}%)
                  {hoverSuffix ? ` • ${hoverSuffix}` : ''}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
