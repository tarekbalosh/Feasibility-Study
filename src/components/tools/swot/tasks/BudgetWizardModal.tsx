import React, { useState, useEffect } from "react";
import {
  X,
  ChevronRight,
  ChevronLeft,
  DollarSign,
  Repeat,
  SplitSquareHorizontal,
  Calendar,
  CheckCircle2,
  AlertCircle,
  BarChart2,
} from "lucide-react";
import clsx from "clsx";
import type { BudgetDistribution, BudgetDistributionMode } from "./TaskModal";

const MONTH_NAMES = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

const createEmptyMonthly = (): number[] => Array(12).fill(0);

const buildLumpDistribution = (cost: number, month: number): number[] => {
  const m = createEmptyMonthly();
  m[month] = cost;
  return m;
};

const buildMonthlyDistribution = (cost: number, start: number, end: number): number[] => {
  const m = createEmptyMonthly();
  if (start > end) return m;
  const count = end - start + 1;
  const perMonth = Math.floor((cost / count) * 100) / 100;
  let remainder = Math.round((cost - perMonth * count) * 100) / 100;
  for (let i = start; i <= end; i++) {
    m[i] = perMonth + (remainder > 0 ? 0.01 : 0);
    if (remainder > 0) remainder = Math.round((remainder - 0.01) * 100) / 100;
  }
  return m;
};

interface BudgetWizardModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (distribution: BudgetDistribution) => void;
  cost: number;
  currency: string;
  initialDistribution?: BudgetDistribution;
}

const STEPS = [
  { label: "طريقة التوزيع" },
  { label: "الإعداد" },
  { label: "المراجعة" },
];

export const BudgetWizardModal: React.FC<BudgetWizardModalProps> = ({
  open,
  onClose,
  onConfirm,
  cost,
  currency,
  initialDistribution,
}) => {
  const now = new Date();
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<BudgetDistributionMode>(initialDistribution?.mode ?? "lump");
  const [lumpMonth, setLumpMonth] = useState<number>(initialDistribution?.lumpMonth ?? now.getMonth());
  const [startMonth, setStartMonth] = useState<number>(initialDistribution?.startMonth ?? now.getMonth());
  const [endMonth, setEndMonth] = useState<number>(initialDistribution?.endMonth ?? Math.min(now.getMonth() + 2, 11));
  const [customMonthly, setCustomMonthly] = useState<number[]>(initialDistribution?.monthly ?? createEmptyMonthly());

  useEffect(() => {
    if (open) {
      setStep(0);
      setMode(initialDistribution?.mode ?? "lump");
      setLumpMonth(initialDistribution?.lumpMonth ?? now.getMonth());
      setStartMonth(initialDistribution?.startMonth ?? now.getMonth());
      setEndMonth(initialDistribution?.endMonth ?? Math.min(now.getMonth() + 2, 11));
      setCustomMonthly(initialDistribution?.monthly ?? createEmptyMonthly());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const computedMonthly: number[] = (() => {
    if (mode === "lump")    return buildLumpDistribution(cost, lumpMonth);
    if (mode === "monthly") return buildMonthlyDistribution(cost, startMonth, endMonth);
    return customMonthly;
  })();

  const monthlyTotal = Math.round(computedMonthly.reduce((a, b) => a + b, 0) * 100) / 100;
  const isBalanced   = Math.abs(monthlyTotal - cost) < 0.02;

  const handleNext = () => {
    setStep(s => s + 1);
  };

  const handleConfirm = () => {
    onConfirm({
      mode,
      monthly: computedMonthly,
      lumpMonth: mode === "lump" ? lumpMonth : undefined,
      startMonth: mode === "monthly" ? startMonth : undefined,
      endMonth:   mode === "monthly" ? endMonth   : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl max-h-[92vh] rounded-2xl bg-white shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-violet-600" />
              توزيع الميزانية الشهري
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 mr-7">
              الإجمالي: <span className="font-bold text-violet-700">{cost.toLocaleString("ar-SA")} {currency}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center px-5 py-3 bg-slate-50 border-b border-slate-100 gap-1">
          {STEPS.map((s, i) => (
            <React.Fragment key={i}>
              <button
                onClick={() => i < step && setStep(i)}
                className={clsx(
                  "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                  i === step ? "bg-violet-600 text-white shadow-sm" :
                  i < step   ? "text-violet-600 hover:bg-violet-50 cursor-pointer" :
                               "text-slate-400 cursor-default"
                )}
              >
                <span className={clsx(
                  "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black",
                  i === step ? "bg-white/20 text-white" :
                  i < step   ? "bg-violet-100 text-violet-600" :
                               "bg-slate-200 text-slate-400"
                )}>{i + 1}</span>
                {s.label}
              </button>
              {i < STEPS.length - 1 && (
                <ChevronLeft className={clsx("w-4 h-4 shrink-0", i < step ? "text-violet-400" : "text-slate-200")} />
              )}
            </React.Fragment>
          ))}
          <div className="mr-auto">
            <span className="text-[10px] text-slate-400 font-medium">{step + 1} / {STEPS.length}</span>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Step 1: Mode Selection */}
          {step === 0 && (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                كيف تريد توزيع <span className="font-bold text-slate-800">{cost.toLocaleString("ar-SA")} {currency}</span> على أشهر السنة؟
              </p>
              {[
                { value: "lump" as BudgetDistributionMode, label: "دفعة واحدة", desc: "يُصرف المبلغ كاملاً في شهر واحد تحدده", icon: <DollarSign className="w-6 h-6" /> },
                { value: "monthly" as BudgetDistributionMode, label: "شهري متكرر", desc: "يُقسَّم المبلغ بالتساوي على عدة أشهر متتالية", icon: <Repeat className="w-6 h-6" /> },
                { value: "custom" as BudgetDistributionMode, label: "توزيع مخصص", desc: "تُدخل يدوياً المبلغ لكل شهر بحرية كاملة", icon: <SplitSquareHorizontal className="w-6 h-6" /> },
              ].map(opt => {
                const sel = mode === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setMode(opt.value)}
                    className={clsx(
                      "w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-right transition-all",
                      sel ? "border-violet-500 bg-violet-50 shadow-md shadow-violet-100" :
                            "border-slate-200 bg-white hover:border-violet-300 hover:bg-violet-50/40"
                    )}
                  >
                    <div className={clsx("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", sel ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-500")}>
                      {opt.icon}
                    </div>
                    <div className="flex-1">
                      <div className={clsx("font-bold text-sm", sel ? "text-violet-800" : "text-slate-700")}>{opt.label}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{opt.desc}</div>
                    </div>
                    <div className={clsx("w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center", sel ? "border-violet-600 bg-violet-600" : "border-slate-300")}>
                      {sel && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Step 2: Configuration */}
          {step === 1 && (
            <div className="space-y-4">
              {mode === "lump" && (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600">اختر الشهر الذي سيُصرف فيه المبلغ كاملاً</p>
                  <div className="grid grid-cols-3 gap-2">
                    {MONTH_NAMES.map((name, i) => (
                      <button key={i} type="button" onClick={() => setLumpMonth(i)}
                        className={clsx("py-3 rounded-xl border-2 text-sm font-bold transition-all",
                          lumpMonth === i ? "border-violet-500 bg-violet-600 text-white shadow-md" :
                                           "border-slate-200 text-slate-600 hover:border-violet-300 hover:bg-violet-50")}
                      >{name}</button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 px-4 py-3 bg-violet-50 border border-violet-200 rounded-xl text-sm text-violet-700 font-semibold">
                    <DollarSign className="w-4 h-4 shrink-0" />
                    سيُصرف <span className="font-bold mx-1">{cost.toLocaleString("ar-SA")} {currency}</span> في <span className="font-bold">{MONTH_NAMES[lumpMonth]}</span>
                  </div>
                </div>
              )}

              {mode === "monthly" && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600">حدد نطاق الأشهر لتوزيع المبلغ بالتساوي</p>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2">شهر البداية</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {MONTH_NAMES.map((name, i) => (
                        <button key={i} type="button" onClick={() => { setStartMonth(i); if (i > endMonth) setEndMonth(i); }}
                          className={clsx("py-2 rounded-xl border text-xs font-bold transition-all",
                            startMonth === i ? "border-violet-500 bg-violet-600 text-white" :
                                              "border-slate-200 text-slate-600 hover:border-violet-300 hover:bg-violet-50")}
                        >{name}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2">شهر النهاية</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {MONTH_NAMES.map((name, i) => (
                        <button key={i} type="button" onClick={() => { setEndMonth(i); if (i < startMonth) setStartMonth(i); }}
                          disabled={i < startMonth}
                          className={clsx("py-2 rounded-xl border text-xs font-bold transition-all",
                            endMonth === i ? "border-violet-500 bg-violet-600 text-white" :
                            i < startMonth ? "border-slate-100 text-slate-300 cursor-not-allowed" :
                                            "border-slate-200 text-slate-600 hover:border-violet-300 hover:bg-violet-50")}
                        >{name}</button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-3 bg-violet-50 border border-violet-200 rounded-xl text-sm text-violet-700 font-semibold">
                    <Repeat className="w-4 h-4 shrink-0" />
                    <span>
                      {endMonth - startMonth + 1} شهر ·{" "}
                      <span className="font-bold">{(cost / (endMonth - startMonth + 1)).toLocaleString("ar-SA", { maximumFractionDigits: 2 })} {currency}</span>/شهر
                      <span className="font-normal opacity-70 mr-1">(من {MONTH_NAMES[startMonth]} إلى {MONTH_NAMES[endMonth]})</span>
                    </span>
                  </div>
                </div>
              )}

              {mode === "custom" && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600">أدخل المبلغ لكل شهر (المجموع يجب = {cost.toLocaleString("ar-SA")} {currency})</p>
                  <div className="grid grid-cols-3 gap-2">
                    {MONTH_NAMES.map((name, i) => (
                      <div key={i} className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-500 text-center">{name}</label>
                        <input
                          type="number" min={0} step={0.01}
                          value={customMonthly[i] === 0 ? "" : customMonthly[i]}
                          onChange={(e) => {
                            const updated = [...customMonthly];
                            updated[i] = e.target.value === "" ? 0 : parseFloat(e.target.value) || 0;
                            setCustomMonthly(updated);
                          }}
                          placeholder="0"
                          className={clsx(
                            "w-full text-center text-sm font-bold px-2 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-violet-400/30 transition-all",
                            customMonthly[i] > 0 ? "border-violet-300 bg-violet-50 text-violet-800" : "border-slate-200 bg-white text-slate-700"
                          )}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className={clsx(isBalanced ? "text-emerald-600" : monthlyTotal > cost ? "text-red-600" : "text-amber-600")}>
                        المُخصَّص: {monthlyTotal.toLocaleString("ar-SA")} {currency}
                      </span>
                      {monthlyTotal > 0 && cost - monthlyTotal !== 0 && (
                        <span className={clsx("px-2 py-0.5 rounded-full", cost - monthlyTotal > 0 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700")}>
                          {cost - monthlyTotal > 0 ? "المتبقي: " : "المتجاوز: "}
                          {Math.abs(cost - monthlyTotal).toLocaleString("ar-SA")} {currency}
                        </span>
                      )}
                      <span className="text-slate-500">الهدف: {cost.toLocaleString("ar-SA")} {currency}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={clsx("h-full rounded-full transition-all duration-300", isBalanced ? "bg-emerald-500" : monthlyTotal > cost ? "bg-red-500" : "bg-violet-500")}
                        style={{ width: `${Math.min((monthlyTotal / cost) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Review */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">راجع التوزيع النهائي قبل التأكيد</p>
              <div className="flex items-center gap-3 px-4 py-3 bg-violet-50 border border-violet-200 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-violet-600 text-white flex items-center justify-center shrink-0">
                  {mode === "lump" ? <DollarSign className="w-4 h-4" /> : mode === "monthly" ? <Repeat className="w-4 h-4" /> : <SplitSquareHorizontal className="w-4 h-4" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-violet-800">
                    {mode === "lump" ? `دفعة واحدة في ${MONTH_NAMES[lumpMonth]}` :
                     mode === "monthly" ? `شهري من ${MONTH_NAMES[startMonth]} إلى ${MONTH_NAMES[endMonth]}` : "توزيع مخصص"}
                  </div>
                  <div className="text-xs text-violet-600">
                    {mode === "monthly"
                      ? `${(cost / (endMonth - startMonth + 1)).toLocaleString("ar-SA", { maximumFractionDigits: 2 })} ${currency}/شهر`
                      : `${cost.toLocaleString("ar-SA")} ${currency} إجمالاً`}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {MONTH_NAMES.map((name, i) => {
                  const val = computedMonthly[i];
                  const isActive = val > 0;
                  return (
                    <div key={i} className={clsx("rounded-xl border p-2.5 text-center transition-all", isActive ? "border-violet-300 bg-violet-50 shadow-sm" : "border-slate-100 bg-slate-50/50")}>
                      <div className={clsx("text-[10px] font-bold mb-1", isActive ? "text-violet-600" : "text-slate-400")}>{name}</div>
                      <div className={clsx("text-xs font-bold", isActive ? "text-violet-900" : "text-slate-300")}>
                        {isActive ? val.toLocaleString("ar-SA", { maximumFractionDigits: 2 }) : "—"}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className={clsx("flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-bold", isBalanced ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700")}>
                {isBalanced ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                <span>
                  {isBalanced
                    ? `المجموع = ${cost.toLocaleString("ar-SA")} ${currency} — متوازن ✅`
                    : `المجموع = ${monthlyTotal.toLocaleString("ar-SA")} ${currency} — الفرق: ${Math.abs(monthlyTotal - cost).toLocaleString("ar-SA", { maximumFractionDigits: 2 })} ${currency}`}
                </span>
              </div>
              {!isBalanced && mode === "custom" && (
                <p className="text-xs text-red-500 text-center">يرجى العودة وتعديل المبالغ حتى يتساوى المجموع مع الإجمالي.</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-5 py-4 border-t border-slate-100 bg-slate-50">
          {step === 0 ? (
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-bold hover:bg-slate-100 transition-colors">
              إلغاء
            </button>
          ) : (
            <button type="button" onClick={() => setStep(s => s - 1)} className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-bold hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5">
              <ChevronRight className="w-4 h-4" />
              السابق
            </button>
          )}
          {step < 2 ? (
            <button type="button" onClick={handleNext} className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold shadow-md shadow-violet-200 transition-all flex items-center justify-center gap-1.5 hover:-translate-y-0.5">
              التالي
              <ChevronLeft className="w-4 h-4" />
            </button>
          ) : (
            <button type="button" onClick={handleConfirm} disabled={!isBalanced} className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md shadow-emerald-200 transition-all flex items-center justify-center gap-1.5 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0">
              <CheckCircle2 className="w-4 h-4" />
              تأكيد التوزيع
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BudgetWizardModal;
