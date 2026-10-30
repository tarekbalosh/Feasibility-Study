import React, { useState } from 'react';
import Head from 'next/head';
import {
  Building2,
  User,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Layers,
  Sparkles,
  Download,
  Plus,
} from 'lucide-react';
import {
  FilterBar,
  SearchInput,
  FilterSelect,
  FilterMultiSelect,
  DateRangeFilter,
  FilterChip,
  ClearFilters,
  FilterItemConfig,
  FilterValues,
  FilterValue,
} from '@/components/ui/filters';

export default function DevFiltersPage() {
  // Demo states
  const [searchValue, setSearchValue] = useState('');
  const [filterValues, setFilterValues] = useState<FilterValues>({
    department: 'marketing',
    assignee: ['1', '2'],
    status: 'in_progress',
    importance: 'high',
    dateRange: { from: '2026-10-01', to: '2026-10-31' },
  });

  const [standaloneSelect, setStandaloneSelect] = useState('active');
  const [standaloneMulti, setStandaloneMulti] = useState<string[]>(['sarah']);
  const [standaloneDate, setStandaloneDate] = useState<{ from?: string; to?: string }>({});

  const sampleFiltersConfig: FilterItemConfig[] = [
    {
      key: 'department',
      label: 'القسم',
      type: 'select',
      icon: Building2,
      options: [
        { value: 'marketing', label: 'التسويق والمبيعات', dotColor: '#4F46E5', badge: 12 },
        { value: 'tech', label: 'التقنية والتطوير', dotColor: '#10B981', badge: 8 },
        { value: 'hr', label: 'الموارد البشرية', dotColor: '#F59E0B', badge: 4 },
        { value: 'finance', label: 'المالية والمحاسبة', dotColor: '#EC4899', badge: 6 },
        { value: 'ops', label: 'العمليات والتشغيل', dotColor: '#8B5CF6', badge: 15 },
        { value: 'legal', label: 'الشؤون القانونية', dotColor: '#6B7280', badge: 2 },
        { value: 'support', label: 'خدمة العملاء', dotColor: '#06B6D4', badge: 9 },
      ],
      isAllOptionLabel: 'كل الأقسام',
      searchThreshold: 5,
    },
    {
      key: 'assignee',
      label: 'المسؤول',
      type: 'multi-select',
      icon: User,
      options: [
        { value: '1', label: 'سارة الأحمد', initials: 'سأ', subtext: 'مديرة التسويق' },
        { value: '2', label: 'خالد المنصور', initials: 'خم', subtext: 'مطور واجهات' },
        { value: '3', label: 'محمد العتيبي', initials: 'مع', subtext: 'محلل مالي' },
        { value: '4', label: 'ريم القحطاني', initials: 'رق', subtext: 'مصممة منتجات' },
        { value: '5', label: 'عبدالله الشهري', initials: 'عش', subtext: 'مهندس جودة' },
      ],
      searchThreshold: 4,
    },
    {
      key: 'status',
      label: 'الحالة',
      type: 'select',
      icon: CheckCircle2,
      options: [
        { value: 'completed', label: 'أنجزت', dotColor: '#10B981', badge: 24 },
        { value: 'in_progress', label: 'قيد الإنجاز', dotColor: '#3B82F6', badge: 14 },
        { value: 'not_started', label: 'لم تبدأ', dotColor: '#94A3B8', badge: 7 },
        { value: 'overdue', label: 'متأخرة', dotColor: '#EF4444', badge: 3 },
      ],
      isAllOptionLabel: 'كل الحالات',
    },
    {
      key: 'importance',
      label: 'الأهمية',
      type: 'select',
      icon: AlertCircle,
      options: [
        { value: 'high', label: 'عالية', dotColor: '#EF4444' },
        { value: 'medium', label: 'متوسطة', dotColor: '#F59E0B' },
        { value: 'normal', label: 'عادية', dotColor: '#10B981' },
      ],
      isAllOptionLabel: 'كل الأهميات',
    },
    {
      key: 'dateRange',
      label: 'نطاق التاريخ',
      type: 'date-range',
      icon: Calendar,
    },
  ];

  const handleFilterChange = (key: string, value: FilterValue) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearAll = () => {
    setSearchValue('');
    setFilterValues({});
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 font-cairo" dir="rtl">
      <Head>
        <title>معاينة واختبار نظام الفلاتر الموحد - Dev Filters</title>
      </Head>

      <div className="max-w-6xl mx-auto space-y-10">
        {/* Page Title */}
        <div className="border-b border-slate-200 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-sm">
              <Sparkles size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                نظام الفلاتر الموحد (Unified Filter Design System)
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                مكوّنات مستقلة، متسقة مع هوية المنصة، تدعم الكيبورد وإمكانية الوصول والجوال والـ RTL.
              </p>
            </div>
          </div>
        </div>

        {/* Section 1: The Unified FilterBar in Action */}
        <section className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Layers size={18} className="text-indigo-600" />
              1. شريط الفلاتر الشامل (FilterBar)
            </h2>
            <span className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-semibold">
              شريط تفاعلي كامل
            </span>
          </div>
          <p className="text-xs text-slate-500">
            جرّب تغيير البحث والفلاتر، ومسح الفلاتر، وإزالة الشرائح الفعّالة، وجرب تصغير الشاشة لمعاينة اللوحة السفلية (Bottom Sheet) على الجوال.
          </p>

          <FilterBar
            filters={sampleFiltersConfig}
            values={filterValues}
            onChange={handleFilterChange}
            onClearAll={handleClearAll}
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            searchPlaceholder="ابحث في الأهداف والمهام..."
            totalResults={48}
            resultsLabel="مهمة"
            extraActions={
              <button
                type="button"
                className="h-10 px-4 rounded-xl text-xs font-semibold border border-indigo-200 text-indigo-700 hover:bg-indigo-50 flex items-center gap-1.5 transition-colors"
              >
                <Download size={14} />
                تصدير
              </button>
            }
          />

          <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 font-mono overflow-x-auto">
            <strong>القيم الحالية (JSON):</strong>
            <pre className="mt-1">{JSON.stringify({ search: searchValue, ...filterValues }, null, 2)}</pre>
          </div>
        </section>

        {/* Section 2: Individual Components Showcase */}
        <section className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-slate-900">
            2. المكونات الفردية وحالاتها
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Search Input standalone */}
            <div className="space-y-2 p-4 bg-slate-50/70 rounded-2xl border border-slate-200/60">
              <label className="text-xs font-bold text-slate-700 block">
                حقل البحث مع اختصار (/)
              </label>
              <SearchInput
                value={searchValue}
                onChange={setSearchValue}
                placeholder="اضغط / للتركيز..."
              />
              <span className="text-[11px] text-slate-400 block">
                القيمة: {searchValue || '—'}
              </span>
            </div>

            {/* FilterSelect standalone */}
            <div className="space-y-2 p-4 bg-slate-50/70 rounded-2xl border border-slate-200/60">
              <label className="text-xs font-bold text-slate-700 block">
                اختيار فردي مخصص (FilterSelect)
              </label>
              <FilterSelect
                label="الحالة"
                value={standaloneSelect}
                onChange={setStandaloneSelect}
                options={[
                  { value: 'active', label: 'نشط', dotColor: '#10B981' },
                  { value: 'suspended', label: 'معلّق', dotColor: '#EF4444' },
                  { value: 'draft', label: 'مسودة', dotColor: '#94A3B8' },
                ]}
                icon={CheckCircle2}
                className="w-full"
              />
            </div>

            {/* FilterMultiSelect standalone */}
            <div className="space-y-2 p-4 bg-slate-50/70 rounded-2xl border border-slate-200/60">
              <label className="text-xs font-bold text-slate-700 block">
                اختيار متعدد (FilterMultiSelect)
              </label>
              <FilterMultiSelect
                label="المسؤولون"
                values={standaloneMulti}
                onChange={setStandaloneMulti}
                options={[
                  { value: 'sarah', label: 'سارة الأحمد', initials: 'سأ' },
                  { value: 'khalid', label: 'خالد المنصور', initials: 'خم' },
                  { value: 'mohammed', label: 'محمد العتيبي', initials: 'مع' },
                ]}
                icon={User}
                className="w-full"
              />
            </div>

            {/* DateRangeFilter standalone */}
            <div className="space-y-2 p-4 bg-slate-50/70 rounded-2xl border border-slate-200/60">
              <label className="text-xs font-bold text-slate-700 block">
                نطاق التاريخ مع اختصارات (DateRangeFilter)
              </label>
              <DateRangeFilter
                value={standaloneDate}
                onChange={setStandaloneDate}
                className="w-full"
              />
            </div>

            {/* Chips and Clear standalone */}
            <div className="space-y-2 p-4 bg-slate-50/70 rounded-2xl border border-slate-200/60">
              <label className="text-xs font-bold text-slate-700 block">
                الشرائح الفعّالة وزر المسح
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <FilterChip
                  label="القسم"
                  valueDisplay="التسويق"
                  onRemove={() => alert('إزالة فلتر القسم')}
                />
                <ClearFilters hasActiveFilters={true} onClear={() => alert('مسح الفلاتر')} />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
