import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, X, RotateCcw, Check } from 'lucide-react';
import { FilterItemConfig, FilterValues, FilterValue, DateRangeValue } from './types';
import { FilterSelect } from './FilterSelect';
import { FilterMultiSelect } from './FilterMultiSelect';
import { DateRangeFilter } from './DateRangeFilter';

export interface FilterBottomSheetProps {
  filters: FilterItemConfig[];
  values: FilterValues;
  onChange: (key: string, value: FilterValue) => void;
  onClearAll: () => void;
  activeCount: number;
  className?: string;
}

export const FilterBottomSheet: React.FC<FilterBottomSheetProps> = ({
  filters = [],
  values,
  onChange,
  onClearAll,
  activeCount,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  // Local copy of filter values for Apply / Discard pattern in bottom sheet
  const [tempValues, setTempValues] = useState<FilterValues>(values);

  // Sync tempValues when opening
  useEffect(() => {
    if (isOpen) {
      setTempValues(values);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, values]);

  const handleTempChange = (key: string, val: FilterValue) => {
    setTempValues((prev) => ({ ...prev, [key]: val }));
  };

  const handleApply = () => {
    // Commit all temp values
    Object.entries(tempValues).forEach(([k, v]) => {
      onChange(k, v);
    });
    setIsOpen(false);
  };

  const handleClear = () => {
    setTempValues({});
    onClearAll();
    setIsOpen(false);
  };

  if (filters.length === 0) return null;

  return (
    <div className={`md:hidden ${className}`} dir="rtl">
      {/* Mobile Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`h-10 px-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all shadow-xs shrink-0 select-none ${
          activeCount > 0
            ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
        }`}
      >
        <SlidersHorizontal size={15} className={activeCount > 0 ? 'text-indigo-600' : 'text-slate-500'} />
        <span>فلاتر</span>
        {activeCount > 0 && (
          <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-mono font-bold flex items-center justify-center">
            {activeCount}
          </span>
        )}
      </button>

      {/* Bottom Sheet Backdrop & Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer content */}
          <div
            className="relative z-10 w-full max-h-[85vh] bg-white rounded-t-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300"
            dir="rtl"
          >
            {/* Top Drag Handle */}
            <div className="pt-3 pb-1 flex justify-center">
              <span className="w-12 h-1.5 rounded-full bg-slate-200" />
            </div>

            {/* Header */}
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={18} className="text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">تصفية النتائج</h3>
                {activeCount > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold font-mono">
                    {activeCount} نشط
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* Filter Items (Scrollable Body) */}
            <div className="p-5 overflow-y-auto space-y-4 max-h-[60vh]">
              {filters.map((f) => (
                <div key={f.key} className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    {f.label}
                  </label>
                  {f.type === 'select' ? (
                    <FilterSelect
                      label={f.label}
                      value={tempValues[f.key] as string}
                      onChange={(v) => handleTempChange(f.key, v)}
                      options={f.options || []}
                      icon={f.icon}
                      isAllOptionLabel={f.isAllOptionLabel}
                      placeholder={f.placeholder}
                      className="w-full"
                    />
                  ) : f.type === 'multi-select' ? (
                    <FilterMultiSelect
                      label={f.label}
                      values={(tempValues[f.key] as string[]) || []}
                      onChange={(v) => handleTempChange(f.key, v)}
                      options={f.options || []}
                      icon={f.icon}
                      placeholder={f.placeholder}
                      className="w-full"
                    />
                  ) : f.type === 'date-range' ? (
                    <DateRangeFilter
                      label={f.label}
                      value={(tempValues[f.key] as DateRangeValue) || {}}
                      onChange={(v) => handleTempChange(f.key, v)}
                      className="w-full"
                    />
                  ) : null}
                </div>
              ))}
            </div>

            {/* Bottom Sticky Action Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center gap-3">
              <button
                type="button"
                onClick={handleClear}
                className="flex-1 h-11 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5"
              >
                <RotateCcw size={14} />
                <span>مسح الفلاتر</span>
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="flex-2 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5"
              >
                <Check size={16} />
                <span>تطبيق الفلاتر</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterBottomSheet;
