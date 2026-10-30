import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  LayoutDashboard,
  Building2,
  Briefcase,
  FolderGit2,
  MessageSquare,
  FileText,
  Compass,
  ChevronDown,
  type LucideIcon,
} from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useChat } from '@/context/ChatContext';
import {
  getNavPlanningTools,
  getToolNavPath,
} from '@/config/tools.registry';
import type { ToolDefinition } from '@/types/tool';

const STORAGE_KEY = 'sidebar_planning_expanded';

interface SidebarNavProps {
  onItemClick?: () => void;
  className?: string;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({ onItemClick, className = '' }) => {
  const router = useRouter();
  const { workspace } = useWorkspace();
  const { totalUnreadCount } = useChat();

  const isAdminOrOwner = workspace?.role === 'owner' || workspace?.role === 'admin';

  // جلب الأدوات المتاحة لدور المستخدم الحالي من السجل المركزي
  const tools = useMemo(() => {
    return getNavPlanningTools(workspace?.role, true);
  }, [workspace?.role]);

  // فحص ما إذا كانت الصفحة الحالية تطابق إحدى الأدوات
  const isToolActive = (tool: ToolDefinition): boolean => {
    const currentPath = router.pathname;
    const currentAsPath = router.asPath;
    const navPath = getToolNavPath(tool);

    if (currentPath === navPath || currentAsPath === navPath) return true;
    if (tool.legacyPath && (currentPath.includes(tool.legacyPath) || currentAsPath.includes(tool.legacyPath))) {
      return true;
    }
    if (currentAsPath.startsWith(`/tools/${tool.slug}`)) return true;
    if (currentPath.startsWith(`/tools/${tool.slug}`)) return true;
    if (router.query.slug === tool.slug) return true;
    return false;
  };

  // هل عنصر "التخطيط" أو إحدى أدواته نشطة الآن؟
  const isPlanningActive = useMemo(() => {
    if (!tools || tools.length === 0) return false;
    return tools.some(isToolActive) || router.pathname.startsWith('/tools');
  }, [tools, router.pathname, router.asPath, router.query.slug]);

  // حالة الفتح / الإغلاق للقائمة المنسدلة
  const [isPlanningOpen, setIsPlanningOpen] = useState(false);

  // مراجع عناصر القائمة للتحكم بالكيبورد
  const planningButtonRef = useRef<HTMLButtonElement | null>(null);
  const toolRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  // استرجاع الحالة من localStorage أو الفتح التلقائي عند دخول صفحة أداة
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (isPlanningActive) {
      setIsPlanningOpen(true);
      return;
    }

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        setIsPlanningOpen(saved === 'true');
      }
    } catch {
      // تجاهل أخطاء التخزين
    }
  }, [isPlanningActive]);

  // تبديل حالة الفتح والإغلاق مع الحفظ في localStorage
  const togglePlanning = () => {
    setIsPlanningOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // تجاهل أخطاء التخزين
      }
      return next;
    });
  };

  // معالجة مفاتيح الكيبورد على زر "التخطيط" الرئيسي
  const handleParentKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      togglePlanning();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isPlanningOpen) {
        setIsPlanningOpen(true);
      }
      setTimeout(() => {
        const firstFocusable = toolRefs.current.find((ref) => ref !== null);
        firstFocusable?.focus();
      }, 50);
    } else if (e.key === 'Escape' && isPlanningOpen) {
      e.preventDefault();
      setIsPlanningOpen(false);
    }
  };

  // معالجة مفاتيح الكيبورد داخل عناصر الأدوات الفرعية
  const handleToolKeyDown = (e: React.KeyboardEvent<HTMLAnchorElement>, index: number) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      for (let i = index + 1; i < toolRefs.current.length; i++) {
        if (toolRefs.current[i]) {
          toolRefs.current[i]?.focus();
          return;
        }
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      for (let i = index - 1; i >= 0; i--) {
        if (toolRefs.current[i]) {
          toolRefs.current[i]?.focus();
          return;
        }
      }
      // إذا كنا في أول عنصر، نرجع الفوكس إلى الزر الأب
      planningButtonRef.current?.focus();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsPlanningOpen(false);
      planningButtonRef.current?.focus();
    }
  };

  // العناصر التي تسبق "التخطيط"
  const navItemsBefore = [
    { name: 'الرئيسية', href: '/dashboard/Overview', icon: LayoutDashboard },
    ...(isAdminOrOwner ? [{ name: 'الأقسام', href: '/dashboard/Departments', icon: Building2 }] : []),
    { name: 'الخطط التشغيلية', href: '/dashboard/Plans', icon: Briefcase },
  ];

  // العناصر التي تلي "التخطيط"
  const navItemsAfter = [
    { name: 'مشاريعي', href: '/dashboard/Projects', icon: FolderGit2 },
    { name: 'الدردشة', href: '/dashboard/Chat', icon: MessageSquare, badge: totalUnreadCount },
    { name: 'التقارير', href: '/dashboard/Reports', icon: FileText },
  ];

  const renderStandardItem = (item: {
    name: string;
    href: string;
    icon: LucideIcon;
    badge?: number;
  }) => {
    const isActive = router.pathname.includes(item.href);
    const Icon = item.icon;

    return (
      <Link
        key={item.name}
        href={item.href}
        onClick={onItemClick}
        className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
          isActive
            ? 'bg-blue-50 text-blue-700 font-semibold'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >
        <div className="flex items-center gap-3">
          <Icon size={20} className={isActive ? 'text-blue-600' : 'text-gray-400'} />
          <span>{item.name}</span>
        </div>
        {item.badge && item.badge > 0 ? (
          <span className="px-2 py-0.5 text-xs font-bold bg-blue-600 text-white rounded-full">
            {item.badge}
          </span>
        ) : null}
      </Link>
    );
  };

  return (
    <nav className={`space-y-1.5 ${className}`} aria-label="شريط التنقل الرئيسي">
      {/* العناصر قبل التخطيط */}
      {navItemsBefore.map(renderStandardItem)}

      {/* عنصر قائمة "التخطيط" المنسدلة — يظهر فقط إذا وُجدت أدوات متاحة */}
      {tools.length > 0 && (
        <div className="relative">
          <button
            ref={planningButtonRef}
            type="button"
            id="planning-menu-button"
            aria-expanded={isPlanningOpen}
            aria-controls="planning-tools-subnav"
            aria-haspopup="true"
            onClick={togglePlanning}
            onKeyDown={handleParentKeyDown}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              isPlanningActive
                ? 'bg-blue-50 text-blue-700 font-semibold'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <Compass
                size={20}
                className={isPlanningActive ? 'text-blue-600' : 'text-gray-400'}
                aria-hidden="true"
              />
              <span className="text-sm">التخطيط</span>
            </div>
            <ChevronDown
              size={18}
              aria-hidden="true"
              className={`text-gray-400 transition-transform duration-200 ease-in-out motion-reduce:transition-none ${
                isPlanningOpen ? 'rotate-180 text-blue-600' : ''
              }`}
            />
          </button>

          {/* القائمة الفرعية مع خط الشجرة (Tree Line) وحركة انسدال سلسة */}
          <div
            id="planning-tools-subnav"
            role="region"
            aria-labelledby="planning-menu-button"
            className={`overflow-hidden transition-all duration-300 ease-in-out motion-reduce:transition-none ${
              isPlanningOpen
                ? 'max-h-[500px] opacity-100 mt-1 mb-1'
                : 'max-h-0 opacity-0 pointer-events-none'
            }`}
          >
            <div className="mr-5 pr-3 border-r-2 border-slate-200 space-y-1 py-1">
              {tools.map((tool, idx) => {
                const active = isToolActive(tool);
                const isSoon = tool.status === 'soon';
                const ToolIcon = tool.icon;
                const navPath = getToolNavPath(tool);

                if (isSoon) {
                  return (
                    <div
                      key={tool.slug}
                      className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-gray-400 cursor-not-allowed select-none bg-gray-50/50"
                      title="هذه الأداة قادمة قريباً"
                      aria-disabled="true"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <ToolIcon size={16} className="text-gray-400 shrink-0" aria-hidden="true" />
                        <span className="truncate">{tool.name}</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-400 font-normal shrink-0">
                        قريباً
                      </span>
                    </div>
                  );
                }

                return (
                  <Link
                    key={tool.slug}
                    href={navPath}
                    ref={(el) => {
                      toolRefs.current[idx] = el;
                    }}
                    onClick={onItemClick}
                    onKeyDown={(e) => handleToolKeyDown(e, idx)}
                    className={`group flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      active
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <ToolIcon
                        size={16}
                        aria-hidden="true"
                        className={`shrink-0 transition-colors ${
                          active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                        }`}
                      />
                      <span className="truncate">{tool.name}</span>
                    </div>
                    {tool.status === 'beta' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-normal shrink-0">
                        تجريبي
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* العناصر بعد التخطيط */}
      {navItemsAfter.map(renderStandardItem)}
    </nav>
  );
};
