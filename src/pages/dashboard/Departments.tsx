import React, { useState, useMemo, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useDepartments, useCreateDepartment, useUpdateDepartment, useDeleteDepartment } from '@/hooks/useDepartments';
import { DepartmentManagerSelect } from '@/components/departments/DepartmentManagerSelect';
import { Building2, Plus, Trash2, Edit2, Loader2, User, ChevronLeft, CheckCircle2, RotateCcw } from 'lucide-react';
import { FilterBar, FilterItemConfig, FilterValues } from '@/components/ui/filters';

export default function Departments() {
  const router = useRouter();
  const { workspace, isLoading: isWorkspaceLoading } = useWorkspace();
  const isAdminOrOwner = workspace?.role === 'owner' || workspace?.role === 'admin';

  const { data: departments, isLoading: isDepsLoading } = useDepartments();
  const isLoading = isWorkspaceLoading || isDepsLoading;
  
  const createDepartment = useCreateDepartment();
  const updateDepartment = useUpdateDepartment();
  const deleteDepartment = useDeleteDepartment();
  
  // Filter states
  const [search, setSearch] = useState(() => (typeof router.query.search === 'string' ? router.query.search : ''));
  const [statusFilter, setStatusFilter] = useState(() => (typeof router.query.status === 'string' ? router.query.status : ''));
  const [managerFilter, setManagerFilter] = useState(() => (typeof router.query.managerId === 'string' ? router.query.managerId : ''));

  // Sync with URL query params
  useEffect(() => {
    if (!router.isReady) return;
    const nextQuery: Record<string, any> = { ...router.query };

    if (search.trim()) nextQuery.search = search.trim();
    else delete nextQuery.search;

    if (statusFilter) nextQuery.status = statusFilter;
    else delete nextQuery.status;

    if (managerFilter) nextQuery.managerId = managerFilter;
    else delete nextQuery.managerId;

    router.push({ pathname: router.pathname, query: nextQuery }, undefined, { shallow: true });
  }, [search, statusFilter, managerFilter]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [newDept, setNewDept] = useState<{
    name: string;
    description: string;
    managerId: string | null;
  }>({ name: '', description: '', managerId: null });

  const openCreateModal = () => {
    setEditingDeptId(null);
    setNewDept({ name: '', description: '', managerId: null });
    setIsModalOpen(true);
  };

  const openEditModal = (dept: any) => {
    setEditingDeptId(dept.id);
    setNewDept({
      name: dept.name,
      description: dept.description || '',
      managerId: dept.head?.id || null,
    });
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
          setNewDept({ name: '', description: '', managerId: null });
        }
      });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا القسم؟')) {
      deleteDepartment.mutate(id);
    }
  };
  const managerOptions = useMemo(() => {
    const map = new Map<string, string>();
    departments?.forEach((d: any) => {
      if (d.head?.id && d.head?.name) {
        map.set(d.head.id, d.head.name);
      }
    });
    return Array.from(map, ([id, name]) => ({
      value: id,
      label: name,
      initials: name.trim().slice(0, 2),
    }));
  }, [departments]);

  const filterConfigs: FilterItemConfig[] = useMemo(() => [
    {
      key: 'status',
      label: 'الحالة',
      type: 'select',
      icon: CheckCircle2,
      isAllOptionLabel: 'كل الحالات',
      options: [
        { value: 'active', label: 'نشط', dotColor: '#10B981' },
        { value: 'inactive', label: 'غير نشط', dotColor: '#94A3B8' },
      ],
    },
    {
      key: 'managerId',
      label: 'المدير',
      type: 'select',
      icon: User,
      isAllOptionLabel: 'كل المدراء',
      options: managerOptions,
      searchThreshold: 5,
    },
  ], [managerOptions]);

  const filteredDepartments = useMemo(() => {
    if (!departments) return [];
    return departments.filter((d: any) => {
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchesName = d.name?.toLowerCase().includes(q);
        const matchesDesc = d.description?.toLowerCase().includes(q);
        const matchesHead = d.head?.name?.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesHead) return false;
      }
      if (statusFilter) {
        const isActive = (d.stats?.activePlansCount ?? 0) > 0 || (d.membersCount ?? 0) > 0 || Boolean(d.head);
        if (statusFilter === 'active' && !isActive) return false;
        if (statusFilter === 'inactive' && isActive) return false;
      }
      if (managerFilter && d.head?.id !== managerFilter) {
        return false;
      }
      return true;
    });
  }, [departments, search, statusFilter, managerFilter]);

  const hasActiveFilters = Boolean(search.trim() || statusFilter || managerFilter);

  const handleFilterChange = (key: string, val: any) => {
    if (key === 'status') setStatusFilter(val || '');
    else if (key === 'managerId') setManagerFilter(val || '');
  };

  const handleClearAll = () => {
    setSearch('');
    setStatusFilter('');
    setManagerFilter('');
  };

  return (
    <DashboardLayout>
      <Head>
        <title>الأقسام - Feasibility Suite</title>
      </Head>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="text-indigo-600" /> الأقسام
          </h1>
          <p className="text-gray-500 text-sm mt-1">أدر أقسام مساحة العمل وقم بتنظيم فرق العمل والخطط التشغيلية.</p>
        </div>
        {isAdminOrOwner && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus size={18} />
            إضافة قسم
          </button>
        )}
      </div>

      {/* شريط الفلاتر الموحد */}
      {!isLoading && (departments?.length ?? 0) > 0 && (
        <FilterBar
          filters={filterConfigs}
          values={{ status: statusFilter, managerId: managerFilter }}
          onChange={handleFilterChange}
          onClearAll={handleClearAll}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="ابحث باسم القسم أو مديره..."
          totalResults={filteredDepartments.length}
          resultsLabel="قسم"
          isLoading={isLoading}
        />
      )}

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
          <p className="text-gray-500 mb-6">
            {isAdminOrOwner
              ? 'قم بإنشاء قسمك الأول للبدء في تنظيم فريق العمل.'
              : 'لم يتم إدراجك في أي قسم بعد.'}
          </p>
          {isAdminOrOwner && (
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Plus size={18} />
              إضافة قسم
            </button>
          )}
        </div>
      ) : filteredDepartments.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
          <h3 className="text-lg font-bold text-gray-900 mb-1">لا توجد أقسام مطابقة للبحث أو الفلاتر</h3>
          <p className="text-gray-500 mb-4 text-sm">جرّب تغيير عبارة البحث أو مسح الفلاتر المحددة.</p>
          <button
            type="button"
            onClick={handleClearAll}
            className="inline-flex items-center gap-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl text-xs font-semibold transition-colors"
          >
            <RotateCcw size={14} /> مسح جميع الفلاتر
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDepartments.map((dept: any) => (
            <Link
              key={dept.id}
              href={`/dashboard/departments/${dept.id}`}
              className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 relative group flex flex-col justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer block text-inherit"
            >
              <div>
                {/* أزرار التعديل والحذف تظهر للمالك والمشرف وتمنع الانتقال */}
                {isAdminOrOwner && (
                  <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1.5 z-10">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openEditModal(dept);
                      }}
                      className="p-2 text-gray-500 hover:bg-white hover:text-indigo-600 rounded-lg transition-colors bg-white/90 shadow-sm border border-gray-100"
                      title="تعديل القسم"
                      aria-label="تعديل القسم"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDelete(dept.id);
                      }}
                      className="p-2 text-red-500 hover:bg-white hover:text-red-700 rounded-lg transition-colors bg-white/90 shadow-sm border border-gray-100"
                      title="حذف القسم"
                      aria-label="حذف القسم"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg bg-${dept.color || 'indigo'}-50 text-${dept.color || 'indigo'}-600`}>
                    <Building2 size={24} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-gray-900 text-lg group-hover:text-indigo-600 transition-colors truncate">
                      {dept.name}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-1">{dept.description || 'بدون وصف'}</p>
                  </div>
                </div>

                {/* رئيس / مدير القسم */}
                <div className="flex items-center gap-2.5 px-3 py-2 bg-gray-50/70 rounded-xl border border-gray-100 text-xs mb-4">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 font-bold text-[10px]">
                    {dept.head?.name ? dept.head.name.slice(0, 2).toUpperCase() : <User size={14} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-gray-400 block leading-tight">رئيس القسم</span>
                    <span className="font-semibold text-gray-900 truncate block leading-tight">
                      {dept.head?.name || 'لم يُحدد رئيس'}
                    </span>
                  </div>
                </div>
                
                {/* شبكة الإحصائيات */}
                <div className="grid grid-cols-3 gap-2 py-3 border-t border-gray-50">
                  <div className="text-center">
                    <span className="block text-xl font-bold text-gray-900">{dept.membersCount || 0}</span>
                    <span className="text-xs text-gray-500">أعضاء</span>
                  </div>
                  <div className="text-center border-r border-l border-gray-50">
                    <span className="block text-xl font-bold text-gray-900">{dept.plansCount || 0}</span>
                    <span className="text-xs text-gray-500">خطط</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-xl font-bold text-indigo-600">{Math.round(dept.progress || 0)}%</span>
                    <span className="text-xs text-gray-500">إنجاز</span>
                  </div>
                </div>
              </div>

              {/* زر عرض التفاصيل أسفل الإحصاءات */}
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-indigo-600 group-hover:text-indigo-700 transition-colors">
                <span className="flex items-center gap-1">
                  عرض التفاصيل
                  <ChevronLeft size={16} className="transition-transform group-hover:-translate-x-1 duration-200" />
                </span>
                <span className="text-[11px] text-gray-400 font-normal">
                  {dept.activePlansCount || 0} خطة نشطة
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Modal إضافة/تعديل قسم */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" dir="rtl">
          <div
            className="bg-white rounded-2xl w-full max-w-md shadow-2xl relative"
            style={{ overflow: 'visible' }}
          >
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between rounded-t-2xl">
              <h3 className="font-bold text-gray-900">{editingDeptId ? 'تعديل القسم' : 'إضافة قسم جديد'}</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6" style={{ overflow: 'visible' }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">اسم القسم *</label>
                  <input
                    type="text"
                    required
                    value={newDept.name}
                    onChange={e => setNewDept({...newDept, name: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors text-sm"
                    placeholder="مثل: التسويق والمبيعات"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الوصف (اختياري)</label>
                  <textarea
                    value={newDept.description}
                    onChange={e => setNewDept({...newDept, description: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors resize-none h-20 text-sm"
                    placeholder="نبذة عن مهام القسم..."
                  />
                </div>

                {/* حقل مدير القسم (اختياري) */}
                <DepartmentManagerSelect
                  selectedMemberId={newDept.managerId}
                  onSelect={(memberId) => setNewDept(prev => ({ ...prev, managerId: memberId }))}
                />
              </div>
              
              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl font-medium text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={createDepartment.isPending || updateDepartment.isPending || !newDept.name.trim()}
                  className="px-5 py-2.5 rounded-xl font-medium text-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-sm"
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
