import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronDown, X, RotateCcw } from 'lucide-react';
import { DateRangeValue } from './types';

export interface DateRangeFilterProps {
  label?: string;
  value?: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  className?: string;
  disabled?: boolean;
  id?: string;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  label = 'نطاق التاريخ',
  value = {},
  onChange,
  className = '',
  disabled = false,
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [from, setFrom] = useState(value.from || '');
  const [to, setTo] = useState(value.to || '');

  useEffect(() => {
    setFrom(value.from || '');
    setTo(value.to || '');
  }, [value.from, value.to]);

  const hasActiveRange = Boolean(value.from || value.to);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Formatter for display
  const formatDisplay = () => {
    if (!hasActiveRange) return label;
    if (value.from && value.to) {
      if (value.from === value.to) return value.from;
      return `${value.from} إلى ${value.to}`;
    }
    if (value.from) return `من ${value.from}`;
    if (value.to) return `حتى ${value.to}`;
    return label;
  };

  // Preset Handlers
  const applyPreset = (preset: 'today' | 'this_week' | 'this_month' | 'this_year') => {
    const now = new Date();
    const toIso = (d: Date) => d.toISOString().split('T')[0];

    let start = new Date();
    let end = new Date();

    if (preset === 'today') {
      start = now;
      end = now;
    } else if (preset === 'this_week') {
      // Start of week (Saturday or Sunday based on Arab region)
      const day = now.getDay();
      const diffToSaturday = (day + 1) % 7;
      start.setDate(now.getDate() - diffToSaturday);
      end.setDate(start.getDate() + 6);
    } else if (preset === 'this_month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (preset === 'this_year') {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31);
    }

    const range = { from: toIso(start), to: toIso(end) };
    setFrom(range.from);
    setTo(range.to);
    onChange(range);
    setIsOpen(false);
  };

  const handleApplyCustom = () => {
    onChange({ from: from || undefined, to: to || undefined });
    setIsOpen(false);
  };

  const handleClear = () => {
    setFrom('');
    setTo('');
    onChange({});
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-block ${className}`}
      dir="rtl"
    >
      {/* Trigger Button */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className={`h-10 px-3 rounded-xl border text-xs sm:text-sm font-medium transition-all duration-200 flex items-center justify-between gap-2.5 outline-none select-none ${
          disabled
            ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
            : hasActiveRange
            ? 'bg-indigo-50/70 border-indigo-300 text-indigo-700 shadow-xs'
            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/50 shadow-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          <CalendarIcon
            size={15}
            className={`shrink-0 transition-colors ${
              hasActiveRange ? 'text-indigo-600' : 'text-slate-400'
            }`}
          />
          <span className="truncate max-w-[170px] sm:max-w-[220px]">
            {formatDisplay()}
          </span>
        </div>

        <ChevronDown
          size={14}
          className={`shrink-0 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-indigo-600' : ''
          }`}
        />
      </button>

      {/* Date Range Dropdown Modal */}
      {isOpen && (
        <div
          role="dialog"
          aria-label={label}
          className="absolute z-50 right-0 mt-1.5 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl p-4 animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Quick Presets */}
          <div className="mb-3">
            <span className="text-[11px] font-bold text-slate-400 mb-2 block">
              اختصارات سريعة
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => applyPreset('today')}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 transition-colors border border-slate-100"
              >
                اليوم
              </button>
              <button
                type="button"
                onClick={() => applyPreset('this_week')}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 transition-colors border border-slate-100"
              >
                هذا الأسبوع
              </button>
              <button
                type="button"
                onClick={() => applyPreset('this_month')}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 transition-colors border border-slate-100"
              >
                هذا الشهر
              </button>
              <button
                type="button"
                onClick={() => applyPreset('this_year')}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 transition-colors border border-slate-100"
              >
                هذا العام
              </button>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 space-y-2.5">
            <span className="text-[11px] font-bold text-slate-400 block">
              نطاق مخصص
            </span>
            <div>
              <label className="text-[11px] text-slate-600 mb-1 block">من تاريخ</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full h-8 px-2.5 rounded-lg border border-slate-200 text-xs text-slate-800 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-600 mb-1 block">إلى تاريخ</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full h-8 px-2.5 rounded-lg border border-slate-200 text-xs text-slate-800 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
            {hasActiveRange ? (
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1"
              >
                <RotateCcw size={12} />
                مسح
              </button>
            ) : <span />}

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-600 hover:bg-slate-100 transition-colors"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleApplyCustom}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-xs"
              >
                تطبيق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangeFilter;
