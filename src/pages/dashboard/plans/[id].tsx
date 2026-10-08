import React, { useState, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { usePlan, useGoals, useTasks } from '@/hooks/usePlans';
import { useToolRuns, useDeleteToolRun } from '@/hooks/useToolRuns';
import { Briefcase, ArrowRight, Loader2, Target, CheckSquare, FolderGit2, Calendar, LayoutList, Search, Filter, User, Eye } from 'lucide-react';
import Link from 'next/link';
import ToolRunCard from '@/components/dashboard/ToolRunCard';

export default function PlanDetails() {
  const router = useRouter();
  const { id } = router.query;
  const planId = typeof id === 'string' ? id : '';

  const { data: plan, isLoading: isLoadingPlan } = usePlan(planId, !!planId);
  const { data: toolRuns, isLoading: isLoadingRuns } = useToolRuns({ planId, enabled: !!planId });
  const { data: goals, isLoading: isLoadingGoals } = useGoals(planId);
  const { data: tasks, isLoading: isLoadingTasks } = useTasks(planId);
  const { mutate: deleteToolRun } = useDeleteToolRun();

  const [activeTab, setActiveTab] = useState<'projects' | 'goals' | 'tasks'>('projects');

  // Task filters state
  const [taskSearch, setTaskSearch] = useState('');
  const [taskStatusFilter, setTaskStatusFilter] = useState<string>('all');
  const [taskPriorityFilter, setTaskPriorityFilter] = useState<string>('all');
  const [taskGoalFilter, setTaskGoalFilter] = useState<string>('all');

  // Goal filters state
  const [goalSearch, setGoalSearch] = useState('');
  const [goalSourceFilter, setGoalSourceFilter] = useState<string>('all');

  const handleDeleteRun = (runId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا التحليل؟')) {
      deleteToolRun(runId);
    }
  };

  // Filter goals logic
  const filteredGoals = useMemo(() => {
    if (!goals) return [];
    return goals.filter((goal: any) => {
      const matchSearch = goal.title.toLowerCase().includes(goalSearch.toLowerCase()) || 
                          (goal.description && goal.description.toLowerCase().includes(goalSearch.toLowerCase()));
      const matchSource = goalSourceFilter === 'all' || goal.sourceRun?.id === goalSourceFilter;
      return matchSearch && matchSource;
    });
  }, [goals, goalSearch, goalSourceFilter]);

  // Extract unique sources for goals filter dropdown
  const goalSources = useMemo(() => {
    if (!goals) return [];
    const sources = new Map<string, { id: string, title: string, count: number }>();
    goals.forEach((g: any) => {
      if (g.sourceRun) {
        const existing = sources.get(g.sourceRun.id);
        if (existing) {
          existing.count += 1;
        } else {
          sources.set(g.sourceRun.id, { id: g.sourceRun.id, title: g.sourceRun.title, count: 1 });
        }
      }
    });
    return Array.from(sources.values());
  }, [goals]);

  // Filter tasks logic
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    const now = new Date();
    return tasks.filter((task: any) => {
      const matchSearch = task.title.toLowerCase().includes(taskSearch.toLowerCase());
      
      let matchStatus = true;
      if (taskStatusFilter !== 'all') {
        if (taskStatusFilter === 'overdue') {
          // A task is overdue if it has a due date in the past, and it is not done.
          const isOverdue = task.dueDate && new Date(task.dueDate) < now && task.status !== 'done';
          matchStatus = !!isOverdue;
        } else {
          matchStatus = task.status === taskStatusFilter;
        }
      }

      const matchPriority = taskPriorityFilter === 'all' || task.priority === taskPriorityFilter;
      const matchGoal = taskGoalFilter === 'all' || task.goal?.id === taskGoalFilter;
      return matchSearch && matchStatus && matchPriority && matchGoal;
    });
  }, [tasks, taskSearch, taskStatusFilter, taskPriorityFilter, taskGoalFilter]);

  return (
    <DashboardLayout>
      <Head>
        <title>{plan ? `${plan.name} - تفاصيل الخطة` : 'تفاصيل الخطة'} - Feasibility Suite</title>
      </Head>

      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/dashboard/Plans" 
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-600 mb-4 transition-colors font-medium"
        >
          <ArrowRight size={16} /> العودة إلى الخطط التشغيلية
        </Link>
        
        {isLoadingPlan ? (
          <div className="flex items-center gap-3">
            <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        ) : plan ? (
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Briefcase size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{plan.name}</h1>
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                  <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${plan.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                    {plan.status === 'active' ? 'نشطة' : plan.status}
                  </span>
                  {plan.department?.name && (
                    <>
                      <span>•</span>
                      <span>قسم: {plan.department.name}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            {plan.description && (
              <p className="text-gray-600 text-sm mt-4 max-w-3xl leading-relaxed">{plan.description}</p>
            )}
          </div>
        ) : (
          <div className="text-red-500 font-medium">لم يتم العثور على الخطة.</div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('projects')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'projects' ? 'border-emerald-500 text-emerald-600 bg-emerald-50/50 rounded-t-lg' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          <FolderGit2 size={18} /> المشاريع والأدوات
          <span className="ml-1 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">{toolRuns?.length || 0}</span>
        </button>
        <button
          onClick={() => setActiveTab('goals')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'goals' ? 'border-emerald-500 text-emerald-600 bg-emerald-50/50 rounded-t-lg' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          <Target size={18} /> الأهداف 
          <span className="ml-1 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">{goals?.length || 0}</span>
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'tasks' ? 'border-emerald-500 text-emerald-600 bg-emerald-50/50 rounded-t-lg' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          <CheckSquare size={18} /> المهام
          <span className="ml-1 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">{tasks?.length || 0}</span>
        </button>
      </div>

      {/* Content */}
      <div className="pb-20">
        
        {activeTab === 'goals' && (
          <div>
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
              <h2 className="text-lg font-bold text-gray-900">الأهداف الاستراتيجية للخطة</h2>
              
              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                <div className="relative flex-grow lg:flex-grow-0 lg:w-64">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="ابحث في الأهداف..."
                    value={goalSearch}
                    onChange={(e) => setGoalSearch(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition duration-150 ease-in-out"
                  />
                </div>
                
                {goalSources.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Filter size={16} className="text-gray-400" />
                    <select
                      value={goalSourceFilter}
                      onChange={(e) => setGoalSourceFilter(e.target.value)}
                      className="block w-full py-2 pl-3 pr-8 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="all">كل المصادر</option>
                      {goalSources.map((source: any) => (
                        <option key={source.id} value={source.id}>مصدر: {source.title} ({source.count})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
            
            {isLoadingGoals ? (
              <div className="flex justify-center py-12"><Loader2 className="animate-spin text-emerald-500" size={32} /></div>
            ) : filteredGoals.length > 0 ? (
              <div className="grid gap-4">
                {filteredGoals.map((goal: any, idx: number) => (
                  <div key={goal.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm shrink-0">
                          {idx + 1}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg mb-1">{goal.title}</h3>
                          {goal.description && <p className="text-gray-500 text-sm mb-3">{goal.description}</p>}
                          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-500">
                            {goal.sourceRun && (
                              <span className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                                <FolderGit2 size={14} /> مصدر: {goal.sourceRun.title}
                              </span>
                            )}
                            <span className="flex items-center gap-1.5">
                              <LayoutList size={14} /> المهام: {goal.tasksDone} / {goal.tasksCount}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Target size={14} /> نسبة الإنجاز: {Math.round(goal.progress)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center max-w-2xl mx-auto">
                <Target size={48} className="mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {goals && goals.length > 0 ? 'لا توجد أهداف مطابقة للفلتر' : 'لا توجد أهداف في الخطة'}
                </h3>
                <p className="text-gray-500">
                  {goals && goals.length > 0 ? 'جرب تغيير فلاتر البحث أو مصادر الأهداف.' : 'تم استيراد الأهداف تلقائياً من مشاريع SWOT التي تم حفظها في هذه الخطة.'}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tasks' && (
          <div>
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
              <h2 className="text-lg font-bold text-gray-900">المهام التنفيذية للخطة</h2>
              
              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                <div className="relative flex-grow lg:flex-grow-0 lg:w-64">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="ابحث في المهام..."
                    value={taskSearch}
                    onChange={(e) => setTaskSearch(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition duration-150 ease-in-out"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-gray-400" />
                  <select
                    value={taskStatusFilter}
                    onChange={(e) => setTaskStatusFilter(e.target.value)}
                    className="block w-full py-2 pl-3 pr-8 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="all">كل الحالات</option>
                    <option value="todo">لم تبدأ</option>
                    <option value="in_progress">قيد التنفيذ</option>
                    <option value="done">مكتملة</option>
                    <option value="overdue">متأخرة</option>
                  </select>

                  <select
                    value={taskPriorityFilter}
                    onChange={(e) => setTaskPriorityFilter(e.target.value)}
                    className="block w-full py-2 pl-3 pr-8 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="all">كل الأولويات</option>
                    <option value="high">أولوية قصوى</option>
                    <option value="medium">أولوية متوسطة</option>
                    <option value="low">أولوية عادية</option>
                  </select>
                  
                  {goals && goals.length > 0 && (
                    <select
                      value={taskGoalFilter}
                      onChange={(e) => setTaskGoalFilter(e.target.value)}
                      className="block w-full py-2 pl-3 pr-8 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 max-w-[150px]"
                    >
                      <option value="all">كل الأهداف</option>
                      {goals.map((g: any) => (
                        <option key={g.id} value={g.id}>{g.title.substring(0, 30)}...</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>
            
            {isLoadingTasks ? (
              <div className="flex justify-center py-12"><Loader2 className="animate-spin text-emerald-500" size={32} /></div>
            ) : filteredTasks.length > 0 ? (
              <div className="grid gap-4">
                {filteredTasks.map((task: any) => {
                  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
                  
                  return (
                    <div key={task.id} className={`bg-white rounded-xl border p-5 flex items-center justify-between gap-4 hover:shadow-sm transition-all ${task.status === 'done' ? 'border-emerald-100 bg-emerald-50/30' : isOverdue ? 'border-red-200 bg-red-50/30' : 'border-gray-200'}`}>
                      <div className="flex items-start gap-4">
                        <div className={`mt-1 flex items-center justify-center w-6 h-6 rounded-full border-2 shrink-0 ${task.status === 'done' ? 'bg-emerald-500 border-emerald-500 text-white' : task.status === 'in_progress' ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50'}`}>
                          {task.status === 'done' && <CheckSquare size={14} />}
                        </div>
                        <div>
                          <h3 className={`font-bold text-md mb-1 ${task.status === 'done' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{task.title}</h3>
                          {task.goal?.title && <p className="text-xs text-gray-500 mb-2 line-clamp-1 flex items-center gap-1.5"><Target size={12}/>الهدف المرتبط: {task.goal.title}</p>}
                          
                          {(task.assigneeName || task.followerName) && (
                            <div className="flex flex-wrap items-center gap-4 mb-3">
                              {task.assigneeName && (
                                <div className="flex items-center gap-1.5 text-xs text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                                  <User size={12} />
                                  <span>المسؤول: <strong>{task.assigneeName}</strong></span>
                                </div>
                              )}
                              {task.followerName && (
                                <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
                                  <Eye size={12} />
                                  <span>المتابع: <strong>{task.followerName}</strong></span>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex items-center gap-3 text-xs font-medium text-gray-500">
                            {task.dueDate && (
                              <span className={`flex items-center gap-1 px-2.5 py-1 rounded-lg ${isOverdue ? 'bg-red-100 text-red-700' : 'bg-gray-100'}`}>
                                <Calendar size={12} />
                                {new Date(task.dueDate).toLocaleDateString('ar-SA')}
                                {isOverdue && <span className="mr-1">(متأخرة)</span>}
                              </span>
                            )}
                            <span className={`px-2.5 py-1 rounded-lg ${task.priority === 'high' ? 'bg-red-50 text-red-700 border border-red-100' : task.priority === 'medium' ? 'bg-orange-50 text-orange-700 border border-orange-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                              {task.priority === 'high' ? 'أولوية قصوى' : task.priority === 'medium' ? 'أولوية متوسطة' : 'أولوية عادية'}
                            </span>
                            <span className={`px-2.5 py-1 rounded-lg ${task.status === 'done' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : task.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-gray-100 text-gray-700 border border-gray-200'}`}>
                              {task.status === 'done' ? 'مكتملة' : task.status === 'in_progress' ? 'قيد التنفيذ' : 'لم تبدأ'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center max-w-2xl mx-auto">
                <CheckSquare size={48} className="mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">لا توجد مهام مطابقة</h3>
                <p className="text-gray-500">جرب تغيير الفلاتر أو الكلمات البحثية.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'projects' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900">مخرجات الأدوات ضمن هذه الخطة</h2>
            </div>
            
            {isLoadingRuns ? (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-emerald-500" size={32} />
              </div>
            ) : toolRuns && toolRuns.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {toolRuns.map((run, idx) => (
                  <ToolRunCard key={run.id} run={run} onDelete={handleDeleteRun} index={idx} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center max-w-2xl mx-auto">
                <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FolderGit2 size={32} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">لا توجد مشاريع في هذه الخطة بعد</h3>
                <p className="text-gray-500">
                  قم بإنشاء تحليلات جديدة باستخدام الأدوات ليتم حفظها تلقائياً ضمن هذه الخطة.
                </p>
                <Link
                  href={`/tools?planId=${planId}`}
                  className="mt-6 inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  تصفح الأدوات للبدء
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
