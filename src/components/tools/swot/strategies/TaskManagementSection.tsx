import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { ListChecks, Sparkles, Loader2 } from "lucide-react";
import clsx from "clsx";
import { toast } from "react-hot-toast";
import api from "@/lib/axios";
import type { SwotAnalysis, SwotStrategyKey, SwotQuadrantKey } from "@/types/swot";
import { TasksAccordion, Task } from "../tasks/TasksAccordion";
import { TasksDashboard, DashboardFilters } from "../tasks/TasksDashboard";

interface TaskManagementSectionProps {
  analysis: SwotAnalysis;
  goals: Record<string, { text: string; isAi: boolean }[]>;
  intersectionStrategies: Record<SwotStrategyKey, string[]>;
  smartifiedGoals: Record<string, string>;
  setSmartifiedGoals: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

const QUADRANT_PREFIX: Record<SwotQuadrantKey, string> = {
  strengths: "ق",
  weaknesses: "ض",
  opportunities: "ف",
  threats: "ت",
};

const STRATEGY_LABELS: Record<SwotStrategyKey, string> = {
  so: "استراتيجية هجومية (قوة × فرصة)",
  wo: "استراتيجية تطويرية (ضعف × فرصة)",
  st: "استراتيجية دفاعية (قوة × تهديد)",
  wt: "استراتيجية انكفائية (ضعف × تهديد)",
};

const ar = (value: number): string => value.toLocaleString("ar-EG");

export const TaskManagementSection: React.FC<TaskManagementSectionProps> = ({
  analysis,
  goals,
  intersectionStrategies,
  smartifiedGoals,
  setSmartifiedGoals,
}) => {
  
  // ——————————————————————————————————————————————
  // Tasks State
  // ——————————————————————————————————————————————
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [members, setMembers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [dashboardFilters, setDashboardFilters] = useState<DashboardFilters>({});

  // ——————————————————————————————————————————————
  // Goal Data Processing
  // ——————————————————————————————————————————————

  type GoalItem = { goal: string; source: string; sourceTexts: string[]; isAi?: boolean };
  const traditionalGoals: GoalItem[] = [];
  const intersectionGoals: GoalItem[] = [];

  const quadrants: SwotQuadrantKey[] = ["strengths", "weaknesses", "opportunities", "threats"];

  quadrants.forEach((quadrant) => {
    const items = analysis[quadrant] || [];

    items.forEach((item, idx) => {
      const key = `${quadrant}-${idx}`;
      const itemGoals = goals[key] || [];

      itemGoals.forEach((goalObj) => {
        if (goalObj?.text?.trim()) {
          const sourceStr = `من ${QUADRANT_PREFIX[quadrant]}${ar(idx + 1)}`;
          traditionalGoals.push({
            goal: goalObj.text.trim(),
            source: sourceStr,
            sourceTexts: [item.title],
            isAi: goalObj.isAi,
          });
        }
      });
    });
  });

  const detectIntersectionSource = (strategyText: string, analysis: SwotAnalysis, key: SwotStrategyKey): { label: string, texts: string[] } => {
    let sourceLabel = STRATEGY_LABELS[key];
    let sourceTexts: string[] = [];

    const findMatch = (quadrant: SwotQuadrantKey) => {
      const items = analysis[quadrant] || [];
      const idx = items.findIndex(item => strategyText.includes(item.title) || item.title.includes(strategyText));
      return idx !== -1 ? { idx, title: items[idx].title } : null;
    };

    if (key === "so") {
      const sMatch = findMatch("strengths");
      const oMatch = findMatch("opportunities");
      if (sMatch && oMatch) {
        sourceLabel = `استراتيجية هجومية (ق${ar(sMatch.idx + 1)} × ف${ar(oMatch.idx + 1)})`;
        sourceTexts = [`ق${ar(sMatch.idx + 1)}: ${sMatch.title}`, `ف${ar(oMatch.idx + 1)}: ${oMatch.title}`];
      } else if (sMatch) {
        sourceLabel = `استراتيجية هجومية (ق${ar(sMatch.idx + 1)} × فرصة)`;
        sourceTexts = [`ق${ar(sMatch.idx + 1)}: ${sMatch.title}`];
      } else if (oMatch) {
        sourceLabel = `استراتيجية هجومية (قوة × ف${ar(oMatch.idx + 1)})`;
        sourceTexts = [`ف${ar(oMatch.idx + 1)}: ${oMatch.title}`];
      }
    } else if (key === "wo") {
      const wMatch = findMatch("weaknesses");
      const oMatch = findMatch("opportunities");
      if (wMatch && oMatch) {
        sourceLabel = `استراتيجية تطويرية (ض${ar(wMatch.idx + 1)} × ف${ar(oMatch.idx + 1)})`;
        sourceTexts = [`ض${ar(wMatch.idx + 1)}: ${wMatch.title}`, `ف${ar(oMatch.idx + 1)}: ${oMatch.title}`];
      } else if (wMatch) {
        sourceLabel = `استراتيجية تطويرية (ض${ar(wMatch.idx + 1)} × فرصة)`;
        sourceTexts = [`ض${ar(wMatch.idx + 1)}: ${wMatch.title}`];
      } else if (oMatch) {
        sourceLabel = `استراتيجية تطويرية (ضعف × ف${ar(oMatch.idx + 1)})`;
        sourceTexts = [`ف${ar(oMatch.idx + 1)}: ${oMatch.title}`];
      }
    } else if (key === "st") {
      const sMatch = findMatch("strengths");
      const tMatch = findMatch("threats");
      if (sMatch && tMatch) {
        sourceLabel = `استراتيجية دفاعية (ق${ar(sMatch.idx + 1)} × ت${ar(tMatch.idx + 1)})`;
        sourceTexts = [`ق${ar(sMatch.idx + 1)}: ${sMatch.title}`, `ت${ar(tMatch.idx + 1)}: ${tMatch.title}`];
      } else if (sMatch) {
        sourceLabel = `استراتيجية دفاعية (ق${ar(sMatch.idx + 1)} × تهديد)`;
        sourceTexts = [`ق${ar(sMatch.idx + 1)}: ${sMatch.title}`];
      } else if (tMatch) {
        sourceLabel = `استراتيجية دفاعية (قوة × ت${ar(tMatch.idx + 1)})`;
        sourceTexts = [`ت${ar(tMatch.idx + 1)}: ${tMatch.title}`];
      }
    } else if (key === "wt") {
      const wMatch = findMatch("weaknesses");
      const tMatch = findMatch("threats");
      if (wMatch && tMatch) {
        sourceLabel = `استراتيجية انكفائية (ض${ar(wMatch.idx + 1)} × ت${ar(tMatch.idx + 1)})`;
        sourceTexts = [`ض${ar(wMatch.idx + 1)}: ${wMatch.title}`, `ت${ar(tMatch.idx + 1)}: ${tMatch.title}`];
      } else if (wMatch) {
        sourceLabel = `استراتيجية انكفائية (ض${ar(wMatch.idx + 1)} × تهديد)`;
        sourceTexts = [`ض${ar(wMatch.idx + 1)}: ${wMatch.title}`];
      } else if (tMatch) {
        sourceLabel = `استراتيجية انكفائية (ضعف × ت${ar(tMatch.idx + 1)})`;
        sourceTexts = [`ت${ar(tMatch.idx + 1)}: ${tMatch.title}`];
      }
    }

    return { label: sourceLabel, texts: sourceTexts };
  };

  const strategyKeys: SwotStrategyKey[] = ["so", "wo", "st", "wt"];
  strategyKeys.forEach((key) => {
    const strategies = intersectionStrategies[key] || [];
    strategies.forEach((strategyText) => {
      if (strategyText.trim()) {
        const { label, texts } = detectIntersectionSource(strategyText.trim(), analysis, key);
        intersectionGoals.push({ goal: strategyText.trim(), source: label, sourceTexts: texts });
      }
    });
  });

  const allGoalsList = [...traditionalGoals, ...intersectionGoals];

  // ——————————————————————————————————————————————
  // Load Tasks & Members
  // ——————————————————————————————————————————————

  const fetchTasks = useCallback(async () => {
    try {
      setIsLoadingTasks(true);
      const res = await api.get(`/swot-tasks/analysis/${analysis.id}`, { skipToast: true });
      setAllTasks(res.data?.tasks || []);
    } catch {
      // silent — tasks are optional
    } finally {
      setIsLoadingTasks(false);
    }
  }, [analysis.id]);

  const fetchMembers = useCallback(async () => {
    try {
      const wsRes = await api.get("/workspaces", { skipToast: true, silent: true });
      const wsId = wsRes.data?.current?.id;
      if (!wsId) return;
      const membersRes = await api.get(`/workspaces/${wsId}/members`, { skipToast: true, silent: true });
      const membersList = (membersRes.data?.data || [])
        .filter((m: any) => m.status === "active")
        .map((m: any) => ({
          id: m.id,
          name: m.user?.name || m.name || m.email.split("@")[0],
          email: m.email,
          role: m.role,
        }));
      setMembers(membersList);
    } catch {
      // fallback: empty members
    }
  }, []);

  // ——————————————————————————————————————————————
  // Auto-sync goals to DB
  // ——————————————————————————————————————————————
  // عند فتح الصفحة: نجلب الأهداف المحفوظة، ونُنشئ تلقائياً
  // كل هدف محلّي لم يُحفظ بعد — حتى يظهر أكورديون المهام
  // أسفل كل هدف بدون أي شرط مسبق.

  const [dbGoals, setDbGoals] = useState<{ id: string; goalText: string }[]>([]);
  const [isSyncingGoals, setIsSyncingGoals] = useState(false);

  const syncInFlightRef = useRef<Promise<void> | null>(null);

  const syncGoalsToDb = useCallback(async () => {
    if (allGoalsList.length === 0) return;
    // شغّل مزامنة واحدة فقط في كل مرة لمنع إنشاء أهداف مكررة
    if (syncInFlightRef.current) return syncInFlightRef.current;
    const run = (async () => {
    setIsSyncingGoals(true);
    try {
      // 1. جلب الأهداف الموجودة
      const res = await api.get(`/swot-goals/${analysis.id}`, { skipToast: true, silent: true });
      const existing: { id: string; goalText: string }[] = res.data?.goals || [];
      const existingTexts = new Set(existing.map((g) => g.goalText));

      // 2. إنشاء الأهداف الناقصة
      const newGoals: { id: string; goalText: string }[] = [];
      for (const g of allGoalsList) {
        if (!existingTexts.has(g.goal)) {
          try {
            const createRes = await api.post(
              `/swot-goals/${analysis.id}`,
              { goalText: g.goal },
              { skipToast: true, silent: true }
            );
            if (createRes.data?.goal) {
              newGoals.push({
                id: createRes.data.goal.id,
                goalText: createRes.data.goal.goalText,
              });
            }
          } catch {
            // skip failed — goal may already exist (race)
          }
        }
      }

      // الأقدم أولاً: نُبقي هدفاً واحداً لكل نص
      const seen = new Set<string>();
      const unique = [...existing, ...newGoals].filter((g) => {
        if (seen.has(g.goalText)) return false;
        seen.add(g.goalText);
        return true;
      });
      setDbGoals(unique);
    } catch {
      // silent — goals will just miss the accordion
    } finally {
      setIsSyncingGoals(false);
    }
    })();
    syncInFlightRef.current = run;
    try {
      await run;
    } finally {
      syncInFlightRef.current = null;
    }
  }, [analysis.id, allGoalsList.length]); // only re-run when goals list size changes

  useEffect(() => {
    syncGoalsToDb();
    fetchTasks();
    fetchMembers();
  }, [syncGoalsToDb, fetchTasks, fetchMembers]);

  // Match local goals with DB goals
  const goalMapping = useMemo(() => {
    return allGoalsList.map((g, index) => {
      // Try to find the matching DB goal by text
      const dbGoal = dbGoals.find((dg) => dg.goalText === g.goal);
      return {
        ...g,
        globalIndex: index + 1,
        dbGoalId: dbGoal?.id || null,
      };
    });
  }, [allGoalsList, dbGoals]);





  // ——————————————————————————————————————————————
  // Filtered tasks for dashboard
  // ——————————————————————————————————————————————

  const activeGoalIds = useMemo(() => {
    return new Set(goalMapping.map((g) => g.dbGoalId).filter(Boolean));
  }, [goalMapping]);

  const validTasks = useMemo(() => {
    return allTasks.filter((t) => activeGoalIds.has(t.goalId));
  }, [allTasks, activeGoalIds]);

  const filteredTasks = useMemo(() => {
    let result = [...validTasks];
    const f = dashboardFilters;
    if (f.goalIndex) result = result.filter((t) => t.goalIndex === f.goalIndex);
    if (f.assignee) result = result.filter((t) => t.assignee === f.assignee);
    if (f.follower) result = result.filter((t) => t.follower === f.follower);
    if (f.status) result = result.filter((t) => t.status === f.status);
    if (f.priority) result = result.filter((t) => t.priority === f.priority);
    if (f.dueDateFrom) result = result.filter((t) => new Date(t.dueDate) >= new Date(f.dueDateFrom!));
    if (f.dueDateTo) result = result.filter((t) => new Date(t.dueDate) <= new Date(f.dueDateTo!));
    return result;
  }, [validTasks, dashboardFilters]);

  const filteredTasksPerGoal = useMemo(() => {
    const map: Record<string, Task[]> = {};
    filteredTasks.forEach((t) => {
      if (!map[t.goalId]) map[t.goalId] = [];
      map[t.goalId].push(t);
    });
    return map;
  }, [filteredTasks]);

  const hasActiveFilters = Object.values(dashboardFilters).some(Boolean);


  const getBadgeStyle = (source: string) => {
    if (source.includes("هجومية") || source.includes("من ق")) return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
    if (source.includes("تطويرية") || source.includes("من ض")) return "bg-amber-50 text-amber-700 ring-amber-600/20";
    if (source.includes("من ف")) return "bg-sky-50 text-sky-700 ring-sky-600/20";
    if (source.includes("دفاعية") || source.includes("من ت") || source.includes("انكفائية")) return "bg-rose-50 text-rose-700 ring-rose-600/20";
    return "bg-slate-50 text-slate-600 ring-slate-500/20";
  };

  const getBadgeBg = (source: string) => {
    if (source.includes("هجومية") || source.includes("من ق")) return "bg-emerald-50";
    if (source.includes("تطويرية") || source.includes("من ض")) return "bg-amber-50";
    if (source.includes("من ف")) return "bg-sky-50";
    if (source.includes("دفاعية") || source.includes("من ت") || source.includes("انكفائية")) return "bg-rose-50";
    return "bg-slate-50";
  };

  if (traditionalGoals.length === 0 && intersectionGoals.length === 0) {
    return null;
  }

  const renderGoalsTable = (goalsList: GoalItem[], title: string, startIndex: number = 0) => {
    if (goalsList.length === 0) return null;
    return (
      <div className="mb-8 w-full">
        <h4 className="text-lg font-bold text-slate-800 mb-4">{title}</h4>
        <div className="overflow-x-auto pb-4 px-1">
          <table className="w-full text-right border-separate border-spacing-y-3">
            <thead>
              <tr>
                <th className="px-6 py-2 font-bold text-slate-400 text-[11px] uppercase tracking-wider w-20 text-center">رقم الهدف</th>
                <th className="px-6 py-2 font-bold text-slate-400 text-[11px] uppercase tracking-wider">الهدف الاستراتيجي</th>
                <th className="px-6 py-2 font-bold text-slate-400 text-[11px] uppercase tracking-wider w-48 text-center">المصدر</th>
                <th className="px-6 py-2 font-bold text-slate-400 text-[11px] uppercase tracking-wider w-36 text-center">المهام</th>
              </tr>
            </thead>
            <tbody>
              {goalsList.map((g, index) => {
                const globalIndex = startIndex + index;
                const goalInfo = goalMapping[globalIndex];
                const goalTasks = goalInfo?.dbGoalId ? (filteredTasksPerGoal[goalInfo.dbGoalId] || []) : [];
                
                // Hide goals that have no tasks IF a filter is active
                if (hasActiveFilters && goalTasks.length === 0) return null;

                return (
                  <React.Fragment key={index}>
                    <tr className="group bg-white hover:bg-sky-50/40 transition-all duration-300 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] hover:shadow-md ring-1 ring-slate-200/60 hover:ring-sky-200">
                      <td className="px-6 py-5 text-center rounded-r-2xl">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 text-slate-500 font-bold text-xs group-hover:bg-white group-hover:text-sky-600 group-hover:shadow-sm ring-1 ring-slate-200/50 transition-all">
                          {ar(globalIndex + 1)}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        {smartifiedGoals[g.goal] ? (
                          <div className="flex flex-col gap-3">
                            <p className="text-slate-800 font-bold leading-relaxed text-[15px]">
                              {smartifiedGoals[g.goal]}
                              <span className="inline-flex items-center gap-1 mx-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 align-middle whitespace-nowrap">
                                <Sparkles className="w-2.5 h-2.5" /> صياغة SMART
                              </span>
                            </p>
                            <div className="flex items-start gap-2 opacity-50 relative">
                              <div className="absolute inset-x-0 top-1/2 h-px bg-slate-400"></div>
                              <p className="text-slate-500 font-semibold leading-relaxed text-[13px]">
                                {g.goal}
                              </p>
                              {g.isAi && (
                                <span className="inline-flex shrink-0 items-center gap-1 mx-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50/50 text-indigo-600/50 border border-indigo-100/50 align-middle whitespace-nowrap relative z-10">
                                  <Sparkles className="w-2.5 h-2.5" /> توليد ذكاء
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <p className="text-slate-700 font-semibold leading-relaxed text-[14px]">
                            {g.goal}
                            {g.isAi && (
                              <span className="inline-flex items-center gap-1 mx-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 align-middle whitespace-nowrap">
                                <Sparkles className="w-2.5 h-2.5" /> توليد ذكاء
                              </span>
                            )}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-5 text-center border-b-0">
                        <div className="relative group/tooltip inline-block">
                          <span className={clsx(
                            "inline-flex items-center justify-center px-4 py-2 rounded-xl text-[12px] font-bold leading-none whitespace-nowrap ring-1 ring-inset shadow-sm transition-colors group-hover:shadow-none cursor-help",
                            getBadgeStyle(g.source)
                          )}>
                            {g.source}
                          </span>
                          {g.sourceTexts.length > 0 && (
                            <div className={clsx(
                              "absolute opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-300 bottom-full left-0 sm:left-1/2 sm:-translate-x-1/2 mb-2 w-max max-w-[260px] text-xs rounded-xl p-3 shadow-xl z-10 pointer-events-none translate-y-1 group-hover/tooltip:translate-y-0 text-right ring-1 ring-inset",
                              getBadgeStyle(g.source)
                            )}>
                              <div className="flex flex-col gap-1.5 whitespace-normal">
                                {g.sourceTexts.map((text, i) => (
                                  <span key={i} className="block leading-relaxed">{text}</span>
                                ))}
                              </div>
                              <div className={clsx("hidden sm:block absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 ring-1 ring-inset ring-[inherit]", getBadgeBg(g.source))}></div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center rounded-l-2xl border-b-0 border-r border-slate-100">
                        {goalInfo?.dbGoalId ? (
                          <TasksAccordion
                            goalId={goalInfo.dbGoalId}
                            goalIndex={globalIndex + 1}
                            goalText={g.goal}
                            tasks={goalTasks}
                            onTasksChange={() => { fetchTasks(); syncGoalsToDb(); }}
                            members={members}
                            defaultCurrency="SAR"
                          />
                        ) : isSyncingGoals ? (
                          <div className="flex items-center justify-center text-[10px] text-slate-400 gap-1.5">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            جاري الإعداد...
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <>
    <div className="mt-6 flex flex-col gap-6">

      <div className="flex flex-col gap-1.5 mb-2">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center p-2.5 bg-emerald-50/80 text-emerald-600 rounded-xl shadow-sm ring-1 ring-emerald-500/10">
            <ListChecks className="w-5 h-5" />
          </span>
          <h3 className="text-[22px] font-bold text-slate-800 tracking-tight">
            إدارة المهام الاستراتيجية
          </h3>
        </div>
        <p className="text-[15px] text-slate-500 leading-relaxed max-w-2xl text-right">
          هنا يمكنك تقسيم أهدافك الاستراتيجية إلى مهام تنفيذية قابلة للقياس، وتوزيع المهام على فريق العمل ومتابعة الإنجاز.
        </p>
      </div>

      {/* Dashboard Summary */}
      {validTasks.length > 0 && (
        <TasksDashboard
          tasks={filteredTasks}
          goalsCount={allGoalsList.length}
          defaultCurrency="SAR"
          filters={dashboardFilters}
          onFiltersChange={setDashboardFilters}
          members={members}
        />
      )}

      <div className="flex flex-col w-full">
        {renderGoalsTable(traditionalGoals, "الأهداف التقليدية", 0)}
        {renderGoalsTable(intersectionGoals, "الأهداف التقاطعية", traditionalGoals.length)}
      </div>

      <div className="mt-8 pt-8 border-t border-slate-200">
        <div className="bg-emerald-50 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 border border-emerald-100 shadow-sm relative overflow-hidden">
          <div className="absolute -left-6 -top-6 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div>
          <div className="absolute right-10 -bottom-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl"></div>
          
          <div className="flex items-start gap-4 relative z-10">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
            </div>
            <div>
              <h4 className="text-xl font-bold text-emerald-900 mb-1">اكتمل تحليل المشروع بنجاح</h4>
              <p className="text-emerald-700/80 text-sm leading-relaxed max-w-lg">
                تم استخراج الاستراتيجيات وصياغة الأهداف وإضافة المهام التنفيذية. المشروع بأكمله محفوظ الآن في لوحة التحكم بشكل آمن. يمكنك المتابعة لإدارة تقدم الخطة.
              </p>
            </div>
          </div>
          
          <div className="shrink-0 w-full sm:w-auto relative z-10">
            <a 
              href="/dashboard/Plans" 
              className="flex items-center justify-center w-full sm:w-auto gap-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02]"
            >
              الانتقال إلى لوحة التحكم
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </a>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default TaskManagementSection;
