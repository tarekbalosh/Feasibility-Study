import React, { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Check, Search, X, LucideIcon } from 'lucide-react';
import { FilterOption } from './types';

export interface FilterMultiSelectProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  options: FilterOption[];
  icon?: LucideIcon;
  placeholder?: string;
  searchThreshold?: number;
  className?: string;
  disabled?: boolean;
  id?: string;
}

export const FilterMultiSelect: React.FC<FilterMultiSelectProps> = ({
  label,
  values = [],
  onChange,
  options = [],
  icon: Icon,
  placeholder,
  searchThreshold = 6,
  className = '',
  disabled = false,
  id: propId,
}) => {
  const generatedId = useId();
  const id = propId || generatedId;

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedCount = values.length;
  const hasActiveValues = selectedCount > 0;
  const showSearch = options.length > searchThreshold;

  const filteredOptions = showSearch && search.trim()
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(search.trim().toLowerCase())
      )
    : options;

  // Toggle single option
  const handleToggle = (val: string) => {
    if (values.includes(val)) {
      onChange(values.filter((v) => v !== val));
    } else {
      onChange([...values, val]);
    }
  };

  // Select all filtered
  const handleSelectAll = () => {
    const allVals = Array.from(new Set([...values, ...filteredOptions.map((o) => o.value)]));
    onChange(allVals);
  };

  // Clear all
  const handleClearAll = () => {
    onChange([]);
  };

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

  useEffect(() => {
    if (isOpen && showSearch) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearch('');
    }
  }, [isOpen, showSearch]);

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
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`h-10 px-3 rounded-xl border text-xs sm:text-sm font-medium transition-all duration-200 flex items-center justify-between gap-2.5 outline-none select-none ${
          disabled
            ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
            : hasActiveValues
            ? 'bg-indigo-50/70 border-indigo-300 text-indigo-700 shadow-xs'
            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/50 shadow-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          {Icon && (
            <Icon
              size={15}
              className={`shrink-0 transition-colors ${
                hasActiveValues ? 'text-indigo-600' : 'text-slate-400'
              }`}
            />
          )}

          <span className="truncate">
            {hasActiveValues
              ? selectedCount === 1
                ? options.find((o) => o.value === values[0])?.label || label
                : `${label} (${selectedCount})`
              : placeholder || label}
          </span>
        </div>

        <ChevronDown
          size={14}
          className={`shrink-0 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-indigo-600' : ''
          }`}
        />
      </button>

      {/* Multi-Select Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          aria-multiselectable="true"
          className="absolute z-50 right-0 mt-1.5 min-w-[230px] max-w-[300px] bg-white rounded-2xl border border-slate-200 shadow-xl p-2 animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header Actions: Select all / Clear */}
          <div className="flex items-center justify-between pb-2 mb-1.5 border-b border-slate-100 px-1 text-xs">
            <span className="text-[11px] font-semibold text-slate-500">
              {hasActiveValues ? `تم تحديد (${selectedCount})` : 'اختر عناصر'}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium hover:underline"
              >
                تحديد الكل
              </button>
              {hasActiveValues && (
                <>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-[11px] text-rose-600 hover:text-rose-800 font-medium hover:underline"
                  >
                    مسح
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Search box if needed */}
          {showSearch && (
            <div className="mb-2">
              <div className="relative flex items-center">
                <Search size={14} className="absolute right-2.5 text-slate-400 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="بحث..."
                  className="w-full h-8 pr-8 pl-6 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute left-2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options list with Checkboxes */}
          <div className="max-h-56 overflow-y-auto space-y-0.5 scrollbar-thin">
            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400">لا توجد خيارات مطابقة</div>
            ) : (
              filteredOptions.map((opt) => {
                const isChecked = values.includes(opt.value);

                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={isChecked}
                    onClick={() => handleToggle(opt.value)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs sm:text-sm transition-colors text-right ${
                      isChecked
                        ? 'bg-indigo-50/70 text-indigo-900 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {/* Custom Checkbox */}
                      <span
                        className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                          isChecked
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isChecked && <Check size={11} strokeWidth={3} />}
                      </span>

                      {opt.dotColor && (
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: opt.dotColor }}
                        />
                      )}

                      {opt.avatar && (
                        <img
                          src={opt.avatar}
                          alt=""
                          className="w-5 h-5 rounded-full object-cover shrink-0 border border-slate-200"
                        />
                      )}

                      {opt.initials && !opt.avatar && (
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                          {opt.initials}
                        </span>
                      )}

                      <span className="truncate">{opt.label}</span>
                    </div>

                    {opt.badge !== undefined && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono shrink-0">
                        {opt.badge}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterMultiSelect;
