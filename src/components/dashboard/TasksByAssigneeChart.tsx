import React from 'react';
import { Users, AlertTriangle, CheckCircle2, Circle, Clock, Timer } from 'lucide-react';
import clsx from 'clsx';

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

const SEGMENTS: { 
  key: 'completed' | 'inProgress' | 'notStarted' | 'overdue'; 
  label: string; 
  color: string; 
  badge: string;
  icon: React.ElementType;
}[] = [
  { key: 'completed', label: 'أُنجزت', color: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  { key: 'inProgress', label: 'قيد الإنجاز', color: 'bg-blue-500', badge: 'bg-blue-50 text-blue-700 border-blue-200', icon: Timer },
  { key: 'notStarted', label: 'لم تبدأ', color: 'bg-slate-300', badge: 'bg-slate-50 text-slate-600 border-slate-200', icon: Circle },
  { key: 'overdue', label: 'متأخرة', color: 'bg-red-500', badge: 'bg-red-50 text-red-700 border-red-200', icon: Clock },
];

export function TasksByAssigneeChart({ data }: { data: AssigneeWorkload[] }) {
  return (
    <section className="mb-10 animate-fade-in-up" id="tasks-by-assignee-chart">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-1">
            <Users className="text-indigo-600" size={24} />
            توزيع المهام على المسؤولين
          </h2>
          <p className="text-sm text-gray-500">
            متابعة دقيقة لحالة المهام الموكلة لكل عضو في الفريق. يُنبَّه على من لديه {fmt(OVERLOAD_OPEN_TASKS)} مهام مفتوحة أو أكثر.
          </p>
        </div>
        
        {/* مفتاح الألوان */}
        <div className="flex flex-wrap gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
          {SEGMENTS.map((s) => {
            const Icon = s.icon;
            return (
              <span key={s.key} className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                <span className={`w-3 h-3 rounded-full ${s.color}`} />
                {s.label}
              </span>
            );
          })}
        </div>
      </div>

      {data.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">لا توجد مهام مُسندة بعد</h3>
          <p className="text-gray-500">لم يتم تعيين أي مهام للمسؤولين في هذا القسم حتى الآن.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {data.map((p, idx) => {
            const open = p.total - p.completed;
            const overloaded = open >= OVERLOAD_OPEN_TASKS;

            return (
              <div 
                key={p.name} 
                className="flex flex-col bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300 transform hover:-translate-y-1"
                style={{ animationDelay: `${Math.min(idx, 8) * 50}ms` }}
              >
                {/* Header */}
                <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex justify-between items-start mb-4">
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-900 text-lg truncate" title={p.name}>
                        {p.name}
                      </h3>
                      {overloaded && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg mt-1 border border-amber-100">
                          <AlertTriangle size={12} />
                          ضغط عمل مرتفع
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col items-end shrink-0 bg-white px-3 py-1.5 rounded-xl border border-gray-100 shadow-sm">
                      <span className="text-xs text-gray-500 font-semibold mb-0.5">إجمالي المهام</span>
                      <span className="text-lg font-black text-gray-900">{fmt(p.total)}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden flex shadow-inner">
                    {SEGMENTS.map((s) => {
                      const v = p[s.key] as number;
                      if (v === 0) return null;
                      return (
                        <div
                          key={s.key}
                          className={`${s.color} h-full transition-all duration-500`}
                          style={{ width: `${(v / p.total) * 100}%` }}
                          title={`${s.label}: ${fmt(v)}`}
                        />
                      );
                    })}
                  </div>
                  
                  {/* Stats Row */}
                  <div className="flex justify-between items-center mt-3 px-1 text-center text-xs">
                    {SEGMENTS.map((s) => {
                      const v = p[s.key] as number;
                      return (
                        <div key={s.key} className={clsx("flex flex-col", v > 0 ? "text-gray-700" : "text-gray-300 opacity-50")}>
                          <span className="font-black text-sm">{fmt(v)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Tasks List */}
                <div className="flex-1 p-5 bg-white">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">
                    قائمة المهام
                  </h4>
                  
                  <ul className="space-y-3 overflow-y-auto max-h-64 pr-1 custom-scrollbar">
                    {p.tasks.length === 0 ? (
                      <li className="text-sm text-gray-500 text-center py-4">لا توجد مهام</li>
                    ) : (
                      p.tasks.map((t, i) => {
                        const seg = SEGMENTS.find((s) => s.key === t.state)!;
                        const StateIcon = seg.icon;
                        
                        return (
                          <li key={i} className="flex items-start gap-3 group">
                            <div className={`mt-0.5 shrink-0 ${seg.badge.replace('bg-', 'text-').split(' ')[1]}`}>
                              <StateIcon size={16} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-gray-800 leading-tight group-hover:text-indigo-600 transition-colors mb-1 truncate" title={t.title}>
                                {t.title}
                              </p>
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${seg.badge}`}>
                                  {seg.label}
                                </span>
                                {t.progress > 0 && t.state !== 'completed' && (
                                  <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                    {fmt(t.progress)}٪
                                  </span>
                                )}
                              </div>
                            </div>
                          </li>
                        );
                      })
                    )}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
