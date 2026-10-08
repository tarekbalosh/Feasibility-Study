import React, { useState } from 'react';
import Head from 'next/head';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { useDepartments, useCreateDepartment, useUpdateDepartment, useDeleteDepartment } from '@/hooks/useDepartments';
import { Building2, Plus, Trash2, Edit2, Loader2 } from 'lucide-react';

export default function Departments() {
  const { data: departments, isLoading } = useDepartments();
  const createDepartment = useCreateDepartment();
  const updateDepartment = useUpdateDepartment();
  const deleteDepartment = useDeleteDepartment();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [newDept, setNewDept] = useState({ name: '', description: '' });

  const openCreateModal = () => {
    setEditingDeptId(null);
    setNewDept({ name: '', description: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (dept: any) => {
    setEditingDeptId(dept.id);
    setNewDept({ name: dept.name, description: dept.description || '' });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDept.name.trim()) return;
    
    if (editingDeptId) {
      updateDepartment.mutate({ id: editingDeptId, payload: newDept }, {
        onSuccess: () => {
          setIsModalOpen(false);
          setEditingDeptId(null);
        }
      });
    } else {
      createDepartment.mutate(newDept, {
        onSuccess: () => {
          setIsModalOpen(false);
          setNewDept({ name: '', description: '' });
        }
      });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا القسم؟')) {
      deleteDepartment.mutate(id);
    }
  };

  return (
    <DashboardLayout>
      <Head>
        <title>الأقسام - Feasibility Suite</title>
      </Head>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="text-indigo-600" /> الأقسام
          </h1>
          <p className="text-gray-500 text-sm mt-1">أدر أقسام مساحة العمل وقم بتنظيم فرق العمل.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus size={18} />
          إضافة قسم
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-indigo-500" size={32} />
        </div>
      ) : departments?.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">لا توجد أقسام بعد</h3>
          <p className="text-gray-500 mb-6">قم بإنشاء قسمك الأول للبدء في تنظيم فريق العمل.</p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus size={18} />
            إضافة قسم
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments?.map((dept: any) => (
            <div key={dept.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative group">
              <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                <button
                  onClick={() => openEditModal(dept)}
                  className="p-2 text-gray-500 hover:bg-gray-100 hover:text-indigo-600 rounded-lg transition-colors"
                  title="تعديل القسم"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(dept.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="حذف القسم"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg bg-${dept.color || 'indigo'}-50 text-${dept.color || 'indigo'}-600`}>
                  <Building2 size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{dept.name}</h3>
                  <p className="text-xs text-gray-500 line-clamp-1">{dept.description || 'بدون وصف'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 mt-4 py-4 border-t border-gray-50">
                <div className="text-center">
                  <span className="block text-xl font-bold text-gray-900">{dept.membersCount || 0}</span>
                  <span className="text-xs text-gray-500">عضو</span>
                </div>
                <div className="text-center border-r border-l border-gray-50">
                  <span className="block text-xl font-bold text-gray-900">{dept.plansCount || 0}</span>
                  <span className="text-xs text-gray-500">خطة</span>
                </div>
                <div className="text-center">
                  <span className="block text-xl font-bold text-indigo-600">{Math.round(dept.progress || 0)}%</span>
                  <span className="text-xs text-gray-500">إنجاز</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal إضافة/تعديل قسم */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">{editingDeptId ? 'تعديل القسم' : 'إضافة قسم جديد'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">اسم القسم *</label>
                  <input
                    type="text"
                    required
                    value={newDept.name}
                    onChange={e => setNewDept({...newDept, name: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors"
                    placeholder="مثل: التسويق والمبيعات"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الوصف (اختياري)</label>
                  <textarea
                    value={newDept.description}
                    onChange={e => setNewDept({...newDept, description: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors resize-none h-24"
                    placeholder="نبذة عن مهام القسم..."
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={createDepartment.isPending || updateDepartment.isPending || !newDept.name.trim()}
                  className="px-5 py-2.5 rounded-xl font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {(createDepartment.isPending || updateDepartment.isPending) ? <Loader2 className="animate-spin" size={18} /> : null}
                  {editingDeptId ? 'حفظ التعديلات' : 'إنشاء القسم'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
