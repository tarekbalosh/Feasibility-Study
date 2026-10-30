import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useOrgMembers } from '@/hooks/useOrg';
import {
  Search,
  X,
  Check,
  ChevronDown,
  UserCheck,
  UserX,
  Sparkles,
  Crown,
  Shield,
} from 'lucide-react';

interface Member {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  workspaceRole: string;
}

interface DepartmentManagerSelectProps {
  selectedMemberId: string | null;
  onSelect: (memberId: string | null) => void;
  label?: string;
}

const AVATAR_PALETTES = [
  { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200' },
  { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
  { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' },
  { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
  { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200' },
  { bg: 'bg-sky-100', text: 'text-sky-700', border: 'border-sky-200' },
  { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-200' },
];

function getAvatarPalette(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[index];
}

export function DepartmentManagerSelect({
  selectedMemberId,
  onSelect,
  label = 'مدير القسم',
}: DepartmentManagerSelectProps) {
  const { data: members = [], isLoading } = useOrgMembers();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // العضو المختار حالياً
  const selectedMember = useMemo(() => {
    return members.find((m: Member) => m.id === selectedMemberId) || null;
  }, [members, selectedMemberId]);

  // تصفية الأعضاء بحسب البحث
  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m: Member) => {
      const name = (m.name || '').toLowerCase();
      const email = (m.email || '').toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [members, search]);

  // إغلاق القائمة عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // التركيز التلقائي على حقل البحث عند فتح القائمة
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 60);
    }
  }, [isOpen]);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80">
            <Crown size={11} className="text-amber-600" />
            مالك
          </span>
        );
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80">
            <Shield size={11} className="text-indigo-600" />
            مشرف
          </span>
        );
      case 'viewer':
        return (
          <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200/80">
            مُطّلع
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/80">
            عضو
          </span>
        );
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const selectedPalette = selectedMember
    ? getAvatarPalette(selectedMember.name || selectedMember.email)
    : AVATAR_PALETTES[0];

  return (
    <div className="space-y-1.5 relative" ref={containerRef} dir="rtl">
      {/* الترويسة والشارة */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-gray-800">
          {label}
        </label>
        <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-medium">
          اختياري
        </span>
      </div>

      {/* بطاقة العضو المختار حالياً */}
      {selectedMember ? (
        <div className="p-3 bg-gradient-to-r from-indigo-50/50 via-white to-indigo-50/30 border border-indigo-200/90 rounded-xl shadow-xs transition-all flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 overflow-hidden min-w-0">
            {/* الصورة الرمزية */}
            <div
              className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-xs shadow-xs border ${selectedPalette.bg} ${selectedPalette.text} ${selectedPalette.border}`}
            >
              {selectedMember.avatarUrl ? (
                <img
                  src={selectedMember.avatarUrl}
                  alt={selectedMember.name}
                  className="h-full w-full object-cover rounded-xl"
                />
              ) : (
                getInitials(selectedMember.name)
              )}
              <div
                className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center"
                title="نشط"
              >
                <Check size={9} className="text-white stroke-[3]" />
              </div>
            </div>

            {/* تفاصيل العضو */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-gray-900 truncate">
                  {selectedMember.name}
                </span>
                {getRoleBadge(selectedMember.workspaceRole)}
              </div>
              <span className="text-xs text-gray-500 font-mono block truncate mt-0.5">
                {selectedMember.email}
              </span>
            </div>
          </div>

          {/* أزرار الإجراء السريع */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setIsOpen(prev => !prev);
                setSearch('');
              }}
              className="px-2.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200/70"
            >
              تغيير
            </button>
            <button
              type="button"
              onClick={() => {
                onSelect(null);
                setIsOpen(false);
                setSearch('');
              }}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="إزالة المدير"
              aria-label="إزالة المدير"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ) : (
        /* زر اختيار مدير في حال لم يتم التحديد */
        <button
          type="button"
          onClick={() => {
            setIsOpen(prev => !prev);
            setSearch('');
          }}
          className={`w-full flex items-center justify-between p-3 rounded-xl border bg-white text-right transition-all duration-150 group shadow-xs ${
            isOpen
              ? 'border-indigo-500 ring-2 ring-indigo-500/20'
              : 'border-gray-200 hover:border-indigo-300 hover:bg-slate-50/50'
          }`}
          aria-expanded={isOpen}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
              <UserCheck size={18} />
            </div>
            <div className="min-w-0">
              <span className="block text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">
                تعيين مدير للقسم...
              </span>
              <span className="block text-xs text-gray-400 truncate">
                اختر عضواً يتولى الإشراف وإنشاء الخطط
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-gray-400 shrink-0">
            <ChevronDown
              size={18}
              className={`transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-indigo-600' : 'group-hover:text-gray-600'
              }`}
            />
          </div>
        </button>
      )}

      {/* القائمة المنبثقة لاختيار العضو */}
      {isOpen && (
        <div className="absolute z-50 right-0 left-0 mt-2 bg-white rounded-2xl border border-gray-200 shadow-2xl shadow-indigo-950/15 overflow-hidden ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-150">
          {/* شريط البحث المدمج في الترويسة */}
          <div className="p-2.5 border-b border-gray-100 bg-gray-50/70 flex items-center gap-2">
            <Search size={16} className="text-gray-400 shrink-0 mr-1" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث بالاسم أو البريد الإلكتروني..."
              className="w-full bg-transparent text-xs text-gray-800 placeholder-gray-400 outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-md"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* قائمة الخيارات */}
          <div className="max-h-56 overflow-y-auto divide-y divide-gray-50 py-1">
            {/* خيار بدون مدير */}
            <button
              type="button"
              onClick={() => {
                onSelect(null);
                setIsOpen(false);
                setSearch('');
              }}
              className={`w-full flex items-center justify-between p-2.5 px-3 text-right hover:bg-gray-50 transition-colors ${
                selectedMemberId === null ? 'bg-indigo-50/50' : ''
              }`}
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                  <UserX size={16} />
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-700 block">بدون مدير حالياً</span>
                  <span className="text-[11px] text-gray-400 block">تحديد لاحقاً من قبل المالك أو المشرف</span>
                </div>
              </div>
              {selectedMemberId === null && (
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white">
                  <Check size={12} className="stroke-[3]" />
                </div>
              )}
            </button>

            {isLoading ? (
              <div className="py-6 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <span>جاري تحميل أعضاء الفريق...</span>
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="py-6 text-center px-4">
                <p className="text-xs text-gray-500">لا توجد نتائج تطابق بحثك</p>
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="mt-1 text-[11px] text-indigo-600 hover:underline"
                >
                  مسح كلمة البحث
                </button>
              </div>
            ) : (
              filteredMembers.map((m: Member) => {
                const isSelected = m.id === selectedMemberId;
                const palette = getAvatarPalette(m.name || m.email);

                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      onSelect(m.id);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`w-full flex items-center justify-between p-2.5 px-3 text-right hover:bg-indigo-50/50 transition-colors group ${
                      isSelected ? 'bg-indigo-50/80' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden min-w-0">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold text-xs border ${palette.bg} ${palette.text} ${palette.border}`}
                      >
                        {m.avatarUrl ? (
                          <img
                            src={m.avatarUrl}
                            alt={m.name}
                            className="h-full w-full object-cover rounded-lg"
                          />
                        ) : (
                          getInitials(m.name)
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
                            {m.name}
                          </span>
                          {getRoleBadge(m.workspaceRole)}
                        </div>
                        <span className="text-[11px] text-gray-500 font-mono truncate block">
                          {m.email}
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white mr-2">
                        <Check size={12} className="stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* شريط توجيه في التذييل */}
          <div className="px-3 py-2 bg-slate-50/90 border-t border-gray-100 flex items-center gap-1.5 text-[11px] text-gray-500">
            <Sparkles size={13} className="text-indigo-600 shrink-0" />
            <span>يُمنح مدير القسم صلاحية إنشاء وإدارة الخطط التشغيلية للقسم.</span>
          </div>
        </div>
      )}
    </div>
  );
}

