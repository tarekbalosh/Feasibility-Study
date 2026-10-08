import React, { useMemo, useState } from 'react';
import { LineChart } from 'lucide-react';

export interface BudgetMonthSeries {
  currency: string;
  monthly: number[];
  total: number;
  tasks: number;
}

const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const SYMBOLS: Record<string, string> = {
  SAR: 'ر.س', AED: 'د.إ', USD: '$', EUR: '€', KWD: 'د.ك',
  QAR: 'ر.ق', BHD: 'د.ب', OMR: 'ر.ع', EGP: 'ج.م',
};

const fmt = (n: number) => Math.round(n).toLocaleString('ar-EG');

// أبعاد الرسم (SVG)
const W = 760;
const H = 260;
const PAD = { top: 24, right: 20, bottom: 36, left: 20 };

export function BudgetMonthlyChart({ series }: { series: BudgetMonthSeries[] }) {
  const [active, setActive] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const current = series[active] ?? series[0];

  const geometry = useMemo(() => {
    if (!current) return null;
    const max = Math.max(...current.monthly, 1);
    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;
    // الاتجاه RTL: يناير على اليمين
    const points = current.monthly.map((v, i) => ({
      x: PAD.left + innerW - (innerW * i) / 11,
      y: PAD.top + innerH - (v / max) * innerH,
      v,
    }));
    const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const baseY = PAD.top + innerH;
    const area = `${line} L${points[11].x.toFixed(1)},${baseY} L${points[0].x.toFixed(1)},${baseY} Z`;
    const peak = current.monthly.indexOf(Math.max(...current.monthly));
    return { points, line, area, max, baseY, peak };
  }, [current]);

  return (
    <section className="rounded-3xl bg-white border border-gray-100 p-6 shadow-sm mb-10" id="budget-monthly-chart">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <LineChart className="text-violet-500" size={20} />
          توزيع تكلفة الأهداف الشهري
        </h2>
        {series.length > 1 && (
          <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
            {series.map((s, i) => (
              <button
                key={s.currency}
                id={`budget-currency-${s.currency}`}
                onClick={() => setActive(i)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                  i === active ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {SYMBOLS[s.currency] || s.currency}
              </button>
            ))}
          </div>
        )}
      </div>

      {!current || !geometry ? (
        <div className="py-12 text-center text-sm text-gray-500">
          لا توجد تكاليف موزّعة بعد. أضف مهاماً لها تكلفة وحدّد «توزيع الميزانية».
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-500 mb-4">
            إجمالي التكلفة الموزّعة:{' '}
            <span className="font-bold text-violet-700">
              {fmt(current.total)} {SYMBOLS[current.currency] || current.currency}
            </span>{' '}
            • {fmt(current.tasks)} مهمة • أعلى شهر: {MONTHS[geometry.peak]} ({fmt(current.monthly[geometry.peak])})
          </p>

          <div className="relative" dir="ltr">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="رسم بياني لتوزيع التكلفة الشهري">
              <defs>
                <linearGradient id="budgetArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {[0, 0.25, 0.5, 0.75, 1].map((f) => {
                const y = PAD.top + (H - PAD.top - PAD.bottom) * f;
                return <line key={f} x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} stroke="#eef0f4" strokeWidth="1" />;
              })}

              <path d={geometry.area} fill="url(#budgetArea)" />
              <path d={geometry.line} fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

              {geometry.points.map((p, i) => (
                <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                  <rect x={p.x - 24} y={PAD.top} width="48" height={H - PAD.top - PAD.bottom} fill="transparent" />
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={hover === i ? 6 : 4}
                    fill="#fff"
                    stroke="#7c3aed"
                    strokeWidth="2.5"
                    className="transition-all"
                  />
                  <text x={p.x} y={H - 12} textAnchor="middle" fontSize="11" fill={hover === i ? '#5b21b6' : '#6b7280'}>
                    {MONTHS[i]}
                  </text>
                </g>
              ))}
            </svg>

            {hover !== null && (
              <div
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg bg-gray-900 px-3 py-1.5 text-xs text-white shadow-lg whitespace-nowrap"
                style={{
                  left: `${(geometry.points[hover].x / W) * 100}%`,
                  top: `${(geometry.points[hover].y / H) * 100}%`,
                  marginTop: -10,
                }}
                dir="rtl"
              >
                {MONTHS[hover]}: {fmt(geometry.points[hover].v)} {SYMBOLS[current.currency] || current.currency}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
