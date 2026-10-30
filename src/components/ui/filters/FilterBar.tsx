import React, { useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import {
  FilterBarProps,
  FilterItemConfig,
  FilterValue,
  DateRangeValue,
} from './types';
import { SearchInput } from './SearchInput';
import { FilterSelect } from './FilterSelect';
import { FilterMultiSelect } from './FilterMultiSelect';
import { DateRangeFilter } from './DateRangeFilter';
import { FilterChip } from './FilterChip';
import { ClearFilters } from './ClearFilters';
import { FilterBottomSheet } from './FilterBottomSheet';

export const FilterBar: React.FC<FilterBarProps> = ({
  filters = [],
  values = {},
  onChange,
  onClearAll,
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'ابحث...',
  showSearch = true,
  totalResults,
  resultsLabel = 'نتيجة',
  isLoading = false,
  showChips = true,
  extraActions,
  className = '',
}) => {
  // Calculate active filter count
  const activeCount = useMemo(() => {
    let count = 0;
    if (searchValue && searchValue.trim() !== '') {
      count++;
    }
    Object.values(values).forEach((val) => {
      if (val === undefined || val === null || val === '') return;
      if (Array.isArray(val)) {
        if (val.length > 0) count++;
      } else if (typeof val === 'object') {
        const range = val as DateRangeValue;
        if (range.from || range.to) count++;
      } else {
        count++;
      }
    });
    return count;
  }, [values, searchValue]);

  const hasActiveFilters = activeCount > 0;

  // Collect active chips for rendering
  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; display: string }[] = [];

    filters.forEach((filter) => {
      const val = values[filter.key];
      if (val === undefined || val === null || val === '') return;

      if (filter.type === 'select') {
        const opt = filter.options?.find((o) => o.value === val);
        chips.push({
          key: filter.key,
          label: filter.label,
          display: opt ? opt.label : String(val),
        });
      } else if (filter.type === 'multi-select') {
        const arr = (val as string[]) || [];
        if (arr.length > 0) {
          const names = arr
            .map((v) => filter.options?.find((o) => o.value === v)?.label || v)
            .join('، ');
          chips.push({
            key: filter.key,
            label: filter.label,
            display: names,
          });
        }
      } else if (filter.type === 'date-range') {
        const range = val as DateRangeValue;
        if (range.from || range.to) {
          let text = '';
          if (range.from && range.to) text = `${range.from} إلى ${range.to}`;
          else if (range.from) text = `من ${range.from}`;
          else text = `حتى ${range.to}`;

          chips.push({
            key: filter.key,
            label: filter.label,
            display: text,
          });
        }
      }
    });

    return chips;
  }, [filters, values]);

  const handleChipRemove = (key: string) => {
    const filter = filters.find((f) => f.key === key);
    if (!filter) {
      onChange(key, undefined);
      return;
    }

    if (filter.type === 'multi-select') {
      onChange(key, []);
    } else if (filter.type === 'date-range') {
      onChange(key, {});
    } else {
      onChange(key, '');
    }
  };

  return (
    <div className={`space-y-3 mb-5 ${className}`} dir="rtl">
      {/* Main Filter Row */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Search Input */}
        {showSearch && onSearchChange && (
          <div className="w-full sm:w-64 lg:w-72 shrink-0">
            <SearchInput
              value={searchValue}
              onChange={onSearchChange}
              placeholder={searchPlaceholder}
            />
          </div>
        )}

        {/* Desktop Filter Controls (Hidden on Mobile) */}
        <div className="hidden md:flex flex-wrap items-center gap-2">
          {filters.map((filter) => {
            if (filter.type === 'select') {
              return (
                <FilterSelect
                  key={filter.key}
                  label={filter.label}
                  value={values[filter.key] as string}
                  onChange={(v) => onChange(filter.key, v)}
                  options={filter.options || []}
                  icon={filter.icon}
                  placeholder={filter.placeholder}
                  isAllOptionLabel={filter.isAllOptionLabel}
                  searchThreshold={filter.searchThreshold}
                />
              );
            }

            if (filter.type === 'multi-select') {
              return (
                <FilterMultiSelect
                  key={filter.key}
                  label={filter.label}
                  values={(values[filter.key] as string[]) || []}
                  onChange={(v) => onChange(filter.key, v)}
                  options={filter.options || []}
                  icon={filter.icon}
                  placeholder={filter.placeholder}
                  searchThreshold={filter.searchThreshold}
                />
              );
            }

            if (filter.type === 'date-range') {
              return (
                <DateRangeFilter
                  key={filter.key}
                  label={filter.label}
                  value={(values[filter.key] as DateRangeValue) || {}}
                  onChange={(v) => onChange(filter.key, v)}
                />
              );
            }

            return null;
          })}
        </div>

        {/* Mobile Bottom Sheet Drawer Button */}
        {filters.length > 0 && (
          <FilterBottomSheet
            filters={filters}
            values={values}
            onChange={onChange}
            onClearAll={onClearAll}
            activeCount={activeCount}
          />
        )}

        {/* Clear Filters Button (Desktop & Mobile) */}
        <ClearFilters
          hasActiveFilters={hasActiveFilters}
          onClear={onClearAll}
        />

        {/* Results Counter & Loading Indicator */}
        {totalResults !== undefined && (
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-100/70 border border-slate-200/60 px-3 h-10 rounded-xl select-none shrink-0">
            {isLoading ? (
              <Loader2 size={14} className="animate-spin text-indigo-600" />
            ) : null}
            <span>
              {totalResults.toLocaleString('ar-SA')} {resultsLabel}
            </span>
          </div>
        )}

        {/* Extra Actions Slot (Export button, Add button, etc.) */}
        {extraActions && (
          <div className="mr-auto flex items-center gap-2 shrink-0">
            {extraActions}
          </div>
        )}
      </div>

      {/* Active Filter Chips Row */}
      {showChips && (activeChips.length > 0 || (searchValue && onSearchChange)) && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-bold text-slate-400 ml-1">
            الفلاتر المطبقة:
          </span>

          {searchValue && onSearchChange && (
            <FilterChip
              label="البحث"
              valueDisplay={`"${searchValue}"`}
              onRemove={() => onSearchChange('')}
            />
          )}

          {activeChips.map((chip) => (
            <FilterChip
              key={chip.key}
              label={chip.label}
              valueDisplay={chip.display}
              onRemove={() => handleChipRemove(chip.key)}
            />
          ))}

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearAll}
              className="text-[11px] text-slate-500 hover:text-rose-600 font-semibold mr-1 transition-colors hover:underline"
            >
              مسح الكل
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterBar;
