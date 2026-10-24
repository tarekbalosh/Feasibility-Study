import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  User as UserIcon,
  Building2,
  Settings,
  Users,
  LogOut,
  ChevronDown,
  ChevronLeft,
  Plus,
  Check,
  Shield,
  Loader2,
  X,
  Sparkles,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import * as workspaceService from '@/services/workspace.service';

const QUICK_INDUSTRIES = ['تجاري', 'صناعي', 'خدمي', 'تقني', 'أخرى'];

export const UserProfileDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [newWsIndustry, setNewWsIndustry] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  const { user, logout } = useAuth();
  const { workspace, workspaces, switchWorkspace, setWorkspace, refresh } = useWorkspace();

  // Close on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setIsModalOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleLogout = () => {
    setIsOpen(false);
    logout();
  };

  const handleSwitch = async (targetId: string) => {
    if (targetId === workspace?.id) {
      setIsOpen(false);
      return;
    }
    setSwitchingId(targetId);
    try {
      await switchWorkspace(targetId);
    } finally {
      setSwitchingId(null);
      setIsOpen(false);
    }
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newWsName.trim();
    if (trimmed.length < 2) {
      setCreateError('يرجى كتابة اسم مساحة العمل (حرفان على الأقل).');
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      const result = await workspaceService.createWorkspace({
        name: trimmed,
        industry: newWsIndustry || undefined,
      });

      setWorkspace(result.workspace);
      toast.success(`تم إنشاء مساحة «${result.workspace.name}» بنجاح والتحويل إليها 🎉`);

      setIsModalOpen(false);
      setIsOpen(false);
      setNewWsName('');
      setNewWsIndustry('');

      await refresh();
      await switchWorkspace(result.workspace.id);
    } catch (err: any) {
      const msg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        'تعذّر إنشاء مساحة العمل. حاول مرة أخرى.';
      setCreateError(msg);
      toast.error(msg);
    } finally {
      setIsCreating(false);
    }
  };

  const getRoleBadge = (role?: string) => {
    switch (role?.toLowerCase()) {
      case 'owner':
        return { label: 'المالك', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'admin':
        return { label: 'مشرف', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'member':
        return { label: 'عضو', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'viewer':
        return { label: 'مشاهد', bg: 'bg-gray-50 text-gray-700 border-gray-200' };
      default:
        return { label: 'عضو', bg: 'bg-gray-50 text-gray-700 border-gray-200' };
    }
  };

  const initial = user?.name
    ? user.name.trim().charAt(0).toUpperCase()
    : user?.email
    ? user.email.charAt(0).toUpperCase()
    : 'U';

  const activeRole = getRoleBadge(workspace?.role);

  return (
    <>
      <div className="relative inline-block text-right" ref={menuRef} dir="rtl">
        {/* Trigger Button - Matches existing pill design */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-haspopup="true"
          className="flex items-center gap-2.5 bg-gray-50 hover:bg-gray-100/90 active:scale-[0.98] px-3 py-1.5 rounded-full border border-gray-200/80 transition-all cursor-pointer group shadow-2xs"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
            {initial}
          </div>
          <div className="flex flex-col text-right leading-tight hidden sm:flex">
            <span className="font-bold text-sm text-gray-800 truncate max-w-[140px]">
              {user?.name || workspace?.name || 'مستخدم'}
            </span>
            {workspace?.name && (
              <span className="text-[11px] text-gray-400 font-normal truncate max-w-[140px]">
                {workspace.name}
              </span>
            )}
          </div>
          <ChevronDown
            size={15}
            className={`text-gray-400 group-hover:text-gray-600 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-blue-600' : ''
            }`}
          />
        </button>

        {/* Popover Card */}
        {isOpen && (
          <div className="absolute left-0 mt-2.5 w-88 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 ring-1 ring-black/5 divide-y divide-gray-100 z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
            
            {/* 1. Header: Profile Info (Google Account Style) */}
            <div className="bg-gradient-to-b from-blue-50/70 via-indigo-50/20 to-white p-5 text-center">
              <div className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xl flex items-center justify-center mx-auto shadow-md ring-4 ring-white mb-3">
                {initial}
              </div>

              <h3 className="font-bold text-base text-gray-900 leading-tight">
                {user?.name || 'مستخدم'}
              </h3>
              <p className="text-xs text-gray-500 font-medium truncate mt-0.5 px-2">
                {user?.email || ''}
              </p>

              {/* Current Workspace & Role Badge */}
              {workspace && (
                <Link
                  href="/dashboard/Overview"
                  onClick={() => setIsOpen(false)}
                  title={`الانتقال إلى لوحة تحكم ${workspace.name}`}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white border border-gray-200/80 text-gray-700 shadow-2xs hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-700 transition-colors cursor-pointer"
                >
                  <Building2 size={13} className="text-blue-600 shrink-0" />
                  <span className="truncate max-w-[200px] font-bold text-gray-800">
                    {workspace.name}
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className={`text-[11px] px-1.5 py-0.2 rounded font-bold border ${activeRole.bg}`}>
                    {activeRole.label}
                  </span>
                </Link>
              )}
            </div>

            {/* 2. Workspaces Section (الانتقال إلى مساحة عمل أخرى) */}
            <div className="py-2.5">
              <div className="flex items-center justify-between px-4 pb-2">
                <span className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
                  <Building2 size={14} className="text-gray-400" />
                  مساحات العمل
                </span>
                <span className="text-[11px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {workspaces.length} مساحات
                </span>
              </div>

              {/* Workspace list */}
              <div className="max-h-44 overflow-y-auto px-2 space-y-1">
                {workspaces.map((ws) => {
                  const isActive = ws.id === workspace?.id;
                  const wsRole = getRoleBadge(ws.role);
                  const isThisSwitching = switchingId === ws.id;

                  return (
                    <button
                      key={ws.id}
                      type="button"
                      disabled={isThisSwitching}
                      onClick={() => handleSwitch(ws.id)}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-right transition-all group ${
                        isActive
                          ? 'bg-blue-50/80 border border-blue-200/80 text-blue-900 font-semibold'
                          : 'hover:bg-gray-50 text-gray-700 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                            isActive
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-gray-100 text-gray-600 group-hover:bg-white group-hover:border group-hover:border-gray-200'
                          }`}
                        >
                          {ws.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-gray-900 truncate max-w-[200px]">
                            {ws.name}
                          </span>
                          <span className="text-[10px] text-gray-400 font-normal">
                            {wsRole.label}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 mr-2">
                        {isThisSwitching ? (
                          <Loader2 size={15} className="animate-spin text-blue-600" />
                        ) : isActive ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-white/90 border border-blue-200 px-2 py-0.5 rounded-md">
                            <Check size={13} className="text-blue-600" />
                            الحالية
                          </span>
                        ) : (
                          <span className="text-[11px] text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all flex items-center gap-0.5">
                            تبديل
                            <ChevronLeft size={13} />
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Create new workspace action */}
              <div className="px-2 pt-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setIsModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50/80 rounded-xl transition-colors group cursor-pointer text-right"
                >
                  <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                    <Plus size={14} />
                  </div>
                  <span>إنشاء مساحة عمل جديدة</span>
                </button>
              </div>
            </div>

            {/* 3. Settings & Quick Actions (الإعدادات) */}
            <div className="p-2 space-y-0.5">
              <Link
                href="/dashboard/Settings"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50 text-gray-700 hover:text-gray-900 transition-colors group text-right"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    <Settings size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-800">
                      إعدادات مساحة العمل
                    </span>
                    <span className="text-[10px] text-gray-400">
                      بيانات المنشأة، التفضيلات، الأمان
                    </span>
                  </div>
                </div>
                <ChevronLeft size={14} className="text-gray-300 group-hover:text-gray-500 group-hover:-translate-x-0.5 transition-all" />
              </Link>

              <Link
                href="/dashboard/Team"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50 text-gray-700 hover:text-gray-900 transition-colors group text-right"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    <Users size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-800">
                      فريق العمل والأعضاء
                    </span>
                    <span className="text-[10px] text-gray-400">
                      دعوة الأعضاء وإدارة الصلاحيات
                    </span>
                  </div>
                </div>
                <ChevronLeft size={14} className="text-gray-300 group-hover:text-gray-500 group-hover:-translate-x-0.5 transition-all" />
              </Link>
            </div>

            {/* 4. Logout Section */}
            <div className="p-2">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-red-50 text-red-600 transition-colors text-right font-bold text-xs group"
              >
                <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <LogOut size={16} />
                </div>
                <span>تسجيل الخروج</span>
              </button>
            </div>

          </div>
        )}
      </div>

      {/* Quick Create Workspace Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200 relative">
            
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 left-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <Building2 size={22} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900 leading-tight">
                  إنشاء مساحة عمل جديدة
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  أضف مساحة لشركة جديدة أو فرع أو مشروع، والتبديل بينها بسهولة
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateWorkspace} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  اسم مساحة العمل / الشركة <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="مثال: شركة الحلول الذكية، فرع جدة..."
                  value={newWsName}
                  onChange={(e) => {
                    setNewWsName(e.target.value);
                    if (createError) setCreateError(null);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all placeholder:text-gray-400"
                />
                {createError && (
                  <p className="text-xs text-red-500 mt-1">{createError}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  نوع النشاط (اختياري)
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {QUICK_INDUSTRIES.map((ind) => (
                    <button
                      key={ind}
                      type="button"
                      onClick={() => setNewWsIndustry(ind === newWsIndustry ? '' : ind)}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                        newWsIndustry === ind
                          ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-2xs'
                          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {ind}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  disabled={isCreating || newWsName.trim().length < 2}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>جارٍ الإنشاء...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      <span>إنشاء والتبديل إليها</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-center pt-1">
                <Link
                  href="/workspace/create"
                  onClick={() => setIsModalOpen(false)}
                  className="text-[11px] font-medium text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  أو فتح صفحة الإعداد الكامل مع دعوات الفريق
                  <ChevronLeft size={12} />
                </Link>
              </div>
            </form>

          </div>
        </div>
      )}
    </>
  );
};

export default UserProfileDropdown;
