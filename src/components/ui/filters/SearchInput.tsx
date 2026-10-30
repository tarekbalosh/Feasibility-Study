import React, { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
  autoFocus?: boolean;
  enableSlashShortcut?: boolean;
  id?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = 'بحث...',
  debounceMs = 300,
  className = '',
  autoFocus = false,
  enableSlashShortcut = true,
  id,
}) => {
  const [internalValue, setInternalValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync internal value when external value changes
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  // Debounced callback
  useEffect(() => {
    if (internalValue === value) return;
    const timer = setTimeout(() => {
      onChange(internalValue);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [internalValue, debounceMs, onChange, value]);

  // Global "/" shortcut to focus search input
  useEffect(() => {
    if (!enableSlashShortcut) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if already inside an editable input or textarea
      const target = e.target as HTMLElement | null;
      const isEditable =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable;

      if (e.key === '/' && !isEditable) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableSlashShortcut]);

  const handleClear = () => {
    setInternalValue('');
    onChange('');
    inputRef.current?.focus();
  };

  return (
    <div
      className={`relative flex items-center transition-all duration-200 ${className}`}
      dir="rtl"
    >
      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 flex items-center">
        <Search size={16} />
      </div>

      <input
        ref={inputRef}
        id={id}
        type="text"
        value={internalValue}
        onChange={(e) => setInternalValue(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={`w-full h-10 pr-10 pl-11 bg-white border rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 font-cairo outline-none transition-all duration-200 ${
          isFocused
            ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
            : 'border-slate-200 hover:border-slate-300 shadow-xs'
        }`}
      />

      {/* Clear button or "/" keyboard hint */}
      <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {internalValue ? (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title="مسح البحث"
            aria-label="مسح البحث"
          >
            <X size={15} />
          </button>
        ) : enableSlashShortcut && !isFocused ? (
          <kbd
            className="hidden sm:inline-flex items-center justify-center h-5 w-5 text-[10px] font-mono font-medium text-slate-400 bg-slate-100 border border-slate-200 rounded pointer-events-none select-none"
            title="اضغط / للبحث السريع"
          >
            /
          </kbd>
        ) : null}
      </div>
    </div>
  );
};

export default SearchInput;
