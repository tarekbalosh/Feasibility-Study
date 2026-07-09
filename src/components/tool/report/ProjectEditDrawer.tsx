import React, { useState, useCallback, useEffect } from 'react';
import { useFeasibilityTool, FeasibilityData } from '@/hooks/useFeasibilityTool';
import { useFieldArray } from 'react-hook-form';
import {
  X, Save, ChevronDown, ChevronUp, Plus, Trash2,
  Building2, DollarSign, Users, Wrench, TrendingUp,
  ShoppingCart, Percent, Receipt, Loader2, Undo2
} from 'lucide-react';

interface ProjectEditDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

/* ——— Section wrapper with accordion ——— */
function AccordionSection({
  title,
  icon: Icon,
  isOpen,
  onToggle,
  children,
  accentColor = 'indigo',
}: {
  title: string;
  icon: React.ElementType;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  accentColor?: string;
}) {
  const colorMap: Record<string, { bg: string; text: string; border: string; iconBg: string }> = {
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', iconBg: 'bg-indigo-100' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', iconBg: 'bg-emerald-100' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', iconBg: 'bg-blue-100' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', iconBg: 'bg-amber-100' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', iconBg: 'bg-purple-100' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', iconBg: 'bg-rose-100' },
    teal: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', iconBg: 'bg-teal-100' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', iconBg: 'bg-orange-100' },
  };
  const c = colorMap[accentColor] || colorMap.indigo;

  return (
    <div className={`border ${isOpen ? c.border : 'border-gray-200'} rounded-xl overflow-hidden transition-all duration-300`}>
      <button
        type="button"
        onClick={onToggle}
        className={`w-full flex items-center justify-between p-4 transition-colors ${
          isOpen ? `${c.bg}` : 'bg-white hover:bg-gray-50'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isOpen ? c.iconBg : 'bg-gray-100'}`}>
            <Icon className={`w-4 h-4 ${isOpen ? c.text : 'text-gray-500'}`} />
          </div>
          <span className={`font-bold text-sm ${isOpen ? c.text : 'text-gray-700'}`}>{title}</span>
        </div>
        {isOpen ? (
          <ChevronUp className={`w-4 h-4 ${c.text}`} />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>
      {isOpen && (
        <div className="p-4 bg-white border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  );
}

/* ——— Input helpers ——— */
const inputClass = 'w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all bg-white';
const labelClass = 'block text-xs font-semibold text-gray-600 mb-1.5';
const numberInputClass = `${inputClass} text-center`;

/* ——— Sectors ——— */
const sectors = ['مطاعم وأغذية', 'تجارة وتجزئة', 'خدمات', 'تقني وناشئ', 'صناعي', 'مجال آخر'];
const currencies = ['ر.ع', 'د.إ', 'ر.س', 'د.ك', '$'];

/* ——— Main Component ——— */
export default function ProjectEditDrawer({ isOpen, onClose, onSave }: ProjectEditDrawerProps) {
  const { form, recalculateFinancialData } = useFeasibilityTool();
  const { register, watch, setValue, control } = form;

  // Store a snapshot to allow cancel/revert
  const [snapshot, setSnapshot] = useState<FeasibilityData | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Accordion state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    basic: true,
    investment: false,
    partners: false,
    setup: false,
    sales: false,
    items: false,
    commission: false,
    expenses: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Field arrays
  const { fields: partnerFields, append: appendPartner, remove: removePartner } = useFieldArray({
    control, name: 'partnersData',
  });
  const { fields: equipFields, append: appendEquip, remove: removeEquip } = useFieldArray({
    control, name: 'setupData.equipments',
  });
  const { fields: estFields, append: appendEst, remove: removeEst } = useFieldArray({
    control, name: 'setupData.establishmentExpenses',
  });
  const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({
    control, name: 'itemsData.items',
  });
  const { fields: expenseFields, append: appendExpense, remove: removeExpense } = useFieldArray({
    control, name: 'monthlyExpensesData.expenses',
  });

  // Take a snapshot when drawer opens
  useEffect(() => {
    if (isOpen) {
      setSnapshot(structuredClone(form.getValues()));
    }
  }, [isOpen]);

  // Handle cancel — revert to snapshot
  const handleCancel = useCallback(() => {
    if (snapshot) {
      form.reset(snapshot);
    }
    onClose();
  }, [snapshot, form, onClose]);

  // Handle save — recalculate and close
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    
    // Recalculate derived financial data (same logic as step 9)
    recalculateFinancialData();

    // Small delay for UX feedback
    await new Promise(r => setTimeout(r, 400));

    setIsSaving(false);
    setSnapshot(null);
    onSave();
  }, [recalculateFinancialData, onSave]);

  // Watch values for computed displays
  const partners = watch('partnersData') || [];
  const totalPartnerPct = partners.reduce((s: number, p: any) => s + (Number(p.percentage) || 0), 0);
  const equipments = watch('setupData.equipments') || [];
  const estExpenses = watch('setupData.establishmentExpenses') || [];
  const equipTotal = equipments.reduce((s: number, e: any) => s + (Number(e.value) || 0), 0);
  const estTotal = estExpenses.reduce((s: number, e: any) => s + (Number(e.value) || 0), 0);
  const items = watch('itemsData.items') || [];
  const totalItemCost = items.reduce((s: number, i: any) => s + (Number(i.cost) || 0), 0);
  const totalItemPrice = items.reduce((s: number, i: any) => s + (Number(i.price) || 0), 0);
  const costMargin = totalItemPrice > 0 ? Math.round((totalItemCost / totalItemPrice) * 100) : 0;
  const monthlyExpenses = watch('monthlyExpensesData.expenses') || [];
  const expensesTotal = monthlyExpenses.reduce((s: number, e: any) => s + (Number(e.value) || 0), 0);

  // Handle Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) handleCancel();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, handleCancel]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={handleCancel}
      />

      {/* Drawer */}
      <div
        className="fixed top-0 right-0 h-full w-full sm:w-[520px] md:w-[580px] bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-l from-indigo-50 to-white">
          <div>
            <h2 className="text-lg font-black text-gray-900">تعديل معلومات المشروع</h2>
            <p className="text-xs text-gray-500 mt-0.5">عدّل بياناتك وسيتحدّث التقرير فوراً</p>
          </div>
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="إغلاق"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">

          {/* ===== 1. بيانات المشروع الأساسية ===== */}
          <AccordionSection
            title="بيانات المشروع الأساسية"
            icon={Building2}
            isOpen={openSections.basic}
            onToggle={() => toggleSection('basic')}
            accentColor="indigo"
          >
            <div className="space-y-4">
              <div>
                <label className={labelClass}>اسم المشروع</label>
                <input {...register('projectDetails.projectName')} type="text" className={inputClass} placeholder="اسم المشروع" />
              </div>
              <div>
                <label className={labelClass}>القطاع</label>
                <select {...register('sector')} className={`${inputClass} appearance-none`}>
                  {sectors.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>الغرض من الدراسة</label>
                <div className="flex flex-wrap gap-2">
                  {['أختبر فكرتي', 'أُقنع مموّلاً أو مستثمراً', 'أدرس توسّع منشأتي', 'أُعدّها لعميل'].map(p => (
                    <label key={p} className={`cursor-pointer px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                      watch('projectDetails.purpose') === p
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 text-gray-600 hover:border-indigo-300'
                    }`}>
                      <input type="radio" value={p} {...register('projectDetails.purpose')} className="hidden" />
                      {p}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </AccordionSection>

          {/* ===== 2. الاستثمار الأولي ===== */}
          <AccordionSection
            title="الاستثمار الأولي"
            icon={DollarSign}
            isOpen={openSections.investment}
            onToggle={() => toggleSection('investment')}
            accentColor="emerald"
          >
            <div className="space-y-4">
              <div>
                <label className={labelClass}>مبلغ الاستثمار</label>
                <input
                  {...register('investmentData.amount', { valueAsNumber: true })}
                  type="number" min="0" className={inputClass} placeholder="0" dir="ltr"
                />
              </div>
              <div>
                <label className={labelClass}>العملة</label>
                <select {...register('investmentData.currency')} className={`${inputClass} appearance-none`}>
                  {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </AccordionSection>

          {/* ===== 3. الشركاء والحصص ===== */}
          <AccordionSection
            title={`الشركاء والحصص (${totalPartnerPct}%)`}
            icon={Users}
            isOpen={openSections.partners}
            onToggle={() => toggleSection('partners')}
            accentColor="purple"
          >
            <div className="space-y-3">
              {partnerFields.map((field, idx) => (
                <div key={field.id} className="flex gap-2 items-center">
                  <input
                    {...register(`partnersData.${idx}.name`)}
                    placeholder="اسم الشريك"
                    className={`flex-1 ${inputClass}`}
                  />
                  <div className="relative w-24">
                    <input
                      {...register(`partnersData.${idx}.percentage`, { valueAsNumber: true })}
                      type="number" min="0" max="100"
                      className={numberInputClass} dir="ltr"
                    />
                    <span className="absolute right-2 top-2.5 text-xs text-gray-400">%</span>
                  </div>
                  {partnerFields.length > 1 && (
                    <button type="button" onClick={() => removePartner(idx)} className="text-gray-400 hover:text-red-500 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              {partnerFields.length < 4 && (
                <button type="button" onClick={() => appendPartner({ name: '', percentage: 0 })} className="text-indigo-600 text-xs font-medium flex items-center hover:text-indigo-800">
                  <Plus className="w-3.5 h-3.5 ml-1" /> أضف شريكاً
                </button>
              )}
              <div className={`text-xs font-bold px-3 py-2 rounded-lg ${totalPartnerPct === 100 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                مجموع النِسب: {totalPartnerPct}%
                {totalPartnerPct !== 100 && <span className="font-normal mr-2">— يجب أن يبلغ 100%</span>}
              </div>
            </div>
          </AccordionSection>

          {/* ===== 4. التجهيزات والتأسيس ===== */}
          <AccordionSection
            title={`التجهيزات والتأسيس (${(equipTotal + estTotal).toLocaleString()})`}
            icon={Wrench}
            isOpen={openSections.setup}
            onToggle={() => toggleSection('setup')}
            accentColor="amber"
          >
            <div className="space-y-5">
              {/* Equipments */}
              <div>
                <p className="text-xs font-bold text-gray-700 mb-2">التجهيزات والأصول <span className="text-indigo-600 font-medium mr-2">{equipTotal.toLocaleString()}</span></p>
                <div className="space-y-2">
                  {equipFields.map((field, idx) => (
                    <div key={field.id} className="flex gap-2 items-center">
                      <input {...register(`setupData.equipments.${idx}.name`)} placeholder="اسم التجهيز" className={`flex-1 ${inputClass}`} />
                      <input {...register(`setupData.equipments.${idx}.value`, { valueAsNumber: true })} type="number" min="0" placeholder="0" className={`w-24 ${numberInputClass}`} dir="ltr" />
                      <button type="button" onClick={() => removeEquip(idx)} className="text-gray-400 hover:text-red-500 p-1">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {equipFields.length < 15 && (
                    <button type="button" onClick={() => appendEquip({ name: '', value: 0 })} className="text-indigo-600 text-xs font-medium flex items-center hover:text-indigo-800">
                      <Plus className="w-3.5 h-3.5 ml-1" /> أضف تجهيزاً
                    </button>
                  )}
                </div>
              </div>

              {/* Establishment expenses */}
              <div>
                <p className="text-xs font-bold text-gray-700 mb-2">مصاريف التأسيس <span className="text-indigo-600 font-medium mr-2">{estTotal.toLocaleString()}</span></p>
                <div className="space-y-2">
                  {estFields.map((field, idx) => (
                    <div key={field.id} className="flex gap-2 items-center">
                      <input {...register(`setupData.establishmentExpenses.${idx}.name`)} placeholder="اسم المصروف" className={`flex-1 ${inputClass}`} />
                      <input {...register(`setupData.establishmentExpenses.${idx}.value`, { valueAsNumber: true })} type="number" min="0" placeholder="0" className={`w-24 ${numberInputClass}`} dir="ltr" />
                      <button type="button" onClick={() => removeEst(idx)} className="text-gray-400 hover:text-red-500 p-1">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {estFields.length < 15 && (
                    <button type="button" onClick={() => appendEst({ name: '', value: 0 })} className="text-indigo-600 text-xs font-medium flex items-center hover:text-indigo-800">
                      <Plus className="w-3.5 h-3.5 ml-1" /> أضف مصروفاً
                    </button>
                  )}
                </div>
              </div>
            </div>
          </AccordionSection>

          {/* ===== 5. المبيعات المتوقعة ===== */}
          <AccordionSection
            title="المبيعات المتوقعة"
            icon={TrendingUp}
            isOpen={openSections.sales}
            onToggle={() => toggleSection('sales')}
            accentColor="blue"
          >
            <div className="space-y-4">
              <div>
                <label className={labelClass}>متوسط المبيعات الشهرية (السنة الأولى)</label>
                <input
                  {...register('salesData.firstYearAverage', { valueAsNumber: true })}
                  type="number" min="0" placeholder="0" className={inputClass} dir="ltr"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>نموّ السنة الثانية (%)</label>
                  <div className="relative">
                    <input
                      {...register('salesData.growthRateYear2', { valueAsNumber: true })}
                      type="number" min="0" placeholder="0" className={inputClass} dir="ltr"
                    />
                    <span className="absolute right-2 top-2.5 text-xs text-gray-400">%</span>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>نموّ السنة الثالثة (%)</label>
                  <div className="relative">
                    <input
                      {...register('salesData.growthRateYear3', { valueAsNumber: true })}
                      type="number" min="0" placeholder="0" className={inputClass} dir="ltr"
                    />
                    <span className="absolute right-2 top-2.5 text-xs text-gray-400">%</span>
                  </div>
                </div>
              </div>
            </div>
          </AccordionSection>

          {/* ===== 6. الأصناف والتكاليف ===== */}
          <AccordionSection
            title={`الأصناف والتكاليف (نسبة التكلفة: ${costMargin}%)`}
            icon={ShoppingCart}
            isOpen={openSections.items}
            onToggle={() => toggleSection('items')}
            accentColor="rose"
          >
            <div className="space-y-3">
              <div className="flex gap-2 px-1 text-[10px] font-semibold text-gray-400 uppercase">
                <div className="flex-1">الصنف</div>
                <div className="w-20 text-center">تكلفته</div>
                <div className="w-20 text-center">سعر البيع</div>
                <div className="w-7"></div>
              </div>
              {itemFields.map((field, idx) => (
                <div key={field.id} className="flex gap-2 items-center">
                  <input {...register(`itemsData.items.${idx}.name`)} placeholder="اسم الصنف" className={`flex-1 ${inputClass}`} />
                  <input {...register(`itemsData.items.${idx}.cost`, { valueAsNumber: true })} type="number" min="0" placeholder="0" className={`w-20 ${numberInputClass}`} dir="ltr" />
                  <input {...register(`itemsData.items.${idx}.price`, { valueAsNumber: true })} type="number" min="0" placeholder="0" className={`w-20 ${numberInputClass}`} dir="ltr" />
                  <button type="button" onClick={() => removeItem(idx)} className="text-gray-400 hover:text-red-500 p-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {itemFields.length < 20 && (
                <button type="button" onClick={() => appendItem({ name: '', cost: 0, price: 0 })} className="text-indigo-600 text-xs font-medium flex items-center hover:text-indigo-800">
                  <Plus className="w-3.5 h-3.5 ml-1" /> أضف صنفاً
                </button>
              )}
              <div>
                <label className={labelClass}>نسبة المستلزمات المصاحبة (%)</label>
                <div className="relative w-28">
                  <input
                    {...register('itemsData.suppliesPercentage', { valueAsNumber: true })}
                    type="number" min="0" max="100" placeholder="0" className={inputClass} dir="ltr"
                  />
                  <span className="absolute right-2 top-2.5 text-xs text-gray-400">%</span>
                </div>
              </div>
            </div>
          </AccordionSection>

          {/* ===== 7. العمولة والضريبة ===== */}
          <AccordionSection
            title="العمولة والضريبة"
            icon={Percent}
            isOpen={openSections.commission}
            onToggle={() => toggleSection('commission')}
            accentColor="teal"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>عمولة البيع (%)</label>
                <div className="relative">
                  <input
                    {...register('commissionTaxData.commissionRate', { valueAsNumber: true })}
                    type="number" min="0" max="100" placeholder="0" className={inputClass} dir="ltr"
                  />
                  <span className="absolute right-2 top-2.5 text-xs text-gray-400">%</span>
                </div>
              </div>
              <div>
                <label className={labelClass}>الضريبة على المبيعات (%)</label>
                <div className="relative">
                  <input
                    {...register('commissionTaxData.taxRate', { valueAsNumber: true })}
                    type="number" min="0" max="100" placeholder="0" className={inputClass} dir="ltr"
                  />
                  <span className="absolute right-2 top-2.5 text-xs text-gray-400">%</span>
                </div>
              </div>
            </div>
          </AccordionSection>

          {/* ===== 8. المصاريف الشهرية ===== */}
          <AccordionSection
            title={`المصاريف الشهرية (${expensesTotal.toLocaleString()})`}
            icon={Receipt}
            isOpen={openSections.expenses}
            onToggle={() => toggleSection('expenses')}
            accentColor="orange"
          >
            <div className="space-y-2">
              {/* Auto-computed depreciation */}
              {(() => {
                const eqT = equipments.reduce((s: number, e: any) => s + (Number(e.value) || 0), 0);
                const esT = estExpenses.reduce((s: number, e: any) => s + (Number(e.value) || 0), 0);
                const dep = Math.round((eqT + esT) / 36);
                return (
                  <div className="flex gap-2 items-center opacity-70">
                    <div className="flex-1 px-3 py-2 text-xs bg-gray-100 rounded-lg border border-gray-200 text-gray-600 font-medium flex items-center justify-between">
                      <span>إهلاك التجهيزات</span>
                      <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">آلي</span>
                    </div>
                    <div className="w-24 px-3 py-2 text-xs bg-gray-100 rounded-lg border border-gray-200 text-center font-bold text-gray-700" dir="ltr">
                      {dep.toLocaleString()}
                    </div>
                    <div className="w-7"></div>
                  </div>
                );
              })()}

              {expenseFields.map((field, idx) => (
                <div key={field.id} className="flex gap-2 items-center">
                  <input {...register(`monthlyExpensesData.expenses.${idx}.name`)} placeholder="اسم المصروف" className={`flex-1 ${inputClass}`} />
                  <input {...register(`monthlyExpensesData.expenses.${idx}.value`, { valueAsNumber: true })} type="number" min="0" placeholder="0" className={`w-24 ${numberInputClass}`} dir="ltr" />
                  <button type="button" onClick={() => removeExpense(idx)} className="text-gray-400 hover:text-red-500 p-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {expenseFields.length < 19 && (
                <button type="button" onClick={() => appendExpense({ name: '', value: 0 })} className="text-indigo-600 text-xs font-medium flex items-center hover:text-indigo-800">
                  <Plus className="w-3.5 h-3.5 ml-1" /> أضف مصروفاً
                </button>
              )}
            </div>
          </AccordionSection>

        </div>

        {/* Footer — Save / Cancel */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-4 py-3 rounded-xl text-sm font-bold transition-colors shadow-sm"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                حفظ التعديلات
              </>
            )}
          </button>
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 rounded-xl text-sm font-bold transition-colors"
          >
            <Undo2 className="w-4 h-4" />
            إلغاء
          </button>
        </div>
      </div>
    </>
  );
}
