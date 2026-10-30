import React from 'react';
import { X } from 'lucide-react';

export interface FilterChipProps {
  label: string;
  valueDisplay: string;
  onRemove: () => void;
  className?: string;
}

export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  valueDisplay,
  onRemove,
  className = '',
}) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-800 border border-indigo-200/80 transition-all duration-150 animate-in fade-in zoom-in-95 ${className}`}
      dir="rtl"
    >
      <span className="text-indigo-500 font-normal">{label}:</span>
      <span className="font-semibold truncate max-w-[150px]">{valueDisplay}</span>
      <button
        type="button"
        onClick={onRemove}
        className="text-indigo-400 hover:text-indigo-700 hover:bg-indigo-100 p-0.5 rounded transition-colors"
        title={`إزالة فلتر ${label}`}
        aria-label={`إزالة فلتر ${label}`}
      >
        <X size={13} />
      </button>
    </span>
  );
};

export default FilterChip;
