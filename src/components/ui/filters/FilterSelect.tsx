import React, { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Check, Search, X, LucideIcon } from 'lucide-react';
import { FilterOption } from './types';

export interface FilterSelectProps {
  label: string;
  value: string | undefined | null;
  onChange: (value: string) => void;
  options: FilterOption[];
  icon?: LucideIcon;
  placeholder?: string;
  isAllOptionLabel?: string;
  searchThreshold?: number;
  className?: string;
  disabled?: boolean;
  id?: string;
}

export const FilterSelect: React.FC<FilterSelectProps> = ({
  label,
  value,
  onChange,
  options = [],
  icon: Icon,
  placeholder,
  isAllOptionLabel = 'الكل',
  searchThreshold = 6,
  className = '',
  disabled = false,
  id: propId,
}) => {
  const generatedId = useId();
  const id = propId || generatedId;
  const listboxId = `${id}-listbox`;

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const optionsListRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const hasActiveValue = Boolean(value && value !== '');

  const showSearch = options.length > searchThreshold;

  // Filtered options by search query
  const filteredOptions = showSearch && search.trim()
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(search.trim().toLowerCase())
      )
    : options;

  // Total selectable items: "All" option + filteredOptions
  const allSelectableItems = [
    { value: '', label: isAllOptionLabel },
    ...filteredOptions,
  ];

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

  // Focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(
        allSelectableItems.findIndex((item) => item.value === (value || ''))
      );
      if (showSearch) {
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
    } else {
      setSearch('');
      setHighlightedIndex(-1);
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < allSelectableItems.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : allSelectableItems.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < allSelectableItems.length) {
          const item = allSelectableItems[highlightedIndex];
          onChange(item.value);
          setIsOpen(false);
        }
        break;
      case 'Escape':
      case 'Tab':
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && optionsListRef.current) {
      const activeEl = optionsListRef.current.children[highlightedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  return (
    <div
      ref={containerRef}
      className={`relative inline-block ${className}`}
      dir="rtl"
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Button */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        className={`h-10 px-3 rounded-xl border text-xs sm:text-sm font-medium transition-all duration-200 flex items-center justify-between gap-2.5 outline-none select-none ${
          disabled
            ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
            : hasActiveValue
            ? 'bg-indigo-50/70 border-indigo-300 text-indigo-700 shadow-xs'
            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/50 shadow-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          {Icon && (
            <Icon
              size={15}
              className={`shrink-0 transition-colors ${
                hasActiveValue ? 'text-indigo-600' : 'text-slate-400'
              }`}
            />
          )}

          {/* Color Dot if selected option has one */}
          {selectedOption?.dotColor && (
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
              style={{ backgroundColor: selectedOption.dotColor }}
            />
          )}

          {/* Avatar if selected option has one */}
          {selectedOption?.avatar && (
            <img
              src={selectedOption.avatar}
              alt=""
              className="w-5 h-5 rounded-full object-cover shrink-0 border border-slate-200"
            />
          )}

          {/* Initials if available */}
          {selectedOption?.initials && !selectedOption.avatar && (
            <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px] flex items-center justify-center shrink-0">
              {selectedOption.initials}
            </span>
          )}

          <span className="truncate">
            {hasActiveValue ? selectedOption?.label || value : placeholder || label}
          </span>
        </div>

        <ChevronDown
          size={14}
          className={`shrink-0 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-indigo-600' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          aria-labelledby={id}
          className="absolute z-50 right-0 mt-1.5 min-w-[210px] max-w-[280px] bg-white rounded-2xl border border-slate-200 shadow-xl p-1.5 animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Internal search if needed */}
          {showSearch && (
            <div className="p-1 mb-1 border-b border-slate-100">
              <div className="relative flex items-center">
                <Search size={14} className="absolute right-2.5 text-slate-400 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="بحث في الخيارات..."
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

          {/* Options list */}
          <div ref={optionsListRef} className="max-h-56 overflow-y-auto space-y-0.5 scrollbar-thin">
            {/* "All" reset option */}
            <button
              type="button"
              role="option"
              aria-selected={!hasActiveValue}
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm transition-colors text-right ${
                !hasActiveValue
                  ? 'bg-indigo-50 text-indigo-800 font-semibold'
                  : highlightedIndex === 0
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>{isAllOptionLabel}</span>
              {!hasActiveValue && <Check size={14} className="text-indigo-600 shrink-0" />}
            </button>

            {/* Filtered items */}
            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400">لا توجد نتائج مطابقة</div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = opt.value === value;
                const isHighlighted = highlightedIndex === idx + 1;

                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm transition-colors text-right ${
                      isSelected
                        ? 'bg-indigo-50 text-indigo-800 font-semibold'
                        : isHighlighted
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
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

                      {opt.subtext && (
                        <span className="text-[10px] text-slate-400 font-normal">
                          ({opt.subtext})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {opt.badge !== undefined && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono">
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && <Check size={14} className="text-indigo-600" />}
                    </div>
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

export default FilterSelect;
