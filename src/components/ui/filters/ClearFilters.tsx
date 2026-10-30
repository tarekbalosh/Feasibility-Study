import React from 'react';
import { RotateCcw } from 'lucide-react';

export interface ClearFiltersProps {
  onClear: () => void;
  hasActiveFilters: boolean;
  className?: string;
  label?: string;
}

export const ClearFilters: React.FC<ClearFiltersProps> = ({
  onClear,
  hasActiveFilters,
  className = '',
  label = 'مسح الفلاتر',
}) => {
  if (!hasActiveFilters) return null;

  return (
    <button
      type="button"
      onClick={onClear}
      className={`inline-flex items-center gap-1.5 h-10 px-3 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50/80 hover:bg-rose-100 border border-rose-200/80 transition-all duration-200 shadow-xs shrink-0 select-none animate-in fade-in zoom-in-95 ${className}`}
      title={label}
      dir="rtl"
    >
      <RotateCcw size={13} className="shrink-0" />
      <span>{label}</span>
    </button>
  );
};

export default ClearFilters;
