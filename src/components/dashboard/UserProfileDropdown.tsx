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
        {/* Trigger Button - Clean pill design */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-haspopup="true"
          className="flex items-center gap-2.5 bg-gray-50 hover:bg-gray-100 active:scale-[0.98] px-2.5 py-1.5 rounded-full border border-gray-200/80 transition-all cursor-pointer group shadow-2xs"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
            {initial}
          </div>
          <div className="flex flex-col text-right leading-tight hidden sm:flex">
            <span className="font-bold text-xs text-gray-800 truncate max-w-[130px]">
              {user?.name || workspace?.name || 'مستخدم'}
            </span>
            {workspace?.name && workspace.name !== user?.name && (
              <span className="text-[10px] text-gray-400 font-normal truncate max-w-[130px]">
                {workspace.name}
              </span>
            )}
          </div>
          <ChevronDown
            size={14}
            className={`text-gray-400 group-hover:text-gray-600 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-blue-600' : ''
            }`}
          />
        </button>

        {/* Popover Card */}
        {isOpen && (
          <div className="absolute left-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 ring-1 ring-black/5 z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden divide-y divide-gray-100">
            
            {/* 1. Header: User Profile Info */}
            <div className="p-4 bg-gradient-to-br from-blue-50/70 via-indigo-50/30 to-white">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-base flex items-center justify-center shadow-xs shrink-0 ring-2 ring-white">
                  {initial}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-gray-900 truncate">
                    {user?.name || 'مستخدم'}
                  </h3>
                  <p className="text-xs text-gray-500 font-normal truncate mt-0.5">
                    {user?.email || ''}
                  </p>
                </div>
              </div>

              {/* Current Workspace & Role Badge */}
              {workspace && (
                <div className="mt-3 flex items-center justify-between bg-white/90 backdrop-blur-xs px-2.5 py-1.5 rounded-xl border border-gray-200/70 shadow-2xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Building2 size={13} className="text-blue-600 shrink-0" />
                    <span className="text-xs font-semibold text-gray-800 truncate">
                      {workspace.name}
                    </span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold border shrink-0 ${activeRole.bg}`}>
                    {activeRole.label}
                  </span>
                </div>
              )}
            </div>

            {/* 2. Workspaces Section (تبديل مساحات العمل) */}
            <div className="p-2.5">
              <div className="flex items-center justify-between px-2 pb-1.5">
                <span className="text-xs font-bold text-gray-600 flex items-center gap-1.5">
                  <Building2 size={13} className="text-gray-400" />
                  مساحات العمل
                </span>
                <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {workspaces.length} مساحات
                </span>
              </div>

              {/* Workspace list */}
              <div className="max-h-36 overflow-y-auto space-y-1 pr-0.5">
                {workspaces.map((ws) => {
                  const isActive = ws.id === workspace?.id;
                  const isThisSwitching = switchingId === ws.id;

                  return (
                    <button
                      key={ws.id}
                      type="button"
                      disabled={isThisSwitching}
                      onClick={() => handleSwitch(ws.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-right transition-all group ${
                        isActive
                          ? 'bg-blue-50/80 text-blue-900 font-semibold'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 ${
                            isActive
                              ? 'bg-blue-600 text-white shadow-2xs'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {ws.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs truncate max-w-[150px]">
                          {ws.name}
                        </span>
                      </div>

                      <div className="shrink-0 mr-1.5">
                        {isThisSwitching ? (
                          <Loader2 size={13} className="animate-spin text-blue-600" />
                        ) : isActive ? (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-blue-700 bg-white border border-blue-200 px-1.5 py-0.5 rounded-md shadow-2xs">
                            <Check size={11} className="text-blue-600" />
                            الحالية
                          </span>
                        ) : (
                          <span className="text-[11px] text-gray-400 group-hover:text-blue-600 transition-colors flex items-center gap-0.5">
                            تبديل
                            <ChevronLeft size={12} />
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Create new workspace action */}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsModalOpen(true);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 mt-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50/70 rounded-xl transition-colors cursor-pointer text-right"
              >
                <div className="w-5 h-5 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Plus size={12} />
                </div>
                <span>إنشاء مساحة عمل جديدة</span>
              </button>
            </div>

            {/* 3. Settings & Quick Actions (الإعدادات) */}
            <div className="p-2 space-y-0.5">
              <Link
                href="/dashboard/Settings"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-gray-50 text-gray-700 hover:text-gray-900 transition-colors group text-right"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    <Settings size={15} />
                  </div>
                  <span className="text-xs font-semibold text-gray-800">
                    الإعدادات
                  </span>
                </div>
                <ChevronLeft size={13} className="text-gray-300 group-hover:text-gray-500 group-hover:-translate-x-0.5 transition-all" />
              </Link>

              <Link
                href="/dashboard/Team"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-gray-50 text-gray-700 hover:text-gray-900 transition-colors group text-right"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    <Users size={15} />
                  </div>
                  <span className="text-xs font-semibold text-gray-800">
                    فريق العمل والأعضاء
                  </span>
                </div>
                <ChevronLeft size={13} className="text-gray-300 group-hover:text-gray-500 group-hover:-translate-x-0.5 transition-all" />
              </Link>
            </div>

            {/* 4. Logout Section */}
            <div className="p-1.5">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-red-50 text-red-600 transition-colors text-right font-semibold text-xs group"
              >
                <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <LogOut size={15} />
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
