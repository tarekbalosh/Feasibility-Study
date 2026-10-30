import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ExternalLink, Download, Loader2, Plus, Search, X, Building2, User, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getToolStartPath } from '@/config/tools.registry';
import { usePlanSheet, useAddGoalMeans } from '@/hooks/usePlans';
import * as planService from '@/services/plan.service';
import { FilterBar, FilterItemConfig, FilterValues } from '@/components/ui/filters';

// ——————————————————————————————————————————————
// PlanSheet — «الجدول الشامل» للخطة بنمط ملف Excel (RTL)
//  الصفوف تأتي مفلترة بالصلاحيات من الخادم؛ هذا المكوّن يعرض ويحفظ فقط.
// ——————————————————————————————————————————————

interface Member { id: string; name: string }

const GROUP_BG = ['#f3f9d2', '#dff3e4', '#dbeefb', '#fde9d6', '#eee1f7', '#fce6e6'];

const REF: Record<string, { label: string; cls: string }> = {
  kpi: { label: 'KPIs', cls: 'bg-amber-100 text-amber-800 border-amber-200' },
  swot: { label: 'SWOT', cls: 'bg-sky-100 text-sky-800 border-sky-200' },
  need: { label: 'الاحتياج', cls: 'bg-orange-100 text-orange-800 border-orange-200' },
};

const STATUS: Record<string, { label: string; cls: string; payload: string }> = {
  completed: { label: 'أنجزت', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200', payload: 'done' },
  overdue: { label: 'متأخرة', cls: 'bg-red-100 text-red-700 border-red-200', payload: 'in_progress' },
  in_progress: { label: 'قيد الإنجاز', cls: 'bg-blue-100 text-blue-800 border-blue-200', payload: 'in_progress' },
  not_started: { label: 'لم تبدأ', cls: 'bg-gray-100 text-gray-700 border-gray-200', payload: 'todo' },
};

const IMPORTANCE: Record<string, { label: string; cls: string; payload: string }> = {
  normal: { label: 'عادية', cls: 'bg-green-50 text-green-700 border-green-200', payload: 'low' },
  medium: { label: 'متوسطة', cls: 'bg-orange-50 text-orange-700 border-orange-200', payload: 'medium' },
  high: { label: 'عالية', cls: 'bg-red-50 text-red-700 border-red-200', payload: 'high' },
};

const num = (n: number) => new Intl.NumberFormat('en-US').format(Math.round(n || 0));

const Badge = ({ cls, children }: { cls: string; children: React.ReactNode }) => (
  <span className={`inline-block whitespace-nowrap px-2.5 py-1 rounded-md text-xs font-semibold border ${cls}`}>{children}</span>
);

interface PlanMeta { id: string; name: string; departmentName: string; canEditContent: boolean; members: Member[] }

function AddDialog({ plans, goalsByPlan, onClose }: { plans: PlanMeta[]; goalsByPlan: Record<string, { id: string; title: string }[]>; onClose: () => void }) {
  const add = useAddGoalMeans();
  const [f, setF] = useState<any>({ planId: plans[0]?.id ?? '', goalId: '', goalTitle: '', title: '', weight: 10, cost: 0, priority: 'medium', assigneeMemberId: '', followerMemberId: '', referenceType: 'kpi', referenceDetail: '', need: '', party: '' });
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));
  const input = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500';
  const goals = goalsByPlan[f.planId] ?? [];
  const members = plans.find((p) => p.id === f.planId)?.members ?? [];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.goalId && !f.goalTitle.trim()) return toast.error('اختر هدفاً أو اكتب هدفاً جديداً');
    add.mutate(
      {
        planId: f.planId,
        goalId: f.goalId || undefined,
        goal: f.goalId ? undefined : { title: f.goalTitle.trim(), referenceType: f.referenceType, referenceDetail: f.referenceDetail },
        task: f.title.trim()
          ? {
              title: f.title.trim(),
              weight: Number(f.weight) || 1,
              cost: Number(f.cost) || 0,
              priority: f.priority,
              assigneeMemberId: f.assigneeMemberId || undefined,
              followerMemberId: f.followerMemberId || undefined,
              need: f.need || undefined,
              party: f.party || undefined,
            }
          : null,
      },
      { onSuccess: onClose }
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" dir="rtl" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">إضافة هدف / مهمة</h3>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><X size={18} /></button>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {plans.length > 1 && (
            <label className="text-sm font-medium text-gray-700 sm:col-span-2">الخطة
              <select id="add-plan-select" className={input} value={f.planId} onChange={(e) => setF((p: any) => ({ ...p, planId: e.target.value, goalId: '', assigneeMemberId: '', followerMemberId: '' }))}>
                {plans.map((p) => <option key={p.id} value={p.id}>{p.departmentName} — {p.name}</option>)}
              </select>
            </label>
          )}
          <label className="text-sm font-medium text-gray-700">الهدف الحالي
            <select id="add-goal-select" className={input} value={f.goalId} onChange={(e) => set('goalId', e.target.value)}>
              <option value="">— هدف جديد —</option>
              {goals.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
            </select>
          </label>
          {!f.goalId && (
            <label className="text-sm font-medium text-gray-700">عنوان الهدف الجديد
              <input id="add-goal-title" className={input} value={f.goalTitle} onChange={(e) => set('goalTitle', e.target.value)} />
            </label>
          )}
          {!f.goalId && (
            <>
              <label className="text-sm font-medium text-gray-700">المرجع
                <select className={input} value={f.referenceType} onChange={(e) => set('referenceType', e.target.value)}>
                  <option value="kpi">KPIs</option><option value="swot">SWOT</option><option value="need">الاحتياج</option>
                </select>
              </label>
              <label className="text-sm font-medium text-gray-700">تفصيل المرجع
                <input className={input} value={f.referenceDetail} onChange={(e) => set('referenceDetail', e.target.value)} placeholder="مثال: 2 مليون" />
              </label>
            </>
          )}
        </div>

        <div className="border-t pt-4 grid sm:grid-cols-2 gap-3">
          <label className="text-sm font-medium text-gray-700 sm:col-span-2">المهمة (اختياري)
            <input id="add-means-title" className={input} value={f.title} onChange={(e) => set('title', e.target.value)} />
          </label>
          {f.title.trim() && (
            <>
              <label className="text-sm font-medium text-gray-700">الوزن النسبي %
                <input type="number" min={1} max={100} className={input} value={f.weight} onChange={(e) => set('weight', e.target.value)} />
              </label>
              <label className="text-sm font-medium text-gray-700">الموازنة
                <input type="number" min={0} className={input} value={f.cost} onChange={(e) => set('cost', e.target.value)} />
              </label>
              <label className="text-sm font-medium text-gray-700">المسؤول
                <select className={input} value={f.assigneeMemberId} onChange={(e) => set('assigneeMemberId', e.target.value)}>
                  <option value="">—</option>{members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </label>
              <label className="text-sm font-medium text-gray-700">المعني بالمتابعة
                <select className={input} value={f.followerMemberId} onChange={(e) => set('followerMemberId', e.target.value)}>
                  <option value="">—</option>{members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </label>
              <label className="text-sm font-medium text-gray-700">الأهمية
                <select className={input} value={f.priority} onChange={(e) => set('priority', e.target.value)}>
                  <option value="low">عادية</option><option value="medium">متوسطة</option><option value="high">عالية</option>
                </select>
              </label>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-100">إلغاء</button>
          <button id="add-submit" type="submit" disabled={add.isPending} className="px-5 py-2 rounded-xl text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60">
            {add.isPending ? 'جارٍ الحفظ…' : 'إضافة'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function PlanSheet({ planId, members: membersProp = [], planName, departmentName, toolRunsCount }: { planId: string | null; members?: Member[]; planName?: string; departmentName?: string; toolRunsCount?: number }) {
  const router = useRouter();

  // Read initial values from router query
  const [search, setSearch] = useState(() => (typeof router.query.search === 'string' ? router.query.search : typeof router.query.q === 'string' ? router.query.q : ''));
  const [q, setQ] = useState(search);
  const [departmentId, setDepartmentId] = useState(() => (typeof router.query.departmentId === 'string' ? router.query.departmentId : ''));
  const [assignee, setAssignee] = useState(() => (typeof router.query.assignee === 'string' ? router.query.assignee : ''));
  const [status, setStatus] = useState(() => (typeof router.query.status === 'string' ? router.query.status : ''));
  const [importance, setImportance] = useState(() => (typeof router.query.importance === 'string' ? router.query.importance : ''));

  const [showAdd, setShowAdd] = useState(false);
  const [exporting, setExporting] = useState(false);
  const allMode = planId === null;

  useEffect(() => {
    const t = setTimeout(() => setQ(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Sync filters to URL query params
  useEffect(() => {
    if (!router.isReady) return;
    const nextQuery: Record<string, any> = { ...router.query };

    if (q) nextQuery.search = q;
    else delete nextQuery.search;

    if (departmentId) nextQuery.departmentId = departmentId;
    else delete nextQuery.departmentId;

    if (assignee) nextQuery.assignee = assignee;
    else delete nextQuery.assignee;

    if (status) nextQuery.status = status;
    else delete nextQuery.status;

    if (importance) nextQuery.importance = importance;
    else delete nextQuery.importance;

    delete nextQuery.q; // normalize to 'search'

    router.push({ pathname: router.pathname, query: nextQuery }, undefined, { shallow: true });
  }, [q, departmentId, assignee, status, importance]);

  const filters = useMemo(
    () => ({ q: q || undefined, departmentId: departmentId || undefined, assignee: assignee || undefined, status: status || undefined, importance: importance || undefined }),
    [q, departmentId, assignee, status, importance]
  );

  const { data: sheet, isLoading, isError } = usePlanSheet(planId, filters);
  const rows: any[] = sheet?.rows ?? [];

  // خطط قابلة للإضافة وأعضاؤها: من الخادم في وضع «الكل»، ومن الخصائص في خطة واحدة
  const planMetas: PlanMeta[] = useMemo(() => {
    if (allMode) return (sheet?.plans ?? []).filter((p: PlanMeta) => p.canEditContent);
    return sheet?.access?.canEditContent && planId
      ? [{ id: planId, name: planName ?? sheet?.plan?.name ?? '', departmentName: departmentName ?? sheet?.plan?.department?.name ?? '', canEditContent: true, members: membersProp }]
      : [];
  }, [allMode, sheet, planId, planName, departmentName, membersProp]);

  const members: Member[] = useMemo(() => {
    if (!allMode) return membersProp;
    const m = new Map<string, Member>();
    (sheet?.plans ?? []).forEach((p: PlanMeta) => p.members.forEach((x) => m.set(x.id, x)));
    return Array.from(m.values());
  }, [allMode, sheet, membersProp]);

  const departmentOptions: { id: string; name: string }[] = useMemo(() => {
    if (!allMode) return sheet?.plan?.department ? [sheet.plan.department] : [];
    const m = new Map<string, string>();
    rows.forEach((r) => m.set(r.departmentId, r.departmentName));
    return Array.from(m, ([id, name]) => ({ id, name }));
  }, [allMode, sheet, rows]);

  const canAdd = planMetas.length > 0;
  const goalsByPlan = useMemo(() => {
    const out: Record<string, { id: string; title: string }[]> = {};
    rows.forEach((r) => {
      if (!r.goalId) return;
      const list = (out[r.planId] ??= []);
      if (!list.some((g) => g.id === r.goalId)) list.push({ id: r.goalId, title: r.goalTitle });
    });
    return out;
  }, [rows]);

  const exportXlsx = async () => {
    setExporting(true);
    try {
      const blob = await planService.exportPlanSheet(planId, filters);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `plan-${planId ?? 'all'}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('تم تصدير الملف');
    } catch {
      toast.error('تعذّر تصدير الملف');
    } finally {
      setExporting(false);
    }
  };

  const th = 'sticky top-0 z-20 bg-emerald-700 text-white text-xs font-bold px-2 py-3 border border-emerald-800/40 whitespace-nowrap';
  const td = 'border border-gray-300/70 px-2 py-2 text-center align-middle text-xs';

  const filterConfigs: FilterItemConfig[] = useMemo(() => {
    const list: FilterItemConfig[] = [];

    if (allMode && departmentOptions.length > 0) {
      list.push({
        key: 'departmentId',
        label: 'القسم',
        type: 'select',
        icon: Building2,
        isAllOptionLabel: 'كل الأقسام',
        options: departmentOptions.map((d) => ({ value: d.id, label: d.name })),
        searchThreshold: 5,
      });
    }

    list.push({
      key: 'assignee',
      label: 'المسؤول',
      type: 'select',
      icon: User,
      isAllOptionLabel: 'كل المسؤولين',
      options: members.map((m) => ({
        value: m.id,
        label: m.name,
        initials: m.name.trim().slice(0, 2),
      })),
      searchThreshold: 5,
    });

    list.push({
      key: 'status',
      label: 'الحالة',
      type: 'select',
      icon: CheckCircle2,
      isAllOptionLabel: 'كل الحالات',
      options: [
        { value: 'completed', label: 'أنجزت', dotColor: '#10B981' },
        { value: 'in_progress', label: 'قيد الإنجاز', dotColor: '#3B82F6' },
        { value: 'not_started', label: 'لم تبدأ', dotColor: '#94A3B8' },
        { value: 'overdue', label: 'متأخرة', dotColor: '#EF4444' },
      ],
    });

    list.push({
      key: 'importance',
      label: 'الأهمية',
      type: 'select',
      icon: AlertCircle,
      isAllOptionLabel: 'كل الأهميات',
      options: [
        { value: 'high', label: 'عالية', dotColor: '#EF4444' },
        { value: 'medium', label: 'متوسطة', dotColor: '#F59E0B' },
        { value: 'normal', label: 'عادية', dotColor: '#10B981' },
      ],
    });

    return list;
  }, [allMode, departmentOptions, members]);

  const currentFilterValues: FilterValues = useMemo(
    () => ({ departmentId, assignee, status, importance }),
    [departmentId, assignee, status, importance]
  );

  const handleFilterChange = (key: string, val: any) => {
    if (key === 'departmentId') setDepartmentId(val || '');
    else if (key === 'assignee') setAssignee(val || '');
    else if (key === 'status') setStatus(val || '');
    else if (key === 'importance') setImportance(val || '');
  };

  const handleClearAll = () => {
    setSearch('');
    setQ('');
    setDepartmentId('');
    setAssignee('');
    setStatus('');
    setImportance('');
  };

  const hasFilters = Boolean(q || departmentId || assignee || status || importance);

  const columnHeaders: { label: string; minWidth: string }[] = [
    { label: 'الإدارة / القسم', minWidth: 'min-w-[120px]' },
    { label: 'المرجع', minWidth: 'min-w-[80px]' },
    { label: 'تفصيل المرجع', minWidth: 'min-w-[140px]' },
    { label: 'الهدف', minWidth: 'min-w-[240px]' },
    { label: 'المهمة', minWidth: 'min-w-[180px]' },
    { label: 'وزنها النسبي', minWidth: 'min-w-[85px]' },
    { label: 'المسؤول', minWidth: 'min-w-[115px]' },
    { label: 'المعني بالمتابعة', minWidth: 'min-w-[115px]' },
    { label: 'الأهمية', minWidth: 'min-w-[95px]' },
    { label: 'الحالة', minWidth: 'min-w-[105px]' },
    { label: 'نسبة الإنجاز', minWidth: 'min-w-[90px]' },
    { label: 'نسبة إنجاز الهدف', minWidth: 'min-w-[115px]' },
    { label: 'الموازنة', minWidth: 'min-w-[100px]' },
  ];

  return (
    <div dir="rtl">
      {/* شريط الفلاتر الموحد: إضافة + بحث + فلاتر + تصدير */}
      <FilterBar
        filters={filterConfigs}
        values={currentFilterValues}
        onChange={handleFilterChange}
        onClearAll={handleClearAll}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="ابحث في الجدول..."
        totalResults={rows.length}
        resultsLabel="صف"
        isLoading={isLoading}
        extraActions={
          <div className="flex items-center gap-2">
            {canAdd && (
              <button
                id="sheet-add"
                onClick={() => setShowAdd(true)}
                className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 h-10 rounded-xl text-xs sm:text-sm font-semibold hover:bg-emerald-700 shadow-sm active:scale-95 transition-all shrink-0"
              >
                <Plus size={16} /> إضافة هدف / مهمة
              </button>
            )}
            <button
              id="sheet-export"
              onClick={exportXlsx}
              disabled={exporting || rows.length === 0}
              className="inline-flex items-center gap-2 border border-emerald-600 text-emerald-700 px-4 h-10 rounded-xl text-xs sm:text-sm font-semibold hover:bg-emerald-50 disabled:opacity-50 transition-all shrink-0"
            >
              {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} تصدير إلى Excel
            </button>
          </div>
        }
      />

      {sheet?.scope === 'assigned' && (
        <p className="mb-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          تعرض هذه الصفحة المهام الموكلة إليك فقط (مسؤول أو معني بالمتابعة)، والمجاميع محسوبة عليها.
        </p>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-emerald-500" size={32} /></div>
      ) : isError ? (
        <div className="text-center py-12 text-red-600 font-medium">تعذّر تحميل الجدول.</div>
      ) : rows.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
          <h3 className="text-lg font-bold text-gray-900 mb-2">{hasFilters ? 'لا توجد صفوف مطابقة' : 'لا توجد صفوف لعرضها'}</h3>
          <p className="text-gray-500 text-sm">{hasFilters ? 'جرّب تغيير البحث أو الفلاتر.' : 'ستظهر هنا الأهداف والمهام المصرّح لك برؤيتها.'}</p>
        </div>
      ) : (
        <div className="overflow-auto max-h-[72vh] rounded-xl border border-gray-300 bg-white shadow-sm">
          <table id="plan-sheet-table" className="w-full border-collapse min-w-[1400px]">
            <thead>
              <tr>
                {columnHeaders.map((col) => (
                  <th key={col.label} className={`${th} ${col.minWidth}`}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const bg = { backgroundColor: GROUP_BG[r.groupIndex % GROUP_BG.length] };
                const span = r.isGroupStart ? { rowSpan: r.groupSize } : null;
                const ref = r.referenceType ? REF[r.referenceType] : null;
                const openHref = r.sourceRun ? `${getToolStartPath(r.sourceRun.toolSlug)}?run=${r.sourceRun.id}` : null;
                const gs = r.isGroupStart ? `border-t-2 border-t-gray-400/60` : '';

                return (
                  <tr key={r.rowId} style={bg} className={gs}>
                    {span && (
                      <td {...span} style={bg} className={`${td} font-semibold`}>
                        <div>{r.departmentName}</div>
                        {allMode && r.planName && (
                          <div className="text-[10px] text-gray-500 font-normal mt-0.5" title={`خطة: ${r.planName}`}>
                            خطة: {r.planName}
                          </div>
                        )}
                      </td>
                    )}
                    {span && <td {...span} style={bg} className={td}>{ref ? <Badge cls={ref.cls}>{ref.label}</Badge> : '—'}</td>}
                    {span && (
                      <td {...span} style={bg} className={td}>
                        {openHref ? (
                          <Link href={openHref} className="inline-flex items-center gap-1 text-emerald-700 font-semibold hover:underline" title={`فتح تحليل: ${r.sourceRun.title}`}>
                            {r.referenceDetail || r.sourceRun.title} <ExternalLink size={12} />
                          </Link>
                        ) : (r.referenceDetail || '—')}
                      </td>
                    )}
                    {span && <td {...span} style={bg} className={`${td} font-semibold text-right leading-relaxed`}>{r.goalTitle ?? '—'}</td>}
                    <td className={`${td} text-right leading-relaxed`} title={r.dueDate ? `الاستحقاق: ${new Date(r.dueDate).toLocaleDateString('ar-SA')}` : undefined}>
                      {r.meansTitle ?? <span className="text-gray-400">— بلا مهام —</span>}
                    </td>
                    <td className={td}>{r.weight === null || r.weight === undefined ? '' : `${r.weight}%`}</td>
                    <td className={td}>{r.assigneeName || '—'}</td>
                    <td className={td}>{r.followerName || '—'}</td>
                    <td className={td}>
                      {r.importance && IMPORTANCE[r.importance] ? (
                        <Badge cls={IMPORTANCE[r.importance].cls}>{IMPORTANCE[r.importance].label}</Badge>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className={td}>
                      {r.status && STATUS[r.status] ? (
                        <Badge cls={STATUS[r.status].cls}>{STATUS[r.status].label}</Badge>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className={td}>
                      {r.progress !== null && r.progress !== undefined ? `${r.progress}%` : '—'}
                    </td>
                    {span && (
                      <td {...span} style={bg} className={`${td} font-bold`}>
                        <div className="flex flex-col items-center gap-1">
                          <span>{r.goalProgress}%</span>
                          <span className="w-14 h-1.5 rounded-full bg-white/70 overflow-hidden"><span className="block h-full bg-emerald-500" style={{ width: `${r.goalProgress}%` }} /></span>
                        </div>
                      </td>
                    )}
                    <td className={`${td} font-semibold`}>
                      {r.taskId ? num(r.budget) : ''}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={12} className="sticky bottom-0 z-10 bg-emerald-100 border border-gray-300 px-4 py-2.5 text-sm font-bold text-emerald-900 text-center">مجموع الموازنة</td>
                <td id="sheet-total" className="sticky bottom-0 z-10 bg-emerald-100 border border-gray-300 px-2 py-2.5 text-sm font-bold text-emerald-900 text-center">{num(sheet?.totals?.budget ?? 0)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {typeof toolRunsCount === 'number' && toolRunsCount > 0 && (
        <p className="mt-3 text-xs text-gray-500">المراجع المرتبطة بتحليلات الأدوات (SWOT وغيرها) تفتح مباشرة بالنقر على «تفصيل المرجع».</p>
      )}

      {showAdd && <AddDialog plans={planMetas} goalsByPlan={goalsByPlan} onClose={() => setShowAdd(false)} />}
    </div>
  );
}
