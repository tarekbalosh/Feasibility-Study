import React, { useState } from 'react';
import { Users, AlertTriangle } from 'lucide-react';

export interface AssigneeWorkload {
  name: string;
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  overdue: number;
  tasks: { title: string; state: string; progress: number }[];
}

const fmt = (n: number) => n.toLocaleString('ar-EG');

/** عدد المهام المفتوحة الذي يُعدّ بعده الشخص مُثقلاً */
const OVERLOAD_OPEN_TASKS = 5;

const SEGMENTS: { key: 'completed' | 'inProgress' | 'notStarted' | 'overdue'; label: string; color: string; badge: string }[] = [
  { key: 'completed', label: 'أُنجزت', color: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700' },
  { key: 'inProgress', label: 'قيد الإنجاز', color: 'bg-blue-500', badge: 'bg-blue-50 text-blue-700' },
  { key: 'notStarted', label: 'لم تبدأ', color: 'bg-slate-300', badge: 'bg-slate-100 text-slate-600' },
  { key: 'overdue', label: 'متأخرة', color: 'bg-red-500', badge: 'bg-red-50 text-red-700' },
];

export function TasksByAssigneeChart({ data }: { data: AssigneeWorkload[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const max = Math.max(...data.map((d) => d.total), 1);

  return (
    <section className="rounded-3xl bg-white border border-gray-100 p-6 shadow-sm mb-10" id="tasks-by-assignee-chart">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="text-indigo-500" size={20} />
          توزيع المهام على المسؤولين
        </h2>
        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
          {SEGMENTS.map((s) => (
            <span key={s.key as string} className="flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-full ${s.color}`} />
              {s.label}
            </span>
          ))}
        </div>
      </div>
      <p className="text-xs text-gray-500 mb-5">
        يُنبَّه على من لديه {fmt(OVERLOAD_OPEN_TASKS)} مهام مفتوحة أو أكثر. اضغط على الاسم لعرض مهامه.
      </p>

      {data.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-500">لا توجد مهام مُسندة بعد.</div>
      ) : (
        <div className="space-y-3">
          {data.map((p) => {
            const open = p.total - p.completed;
            const overloaded = open >= OVERLOAD_OPEN_TASKS;
            const isOpen = expanded === p.name;
            return (
              <div key={p.name}>
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : p.name)}
                  className="w-full flex items-center gap-4 text-right group"
                >
                  <span className="w-36 shrink-0 truncate text-sm font-medium text-gray-800 group-hover:text-indigo-600" title={p.name}>
                    {p.name}
                  </span>
                  <span className="flex-1 h-5 rounded-full bg-gray-100 overflow-hidden flex" dir="rtl">
                    <span className="flex h-full" style={{ width: `${(p.total / max) * 100}%` }}>
                      {SEGMENTS.map((s) => {
                        const v = p[s.key] as number;
                        return v > 0 ? (
                          <span
                            key={s.key as string}
                            className={`${s.color} h-full flex items-center justify-center text-[11px] font-bold text-white transition-all duration-500`}
                            style={{ width: `${(v / p.total) * 100}%` }}
                            title={`${s.label}: ${fmt(v)}`}
                          >
                            {fmt(v)}
                          </span>
                        ) : null;
                      })}
                    </span>
                  </span>
                  <span className="w-24 shrink-0 flex items-center gap-1 justify-end text-sm font-bold text-gray-900">
                    {overloaded && (
                      <span title="لديه مهام كثيرة" className="text-amber-500">
                        <AlertTriangle size={15} />
                      </span>
                    )}
                    {fmt(p.total)} مهمة
                  </span>
                </button>
                {isOpen && (
                  <ul className="mt-2 mr-40 space-y-1.5">
                    {p.tasks.map((t, i) => {
                      const seg = SEGMENTS.find((s) => s.key === t.state)!;
                      return (
                        <li key={i} className="flex items-center gap-2 text-xs text-gray-700">
                          <span className={`rounded-full px-2 py-0.5 font-medium ${seg.badge}`}>{seg.label}</span>
                          <span>{t.title}</span>
                          {t.progress > 0 && <span className="text-gray-400">({fmt(t.progress)}٪)</span>}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
