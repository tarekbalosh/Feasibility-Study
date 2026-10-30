import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';

export interface PillItem {
  id: string;
  label: string;
  href: string;
  /** صنف Tailwind لنقطة اللون */
  dotClass: string;
  /** نص صغير بعد الاسم (مثل النسبة) */
  trailing?: React.ReactNode;
  trailingClass?: string;
  /** شريط تقدم 3 بكسل داخل الشريحة (0-100) */
  progress?: number | null;
  progressClass?: string;
  /** يُستدعى عند النقر العادي (بدل الانتقال) — النقر مع Ctrl/Cmd يبقى رابطاً حقيقياً */
  onSelect?: () => void;
  title?: string;
}

const isPlainLeftClick = (e: React.MouseEvent) =>
  e.button === 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey;

const PILL_BASE =
  'group/pill relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 hover:bg-indigo-50/90 active:bg-indigo-100/80 border border-gray-200/70 hover:border-indigo-200 text-gray-700 hover:text-indigo-700 transition-all duration-150 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1';

/** الشريحة الموحّدة المستخدمة في كل البطاقات */
export function StatPill({ item, className = '' }: { item: PillItem; className?: string }) {
  const hasBar = typeof item.progress === 'number';
  return (
    <Link
      href={item.href}
      onClick={(e) => {
        if (item.onSelect && isPlainLeftClick(e)) {
          e.preventDefault();
          item.onSelect();
        }
      }}
      className={`${PILL_BASE} ${hasBar ? 'pb-2' : ''} ${className}`}
      title={item.title ?? item.label}
    >
      <span
        className={`w-2 h-2 rounded-full shrink-0 transition-transform group-hover/pill:scale-125 ${item.dotClass}`}
      />
      <span className="truncate max-w-[110px]">{item.label}</span>
      {item.trailing !== undefined && (
        <span className={`text-[11px] font-semibold tabular-nums ${item.trailingClass ?? 'text-gray-400'}`}>
          {item.trailing}
        </span>
      )}
      {hasBar && (
        <span className="absolute inset-x-2.5 bottom-[3px] h-[3px] overflow-hidden rounded-full bg-gray-200/80">
          <span
            className={`block h-full rounded-full ${item.progressClass ?? 'bg-emerald-500'}`}
            style={{ width: `${Math.min(100, Math.max(0, item.progress as number))}%` }}
          />
        </span>
      )}
    </Link>
  );
}

interface StatPillListProps {
  items: PillItem[];
  /** عدد الشرائح الظاهرة عند وجود فائض */
  maxVisible?: number;
  /** إذا زاد العدد عن هذا الحد نعرض maxVisible ثم شريحة "+N أخرى" */
  overflowAfter?: number;
  moreAriaLabel?: (count: number) => string;
}

/** صف شرائح يلتف على أسطر جديدة، مع قائمة منسدلة للفائض */
export function StatPillList({
  items,
  maxVisible = 5,
  overflowAfter = 5,
  moreAriaLabel = (n) => `عرض ${n} عناصر أخرى`,
}: StatPillListProps) {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMoreOpen) return;
    const onDown = (event: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) setIsMoreOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMoreOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [isMoreOpen]);

  const hasMore = items.length > overflowAfter;
  const visible = hasMore ? items.slice(0, maxVisible) : items;
  const hidden = hasMore ? items.slice(maxVisible) : [];

  return (
    <div className="flex flex-wrap items-center gap-1.5" dir="rtl">
      {visible.map((item) => (
        <StatPill key={item.id} item={item} />
      ))}

      {hasMore && (
        <div className="relative inline-block" ref={moreRef}>
          <button
            type="button"
            onClick={() => setIsMoreOpen((v) => !v)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 active:scale-95"
            aria-expanded={isMoreOpen}
            aria-haspopup="menu"
            aria-label={moreAriaLabel(hidden.length)}
          >
            <span>+{hidden.length} أخرى</span>
            <ChevronDown
              size={13}
              className={`transition-transform duration-200 ${isMoreOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {isMoreOpen && (
            <div
              className="absolute top-full mt-1.5 right-0 z-30 min-w-[170px] max-h-60 overflow-y-auto bg-white rounded-2xl shadow-xl border border-gray-100 p-1.5"
              role="menu"
            >
              {hidden.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={(e) => {
                    if (item.onSelect && isPlainLeftClick(e)) {
                      e.preventDefault();
                      setIsMoreOpen(false);
                      item.onSelect();
                    }
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 focus:outline-none focus-visible:bg-indigo-50 focus-visible:ring-2 focus-visible:ring-indigo-500 transition-colors"
                  role="menuitem"
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${item.dotClass}`} />
                  <span className="truncate flex-1">{item.label}</span>
                  {item.trailing !== undefined && (
                    <span className={`text-[11px] font-semibold tabular-nums ${item.trailingClass ?? 'text-gray-400'}`}>
                      {item.trailing}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
