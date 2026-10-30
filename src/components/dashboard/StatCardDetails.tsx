import React from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { DEPARTMENT_COLOR_MAP } from '@/components/departments/DepartmentDrawer';
import { useChat } from '@/context/ChatContext';
import { StatCardEmpty } from './StatCard';
import { StatPillList, type PillItem } from './StatPills';

const NEUTRAL_DOT = 'bg-gray-300';

const dotFor = (color: string | null | undefined, fallback = NEUTRAL_DOT) =>
  (color && DEPARTMENT_COLOR_MAP[color]?.dot) || fallback;

// ——————————————————————————————————————————————
// الأقسام
// ——————————————————————————————————————————————

interface DepartmentsCardDetailsProps {
  departments: Array<{ id: string; name: string; color?: string | null }>;
  onDepartmentClick: (id: string) => void;
  canCreateDepartment: boolean;
}

export function DepartmentsCardDetails({
  departments,
  onDepartmentClick,
  canCreateDepartment,
}: DepartmentsCardDetailsProps) {
  if (!departments || departments.length === 0) {
    return (
      <StatCardEmpty>
        <span>لا توجد أقسام بعد</span>
        {canCreateDepartment && (
          <Link
            href="/dashboard/Departments"
            className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-semibold transition-colors focus:outline-none focus-visible:underline"
          >
            <Plus size={13} />
            <span>إضافة قسم</span>
          </Link>
        )}
      </StatCardEmpty>
    );
  }

  const items: PillItem[] = departments.map((d) => ({
    id: d.id,
    label: d.name,
    href: `/dashboard/departments/${d.id}`,
    dotClass: dotFor(d.color, 'bg-indigo-500'),
    onSelect: () => onDepartmentClick(d.id),
  }));

  return (
    <StatPillList
      items={items}
      overflowAfter={6}
      maxVisible={5}
      moreAriaLabel={(n) => `عرض ${n} أقسام أخرى`}
    />
  );
}

// ——————————————————————————————————————————————
// الخطط النشطة
// ——————————————————————————————————————————————

export interface ActivePlanItem {
  id: string;
  name: string;
  progress: number;
  /** null = القسم خارج أقسام العضو → نقطة محايدة */
  color: string | null;
}

export function PlansCardDetails({ plans }: { plans: ActivePlanItem[] }) {
  if (!plans || plans.length === 0) {
    return (
      <StatCardEmpty>
        <span>لا توجد خطط نشطة بعد</span>
      </StatCardEmpty>
    );
  }

  const items: PillItem[] = plans.map((p) => ({
    id: p.id,
    label: p.name,
    href: `/dashboard/plans/${p.id}`,
    dotClass: dotFor(p.color),
    progress: Math.round(p.progress || 0),
    progressClass: 'bg-emerald-500',
    trailing: `${Math.round(p.progress || 0)}%`,
  }));

  return (
    <StatPillList
      items={items}
      overflowAfter={5}
      maxVisible={5}
      moreAriaLabel={(n) => `عرض ${n} خطط أخرى`}
    />
  );
}

// ——————————————————————————————————————————————
// الأعضاء
// ——————————————————————————————————————————————

export interface MemberPreviewItem {
  id: string;
  userId: string | null;
  name: string;
  workspaceRole: string;
  isSelf: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  owner: 'مالك المساحة',
  admin: 'مشرف',
  member: 'عضو',
  viewer: 'مشاهد',
};

const AVATAR_TONES = [
  'bg-indigo-100 text-indigo-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-sky-100 text-sky-700',
  'bg-violet-100 text-violet-700',
];

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '؟';
  const letters = parts.length > 1 ? parts[0][0] + parts[1][0] : parts[0][0];
  return letters.toUpperCase();
}

function toneOf(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_TONES[h % AVATAR_TONES.length];
}

function onlineText(n: number): string {
  if (n <= 0) return 'لا أحد متصل الآن';
  if (n === 1) return 'متصل واحد الآن';
  if (n === 2) return 'متصلان الآن';
  return `${n} متصلون الآن`;
}

const AVATAR_BASE =
  'flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold ring-2 ring-white transition-transform hover:z-10 hover:scale-110 focus:outline-none focus-visible:z-10 focus-visible:ring-indigo-500';

interface MembersCardDetailsProps {
  members: MemberPreviewItem[];
  total: number;
  /** معرّفات المستخدمين الظاهرين للعضو الحالي (لحساب المتصلين منهم فقط) */
  visibleUserIds: string[];
}

export function MembersCardDetails({ members, total, visibleUserIds }: MembersCardDetailsProps) {
  const { presences } = useChat();
  const onlineCount = visibleUserIds.filter((id) => presences[id]?.status === 'online').length;
  const extra = Math.max(0, total - members.length);

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center" dir="rtl">
        {members.map((m, i) => {
          const role = ROLE_LABELS[m.workspaceRole] ?? m.workspaceRole;
          const tooltip = (
            <span
              role="tooltip"
              className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-2 py-1 text-[11px] font-medium text-white opacity-0 shadow-lg transition-opacity group-hover/avatar:opacity-100 group-focus-within/avatar:opacity-100"
            >
              {m.isSelf ? `${m.name} (أنت)` : m.name} · {role}
            </span>
          );
          const isOnline = Boolean(m.userId && presences[m.userId]?.status === 'online');
          const dot = isOnline && (
            <span className="absolute -bottom-0.5 -end-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          );

          return (
            <span key={m.id} className={`group/avatar relative ${i > 0 ? '-ms-2' : ''}`}>
              {m.isSelf || !m.userId ? (
                <span className={`${AVATAR_BASE} ${toneOf(m.id)}`} aria-label={`${m.name} — ${role}`} tabIndex={0}>
                  {initialsOf(m.name)}
                </span>
              ) : (
                <Link
                  href={`/dashboard/Chat?user=${m.userId}`}
                  className={`${AVATAR_BASE} ${toneOf(m.id)}`}
                  aria-label={`محادثة مع ${m.name} — ${role}`}
                >
                  {initialsOf(m.name)}
                </Link>
              )}
              {dot}
              {tooltip}
            </span>
          );
        })}

        {extra > 0 && (
          <Link
            href="/dashboard/Team"
            className={`${AVATAR_BASE} -ms-2 bg-gray-100 text-gray-600 hover:bg-gray-200`}
            aria-label={`عرض ${extra} أعضاء آخرين`}
          >
            +{extra}
          </Link>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="inline-flex items-center gap-1.5 text-gray-500">
          <span className={`h-1.5 w-1.5 rounded-full ${onlineCount > 0 ? 'bg-emerald-500' : 'bg-gray-300'}`} />
          {onlineText(onlineCount)}
        </span>
        <Link
          href="/dashboard/Team"
          className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors focus:outline-none focus-visible:underline"
        >
          إدارة الفريق
        </Link>
      </div>
    </div>
  );
}

// ——————————————————————————————————————————————
// نسبة الإنجاز
// ——————————————————————————————————————————————

export interface DepartmentProgressItem {
  id: string;
  name: string;
  color: string | null;
  progress: number;
}

interface ProgressCardDetailsProps {
  overall: number;
  departments: DepartmentProgressItem[];
  onDepartmentClick: (id: string) => void;
}

export function ProgressCardDetails({ overall, departments, onDepartmentClick }: ProgressCardDetailsProps) {
  const pct = Math.min(100, Math.max(0, Math.round(overall || 0)));
  // كل النسب صفر: شرائح محايدة وليست بلون "إنجاز"
  const allZero = departments.every((d) => !d.progress);

  const items: PillItem[] = departments.map((d) => {
    const p = Math.round(d.progress || 0);
    return {
      id: d.id,
      label: d.name,
      href: `/dashboard/departments/${d.id}`,
      dotClass: allZero ? NEUTRAL_DOT : dotFor(d.color, 'bg-indigo-500'),
      trailing: `${p}%`,
      trailingClass: p > 0 ? 'text-emerald-600' : 'text-gray-400',
      onSelect: () => onDepartmentClick(d.id),
    };
  });

  return (
    <div className="flex flex-col gap-3">
      <div
        className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="نسبة الإنجاز الكلية"
      >
        <div
          className="h-full rounded-full bg-blue-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      {items.length === 0 ? (
        <StatCardEmpty>
          <span>لا توجد أقسام لعرض نسبها</span>
        </StatCardEmpty>
      ) : (
        <StatPillList
          items={items}
          overflowAfter={6}
          maxVisible={5}
          moreAriaLabel={(n) => `عرض ${n} أقسام أخرى`}
        />
      )}
    </div>
  );
}
