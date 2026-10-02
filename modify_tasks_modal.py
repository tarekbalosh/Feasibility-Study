import re
import sys

with open('src/components/tools/swot/tasks/TasksAccordion.tsx', 'r') as f:
    content = f.read()

# 1. Remove quick add state and functions
content = re.sub(r'const \[quickAddText, setQuickAddText\] = useState\(""\);\n\s*const \[isQuickAdding, setIsQuickAdding\] = useState\(false\);\n', '', content)

content = re.sub(r'const handleInlineQuickAdd = useCallback.*?\}, \[quickAddText, weightSum, members, defaultCurrency, handleSaveTask\]\);\n\n', '', content, flags=re.DOTALL)

# 2. Modify the render method (from `return (` down to `);`)
new_render = '''  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="relative inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-all shadow-sm group"
      >
        <ClipboardList className="w-4 h-4 text-indigo-500" />
        {tasks.length > 0 ? "إدارة المهام" : "إضافة مهام"}
        {tasks.length > 0 && (
          <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white ring-2 ring-white shadow-sm">
            {ar(tasks.length)}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" dir="rtl">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="relative w-full max-w-6xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <div className="text-right">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-indigo-600" />
                  إدارة مهام الهدف:
                </h3>
                <p className="text-sm text-slate-600 mt-2 font-semibold bg-white px-3 py-2 rounded-lg border border-slate-200 inline-block">{goalText}</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-colors self-start">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 bg-slate-50/50 border border-dashed border-slate-200 rounded-xl text-center">
                  <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
                    <ClipboardList className="w-8 h-8 text-indigo-500" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-800 mb-2">لا توجد مهام لهذا الهدف</h4>
                  <p className="text-sm text-slate-500 mb-6 max-w-md">قم بتقسيم هدفك الاستراتيجي إلى مهام تنفيذية صغيرة قابلة للقياس لتحقيق الهدف بنجاح.</p>
                  <button
                    type="button"
                    onClick={() => { setEditingTask(null); setShowModal(true); }}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#5452F6] hover:bg-[#4338CA] text-white text-sm font-bold rounded-xl shadow-md transition-all hover:-translate-y-0.5"
                  >
                    <Plus className="w-4 h-4" />
                    إضافة أول مهمة
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {/* Tasks Table Wrapper */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                    <div className="overflow-x-auto pb-2 -mx-1 px-1">
                      <table className="w-full text-right border-separate border-spacing-y-1.5 min-w-[900px]">
                        <thead>
                          <tr>
                            <th className="px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center w-16">رقم</th>
                            <th className="px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">عنوان المهمة</th>
                            <th className="px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center w-16">الوزن</th>
                            <th className="px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-24">المسؤول</th>
                            <th className="px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-24">المتابعة</th>
                            <th className="px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center w-24">تاريخ الإنجاز</th>
                            <th className="px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center w-16">الأهمية</th>
                            <th className="px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center w-20">الحالة</th>
                            <th className="px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center w-28">الإنجاز</th>
                            <th className="px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center w-24">التكلفة</th>
                            <th className="px-3 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center w-24">إجراءات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tasks.map((task) => {
                            const pBadge = PRIORITY_BADGE[task.priority] || PRIORITY_BADGE.normal;
                            const sBadge = STATUS_BADGE[task.status] || STATUS_BADGE.not_started;

                            return (
                              <tr key={task.id} className="group bg-white hover:bg-blue-50/30 shadow-[0_1px_4px_-2px_rgba(0,0,0,0.06)] hover:shadow-md ring-1 ring-slate-200/50 hover:ring-indigo-200 transition-all duration-200">
                                <td className="px-3 py-3 text-center rounded-r-xl">
                                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-50 text-slate-500 text-[11px] font-bold ring-1 ring-slate-200/50">
                                    {ar(task.goalIndex)}.{ar(task.taskIndex)}
                                  </span>
                                </td>
                                <td className="px-3 py-3">
                                  <span className="text-[13px] font-semibold text-slate-800 leading-relaxed">{task.title}</span>
                                </td>
                                <td className="px-3 py-3 text-center">
                                  <span className="text-[12px] font-bold text-indigo-600">{ar(task.weight)}%</span>
                                </td>
                                <td className="px-3 py-3">
                                  <span className="text-[12px] text-slate-600 font-medium">{task.assignee}</span>
                                </td>
                                <td className="px-3 py-3">
                                  <span className="text-[12px] text-slate-500">{task.follower}</span>
                                </td>
                                <td className="px-3 py-3 text-center">
                                  <span className="text-[12px] text-slate-600 font-medium whitespace-nowrap">
                                    {new Date(task.dueDate).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" })}
                                  </span>
                                </td>
                                <td className="px-3 py-3 text-center">
                                  <span className={clsx("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ring-1 ring-inset whitespace-nowrap", pBadge.class)}>
                                    {pBadge.label}
                                  </span>
                                </td>
                                <td className="px-3 py-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const nextMap: Record<string, { status: string; progress: number }> = {
                                        not_started: { status: "in_progress", progress: task.progress || 10 },
                                        in_progress: { status: "completed", progress: 100 },
                                        overdue: { status: "completed", progress: 100 },
                                        completed: { status: "not_started", progress: 0 },
                                      };
                                      const next = nextMap[task.status] || nextMap.not_started;
                                      handleQuickStatusUpdate(task.id, next.status, next.progress);
                                    }}
                                    className="group/status"
                                    title="انقر للتبديل"
                                  >
                                    <span className={clsx("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ring-1 ring-inset whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity", sBadge.class)}>
                                      {sBadge.label}
                                    </span>
                                  </button>
                                </td>
                                <td className="px-3 py-3 text-center">
                                  <div className="flex items-center gap-1.5 justify-center">
                                    <div className="w-14 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                      <div
                                        className={clsx("h-full rounded-full transition-all duration-500", task.progress >= 100 ? "bg-emerald-500" : task.progress > 50 ? "bg-blue-500" : task.progress > 0 ? "bg-amber-500" : "bg-slate-300")}
                                        style={{ width: `${task.progress}%` }}
                                      />
                                    </div>
                                    <span className="text-[11px] font-bold text-slate-500 min-w-[28px]">{ar(task.progress)}%</span>
                                  </div>
                                </td>
                                <td className="px-3 py-3 text-center">
                                  <span className="text-[12px] text-slate-600 font-medium whitespace-nowrap">{formatCurrency(task.cost, task.currency)}</span>
                                </td>
                                <td className="px-3 py-3 text-center rounded-l-xl">
                                  <div className="flex items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      type="button"
                                      onClick={() => { setEditingTask(task); setShowModal(true); }}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                      title="تعديل"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDuplicate(task.id)}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                      title="تكرار"
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setDeletingTask(task)}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                      title="حذف"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>

                        {/* Summary row */}
                        <tfoot>
                          <tr className="bg-slate-50/80">
                            <td colSpan={2} className="px-3 py-3 text-[12px] font-bold text-slate-700 rounded-r-xl">الإجمالي</td>
                            <td className="px-3 py-3 text-center">
                              <span className={clsx("text-[12px] font-bold", weightSum === 100 ? "text-emerald-600" : "text-amber-600")}>
                                {ar(weightSum)}%
                              </span>
                            </td>
                            <td colSpan={5} className="px-3 py-3" />
                            <td className="px-3 py-3 text-center">
                              <div className="flex items-center gap-1.5 justify-center">
                                <div className="w-14 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                  <div
                                    className={clsx("h-full rounded-full transition-all", goalProgress >= 100 ? "bg-emerald-500" : goalProgress > 50 ? "bg-blue-500" : "bg-amber-500")}
                                    style={{ width: `${goalProgress}%` }}
                                  />
                                </div>
                                <span className="text-[11px] font-bold text-slate-600">{ar(goalProgress)}%</span>
                              </div>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className="text-[12px] font-bold text-slate-700">{formatCurrency(totalCost, tasks[0]?.currency || defaultCurrency)}</span>
                            </td>
                            <td className="px-3 py-3 rounded-l-xl" />
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    {/* Weight indicator */}
                    {weightSum !== 100 ? (
                      <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-xs font-bold">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        مجموع الأوزان: {ar(weightSum)}% — متبقٍّ {ar(100 - weightSum)}% لإكمال 100%.
                      </div>
                    ) : (
                      <div />
                    )}

                    {weightSum < 100 && (
                      <button
                        type="button"
                        onClick={() => { setEditingTask(null); setShowModal(true); }}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#5452F6] hover:bg-[#4338CA] text-white text-sm font-bold rounded-xl shadow-md transition-all hover:-translate-y-0.5"
                      >
                        <Plus className="w-4 h-4" />
                        إضافة مهمة جديدة
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end shrink-0">
               <button onClick={() => setIsOpen(false)} className="px-6 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-xl shadow-sm transition-colors">
                 إغلاق النافذة
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <TaskModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingTask(null);
          }}
          onSave={handleSaveTask}
          remainingWeight={currentWeightForModal === 0 && editingTask ? 100 : Math.max(0, 100 - currentWeightForModal)}
          currentWeightSum={currentWeightForModal}
          initialData={editingTask || undefined}
          members={members}
          defaultCurrency={defaultCurrency}
          taskIndex={editingTask ? editingTask.taskIndex : nextTaskIndex}
          goalIndex={goalIndex}
        />
      )}

      <ConfirmDeleteModal
        isOpen={!!deletingTask}
        onClose={() => setDeletingTask(null)}
        onConfirm={handleDelete}
        title="حذف المهمة"
        description="هل أنت متأكد من رغبتك في حذف هذه المهمة؟ لا يمكن التراجع عن هذا الإجراء."
      />
    </>
  );
};
'''

content = re.sub(r'  return \(\n    <>\n      \{\/\* Accordion Header \*\/\}.*?\n\};\n', new_render + '\n};\n', content, flags=re.MULTILINE|re.DOTALL)

with open('src/components/tools/swot/tasks/TasksAccordion.tsx', 'w') as f:
    f.write(content)
