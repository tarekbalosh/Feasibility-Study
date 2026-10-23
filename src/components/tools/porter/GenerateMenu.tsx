import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Loader2, ChevronDown, RefreshCw, PlusCircle } from "lucide-react";

interface GenerateMenuProps {
  label?: string;
  isLoading?: boolean;
  onGenerate: (strategy: "replace" | "append") => void;
  compact?: boolean;
  variant?: "primary" | "ghost";
}

export const GenerateMenu: React.FC<GenerateMenuProps> = ({
  label = "بالذكاء الاصطناعي",
  isLoading = false,
  onGenerate,
  compact = false,
  variant = "ghost",
}) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-right" ref={menuRef} dir="rtl">
      <button
        type="button"
        disabled={isLoading}
        onClick={() => setOpen((prev) => !prev)}
        className={`inline-flex items-center gap-1.5 rounded-xl text-xs font-black transition-all duration-200 shadow-sm ${
          compact ? "px-2.5 py-1 text-[11px]" : "px-3.5 py-2 text-xs"
        } ${
          variant === "primary"
            ? "bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 hover:from-teal-700 hover:to-emerald-800 text-white shadow-teal-500/25 hover:shadow-md hover:scale-[1.02]"
            : "bg-white/95 hover:bg-teal-50/70 text-teal-700 border border-teal-200/80 hover:border-teal-300 shadow-2xs"
        } disabled:opacity-60 disabled:cursor-not-allowed`}
        title="توليد أو اقتراح بنود بالذكاء الاصطناعي"
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Sparkles
            className={`w-3.5 h-3.5 ${
              variant === "primary" ? "text-teal-200" : "text-teal-600"
            }`}
          />
        )}
        <span>{label}</span>
        <ChevronDown
          className={`w-3 h-3 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          } ${variant === "primary" ? "text-teal-200" : "text-slate-400"}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-64 rounded-2xl bg-white/98 backdrop-blur-md shadow-2xl border border-slate-100 p-1.5 z-50 animate-fade-in text-xs">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onGenerate("replace");
            }}
            className="w-full text-right p-2.5 rounded-xl hover:bg-teal-50/70 text-slate-800 hover:text-teal-900 flex items-start gap-2.5 transition-colors group"
          >
            <span className="w-7 h-7 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
              <RefreshCw className="w-3.5 h-3.5" />
            </span>
            <div className="flex flex-col">
              <span className="font-bold text-slate-900">توليد شامل واستبدال</span>
              <span className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                إعادة بناء المحتوى وصياغة بنود جديدة
              </span>
            </div>
          </button>

          <div className="h-px bg-slate-100 my-1" />

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onGenerate("append");
            }}
            className="w-full text-right p-2.5 rounded-xl hover:bg-emerald-50/70 text-slate-800 hover:text-emerald-900 flex items-start gap-2.5 transition-colors group"
          >
            <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
              <PlusCircle className="w-3.5 h-3.5" />
            </span>
            <div className="flex flex-col">
              <span className="font-bold text-slate-900">اقتراح بنود إضافية (إلحاق)</span>
              <span className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                إضافة بنود مكملة دون حذف البنود الحالية
              </span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

export default GenerateMenu;
