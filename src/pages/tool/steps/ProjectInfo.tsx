import React from 'react';
import { useFeasibilityTool } from '@/hooks/useFeasibilityTool';

// ——— حقول إضافية حسب نوع النشاط (تظهر مباشرة بعد الاختيار) ———
const ACTIVITY_EXTRA_FIELDS: Record<
  string,
  { key: string; label: string; placeholder?: string; type?: string }[]
> = {
  تجاري: [
    { key: 'expectedCustomersPerDay', label: 'عدد العملاء المتوقع يومياً', placeholder: 'مثال: 50' },
    { key: 'averageInvoiceValue', label: 'متوسط قيمة الفاتورة (ريال)', placeholder: 'مثال: 200' },
    { key: 'workingDaysPerMonth', label: 'عدد أيام العمل شهرياً', placeholder: 'مثال: 26' },
    { key: 'monthlyGrowthRate', label: 'نسبة النمو الشهرية (%)', placeholder: 'مثال: 5' },
    { key: 'competitorsCount', label: 'عدد المنافسين', placeholder: 'مثال: 10' },
  ],
  صناعي: [
    { key: 'monthlyProductionCapacity', label: 'الطاقة الإنتاجية الشهرية (وحدة)', placeholder: 'مثال: 1000' },
    { key: 'unitsProduced', label: 'عدد الوحدات المنتجة فعلياً', placeholder: 'مثال: 800' },
    { key: 'rawMaterialCost', label: 'تكلفة المواد الخام (ريال)', placeholder: 'مثال: 50000' },
    { key: 'laborCost', label: 'تكلفة العمالة الشهرية (ريال)', placeholder: 'مثال: 20000' },
    { key: 'unitSellingPrice', label: 'سعر بيع الوحدة (ريال)', placeholder: 'مثال: 150' },
    { key: 'wasteRatio', label: 'نسبة الهدر (%)', placeholder: 'مثال: 3' },
  ],
  خدمي: [
    { key: 'monthlyCustomers', label: 'عدد العملاء شهرياً', placeholder: 'مثال: 200' },
    { key: 'servicePrice', label: 'سعر الخدمة الواحدة (ريال)', placeholder: 'مثال: 300' },
    { key: 'employeeCount', label: 'عدد الموظفين', placeholder: 'مثال: 5' },
    { key: 'workingHours', label: 'ساعات العمل اليومية', placeholder: 'مثال: 8' },
    { key: 'serviceOccupancyRate', label: 'معدل إشغال الخدمة (%)', placeholder: 'مثال: 75' },
  ],
  تقني: [
    { key: 'expectedUsers', label: 'عدد المستخدمين المتوقع', placeholder: 'مثال: 5000' },
    { key: 'paidSubscribers', label: 'عدد المشتركين المدفوعين', placeholder: 'مثال: 500' },
    { key: 'subscriptionPrice', label: 'سعر الاشتراك الشهري (ريال)', placeholder: 'مثال: 99' },
    { key: 'cac', label: 'تكلفة اكتساب العميل - CAC (ريال)', placeholder: 'مثال: 50' },
    { key: 'ltv', label: 'قيمة العميل الإجمالية - LTV (ريال)', placeholder: 'مثال: 600' },
    { key: 'churnRate', label: 'معدل الإلغاء الشهري (%)', placeholder: 'مثال: 5' },
    { key: 'devCosts', label: 'تكاليف التطوير الشهرية (ريال)', placeholder: 'مثال: 30000' },
    { key: 'infraCosts', label: 'تكاليف البنية التحتية (ريال)', placeholder: 'مثال: 5000' },
  ],
  آخر: [],
};

const selectArrowStyle = {
  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
  backgroundPosition: 'left 0.5rem center',
  backgroundRepeat: 'no-repeat',
  backgroundSize: '1.5em 1.5em',
  paddingLeft: '2.5rem',
};

const inputBase = 'w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-blue-500 focus:ring-2 focus:outline-none transition-all bg-white';
const inputError = 'w-full px-4 py-3 rounded-lg border border-red-500 focus:ring-red-500 focus:ring-2 focus:outline-none transition-all bg-white';

export default function ProjectInfo() {
  const { form } = useFeasibilityTool();
  const { register, watch, formState: { errors } } = form;

  const descriptionValue = watch('projectInfo.description') || '';
  const activityType = watch('projectInfo.activityType') || 'تجاري';
  const extraFields = ACTIVITY_EXTRA_FIELDS[activityType] ?? [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500" dir="rtl">
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">معلومات المشروع الأساسية</h2>

        <div className="space-y-5">
          {/* اسم المشروع */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              اسم المشروع <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('projectInfo.projectName')}
              maxLength={100}
              placeholder="أدخل اسم مشروعك..."
              className={errors.projectInfo?.projectName ? inputError : inputBase}
            />
            {errors.projectInfo?.projectName && (
              <p className="mt-1 text-sm text-red-500">{errors.projectInfo.projectName.message}</p>
            )}
          </div>

          {/* نوع النشاط */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              نوع النشاط <span className="text-red-500">*</span>
            </label>
            <select
              {...register('projectInfo.activityType')}
              className={`${errors.projectInfo?.activityType ? inputError : inputBase} appearance-none`}
              style={selectArrowStyle}
            >
              <option value="تجاري">تجاري</option>
              <option value="صناعي">صناعي</option>
              <option value="خدمي">خدمي</option>
              <option value="تقني">تقني</option>
              <option value="آخر">آخر</option>
            </select>
            {errors.projectInfo?.activityType && (
              <p className="mt-1 text-sm text-red-500">{errors.projectInfo.activityType.message}</p>
            )}
          </div>

          {/* ——— حقول خاصة بنوع النشاط — تظهر فور تغيير القائمة ——— */}
          {extraFields.length > 0 && (
            <div className="border border-blue-100 bg-blue-50/40 rounded-xl p-5 space-y-4 transition-all duration-300">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-1.5 h-5 bg-blue-500 rounded-full block"></span>
                <p className="text-sm font-semibold text-blue-700">
                  بيانات تفصيلية — نشاط {activityType}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {extraFields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      {field.label}
                    </label>
                    <input
                      type="number"
                      step="any"
                      min={0}
                      {...register(`projectInfo.${field.key}` as any, { valueAsNumber: true })}
                      placeholder={field.placeholder}
                      className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-blue-500 focus:ring-2 focus:outline-none transition-all bg-white"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* وصف المشروع */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              وصف المشروع <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register('projectInfo.description')}
              rows={4}
              maxLength={500}
              placeholder="اشرح فكرة المشروع بوضوح (50-500 حرف)..."
              className={`${errors.projectInfo?.description ? inputError : inputBase} resize-none`}
            />
            <div className="flex justify-between items-center mt-1">
              <p className="text-sm text-red-500">{errors.projectInfo?.description?.message}</p>
              <p className={`text-xs ${
                descriptionValue.length < 50 || descriptionValue.length > 500
                  ? 'text-orange-500'
                  : 'text-gray-500'
              }`}>
                {descriptionValue.length} / 500
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
