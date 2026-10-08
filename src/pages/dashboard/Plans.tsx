import React, { useState } from 'react';
import Head from 'next/head';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { usePlans, useCreatePlan, useDeletePlan, useUpdatePlan } from '@/hooks/usePlans';
import { useDepartments } from '@/hooks/useDepartments';
import { useOrgMembers } from '@/hooks/useOrg';
import { Briefcase, Plus, Trash2, Edit2, Loader2, Calendar, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function Plans() {
  const { data: plans, isLoading } = usePlans();
  const { data: departments } = useDepartments();
  const { data: membersList } = useOrgMembers();
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();
  const deletePlan = useDeletePlan();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [newPlan, setNewPlan] = useState<{
    name: string;
    description: string;
    departmentId: string;
    members: { memberId: string; role: string }[];
  }>({ name: '', description: '', departmentId: '', members: [] });

  const openCreateModal = () => {
    setEditingPlanId(null);
    setNewPlan({ name: '', description: '', departmentId: '', members: [] });
    setIsModalOpen(true);
  };

  const openEditModal = (plan: any) => {
    setEditingPlanId(plan.id);
    setNewPlan({
      name: plan.name,
      description: plan.description || '',
      departmentId: plan.department?.id || '',
      members: plan.members ? plan.members.map((m: any) => ({ memberId: m.id || m.memberId || m.workspaceMemberId, role: m.planRole || m.role || 'contributor' })) : []
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlan.name.trim() || !newPlan.departmentId) return;
    
    if (editingPlanId) {
      updatePlan.mutate({ id: editingPlanId, payload: newPlan }, {
        onSuccess: () => {
          setIsModalOpen(false);
          setEditingPlanId(null);
        }
      });
    } else {
      createPlan.mutate(newPlan, {
        onSuccess: () => {
          setIsModalOpen(false);
          setNewPlan({ name: '', description: '', departmentId: '', members: [] });
        }
      });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الخطة؟ ستبقى مشاريعها محفوظة في القسم.')) {
      deletePlan.mutate(id);
    }
  };

  const toggleMember = (memberId: string) => {
    setNewPlan(prev => {
      const exists = prev.members.find(m => m.memberId === memberId);
      if (exists) {
        return { ...prev, members: prev.members.filter(m => m.memberId !== memberId) };
      } else {
        return { ...prev, members: [...prev.members, { memberId, role: 'contributor' }] };
      }
    });
  };

  return (
    <DashboardLayout>
      <Head>
        <title>الخطط التشغيلية - Feasibility Suite</title>
      </Head>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Briefcase className="text-emerald-600" /> الخطط التشغيلية
          </h1>
          <p className="text-gray-500 text-sm mt-1">أدر الخطط التشغيلية التابعة للأقسام وتابع نسبة إنجازها.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <Plus size={18} />
          إضافة خطة
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-emerald-500" size={32} />
        </div>
      ) : plans?.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">لا توجد خطط تشغيلية بعد</h3>
          <p className="text-gray-500 mb-6">قم بإنشاء خطة للبدء بتوزيع المهام ومتابعة الإنجاز.</p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <Plus size={18} />
            إضافة خطة
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans?.map((plan: any) => (
            <div key={plan.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative group flex flex-col">
              {plan.access?.canManage && (
                <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 z-10">
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEditModal(plan); }}
                    className="p-1.5 text-gray-500 hover:bg-gray-100 hover:text-indigo-600 rounded-lg transition-colors bg-white/80 backdrop-blur-sm"
                    title="تعديل الخطة"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(plan.id); }}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors bg-white/80 backdrop-blur-sm"
                    title="حذف الخطة"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${plan.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                    {plan.status === 'active' ? 'نشطة' : plan.status}
                  </span>
                  <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md">
                    {plan.department?.name}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 text-lg line-clamp-1" title={plan.name}>{plan.name}</h3>
                <p className="text-xs text-gray-500 line-clamp-2 mt-1 min-h-[32px]">{plan.description || 'بدون وصف'}</p>
              </div>
              
              <div className="mt-auto pt-4 border-t border-gray-50 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-1.5"><Calendar size={14} /> الأعضاء</span>
                  <span className="font-semibold text-gray-900">
                    {plan.members
                      ? plan.members.filter((m: any) => m.workspaceRole !== 'owner' && m.workspaceRole !== 'admin').length
                      : (plan.stats?.members ?? plan.membersCount ?? 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-1.5"><Briefcase size={14} /> الأهداف / المهام</span>
                  <span className="font-semibold text-gray-900">{plan.stats?.goals || plan.goalsCount || 0} / {plan.stats?.tasks || plan.tasksCount || 0}</span>
                </div>
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-gray-700">نسبة الإنجاز</span>
                    <span className="font-bold text-emerald-600">{Math.round(plan.stats?.progress || plan.progress || 0)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-emerald-500 transition-all duration-500" 
                      style={{ width: `${plan.stats?.progress || plan.progress || 0}%` }}
                    />
                  </div>
                </div>
                
                <a href={`/dashboard/plans/${plan.id}`} className="mt-2 w-full inline-flex justify-center items-center py-2.5 rounded-xl bg-gray-50 text-emerald-700 font-semibold text-sm hover:bg-emerald-50 transition-colors border border-gray-100">
                  عرض تفاصيل الخطة
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal إضافة/تعديل خطة */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-gray-900">{editingPlanId ? 'تعديل الخطة التشغيلية' : 'إضافة خطة تشغيلية'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">القسم *</label>
                  <select
                    required
                    value={newPlan.departmentId}
                    onChange={e => setNewPlan({...newPlan, departmentId: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors appearance-none bg-white"
                  >
                    <option value="">-- اختر القسم التابعة له --</option>
                    {departments?.map((dept: any) => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">اسم الخطة *</label>
                  <input
                    type="text"
                    required
                    value={newPlan.name}
                    onChange={e => setNewPlan({...newPlan, name: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
                    placeholder="مثل: خطة التسويق الربع الأول"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الوصف (اختياري)</label>
                  <textarea
                    value={newPlan.description}
                    onChange={e => setNewPlan({...newPlan, description: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors resize-none h-24"
                    placeholder="نبذة عن أهداف الخطة..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Users size={16} />
                    أعضاء الخطة
                  </label>
                  <div className="border border-gray-200 rounded-xl max-h-40 overflow-y-auto bg-gray-50/50 p-2 space-y-1">
                    {membersList && membersList.filter((m: any) => m.workspaceRole !== 'owner' && m.workspaceRole !== 'admin').length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">لا يوجد أعضاء متاحين للإضافة في مساحة العمل.</p>
                    ) : (
                      membersList?.filter((m: any) => m.workspaceRole !== 'owner' && m.workspaceRole !== 'admin').map((member: any) => {
                        const isSelected = newPlan.members.some(m => m.memberId === member.id);
                        return (
                          <div key={member.id} className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${isSelected ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-transparent hover:border-gray-200'}`}>
                            <label className="flex items-center gap-3 cursor-pointer flex-1">
                              <input 
                                type="checkbox" 
                                checked={isSelected}
                                onChange={() => toggleMember(member.id)}
                                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-gray-300"
                              />
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-900">{member.name}</span>
                                <span className="text-xs text-gray-500">{member.email}</span>
                              </div>
                            </label>
                            {isSelected && (
                              <select 
                                value={newPlan.members.find(m => m.memberId === member.id)?.role}
                                onChange={e => {
                                  setNewPlan(prev => ({
                                    ...prev,
                                    members: prev.members.map(m => m.memberId === member.id ? { ...m, role: e.target.value } : m)
                                  }));
                                }}
                                className="text-xs border-gray-200 rounded-md py-1 px-2 focus:ring-emerald-500 focus:border-emerald-500"
                              >
                                <option value="contributor">مساهم (محرر)</option>
                                <option value="viewer">مطلع (عرض فقط)</option>
                                <option value="lead">قائد الخطة</option>
                              </select>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    الأعضاء المضافون هنا سيكون بإمكانهم عرض الخطة، إضافة المهام، وحفظ نتائج الأدوات بداخلها حصراً.
                  </p>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={createPlan.isPending || updatePlan.isPending || !newPlan.name.trim() || !newPlan.departmentId}
                  className="px-5 py-2.5 rounded-xl font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {(createPlan.isPending || updatePlan.isPending) ? <Loader2 className="animate-spin" size={18} /> : null}
                  {editingPlanId ? 'حفظ التعديلات' : 'إنشاء الخطة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
