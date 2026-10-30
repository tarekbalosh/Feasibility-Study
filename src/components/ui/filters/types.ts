import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface FilterOption {
  value: string;
  label: string;
  dotColor?: string;
  avatar?: string;
  initials?: string;
  badge?: string | number;
  subtext?: string;
}

export type FilterType = 'select' | 'multi-select' | 'date-range';

export interface FilterItemConfig {
  key: string;
  label: string;
  icon?: LucideIcon;
  type: FilterType;
  options?: FilterOption[];
  placeholder?: string;
  searchThreshold?: number; // Show search if options > this number (default: 6)
  isAllOptionLabel?: string; // Default: 'الكل' or 'كل [الاسم]'
}

export interface DateRangeValue {
  from?: string;
  to?: string;
}

export type FilterValue = string | string[] | DateRangeValue | undefined | null;

export type FilterValues = Record<string, FilterValue>;

export interface FilterBarProps {
  // Configurations for declarative filters
  filters?: FilterItemConfig[];
  values: FilterValues;
  onChange: (key: string, value: FilterValue) => void;
  onClearAll: () => void;

  // Search
  searchValue?: string;
  onSearchChange?: (q: string) => void;
  searchPlaceholder?: string;
  showSearch?: boolean;

  // Results & Loading
  totalResults?: number;
  resultsLabel?: string; // e.g. "نتيجة", "مهمة", "خطة"
  isLoading?: boolean;

  // Active chips display
  showChips?: boolean;

  // Extra action slot (e.g. Export button, Add button)
  extraActions?: React.ReactNode;

  className?: string;
}
