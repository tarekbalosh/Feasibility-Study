import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Save,
  Plus,
  Loader2,
  Calendar,
  User,
  Eye,
  Weight,
  DollarSign,
  Flag,
  AlertCircle,
  BarChart2,
  Repeat,
  SplitSquareHorizontal,
  CheckCircle2,
} from "lucide-react";
import clsx from "clsx";
import { BudgetWizardModal } from "./BudgetWizardModal";

export type BudgetDistributionMode = "lump" | "monthly" | "custom";

export interface BudgetDistribution {
  mode: BudgetDistributionMode;
  /** القيم الشهرية — 12 عنصر من يناير (0) إلى ديسمبر (11) */
  monthly: number[];
  /** شهر الدفعة الواحدة (0-11) عند اختيار lump */
  lumpMonth?: number;
  /** شهر بداية التوزيع الشهري (0-11) */
  startMonth?: number;
  /** شهر نهاية التوزيع الشهري (0-11) */
  endMonth?: number;
}

export interface TaskFormData {
  title: string;
  dueDate: string;
  assignee: string;
  follower: string;
  weight: number;
  cost: number;
  currency: string;
  priority: "normal" | "medium" | "high";
  status?: "not_started" | "in_progress" | "overdue" | "completed";
  progress?: number;
  budgetDistribution?: BudgetDistribution;
}

interface TaskModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: TaskFormData | TaskFormData[], addAnother: boolean) => Promise<void>;
  /** البيانات الحالية عند التعديل */
  initialData?: TaskFormData | null;
  /** رقم الهدف */
  goalIndex: number;
  /** نص الهدف (مختصر) */
  goalText: string;
  /** رقم المهمة (جديدة) */
  taskIndex: number;
  /** مجموع الأوزان الحالية لمهام الهدف (بدون المهمة الحالية عند التعديل) */
  currentWeightSum: number;
  /** قائمة أعضاء مساحة العمل */
  members: { id: string; name: string; email: string; role?: string }[];
  /** عملة المشروع الافتراضية */
  defaultCurrency?: string;
  /** هل هو تعديل */
  isEdit?: boolean;
}

const PRIORITY_OPTIONS = [
  { value: "normal", label: "عادية", color: "text-slate-600 bg-slate-50 border-slate-200" },
  { value: "medium", label: "متوسطة", color: "text-amber-600 bg-amber-50 border-amber-200" },
  { value: "high", label: "عالية", color: "text-red-600 bg-red-50 border-red-200" },
];

const STATUS_OPTIONS = [
  { value: "not_started", label: "لم تبدأ" },
  { value: "in_progress", label: "قيد الإنجاز" },
  { value: "overdue", label: "متأخرة" },
  { value: "completed", label: "أُنجزت" },
];

const ar = (value: number): string => value.toLocaleString("ar-EG");

const MONTH_NAMES = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

const createEmptyMonthly = (): number[] => Array(12).fill(0);

const buildLumpDistribution = (cost: number, month: number): number[] => {
  const m = createEmptyMonthly();
  m[month] = cost;
  return m;
};

const buildMonthlyDistribution = (cost: number, start: number, end: number): number[] => {
  const m = createEmptyMonthly();
  if (start > end) return m;
  const count = end - start + 1;
  const perMonth = Math.floor((cost / count) * 100) / 100;
  let remainder = Math.round((cost - perMonth * count) * 100) / 100;
  for (let i = start; i <= end; i++) {
    m[i] = perMonth + (remainder > 0 ? 0.01 : 0);
    if (remainder > 0) remainder = Math.round((remainder - 0.01) * 100) / 100;
  }
  return m;
};

export const TaskModal: React.FC<TaskModalProps> = ({
  open,
  onClose,
  onSave,
  initialData,
  goalIndex,
  goalText,
  taskIndex,
  currentWeightSum,
  members,
  defaultCurrency = "SAR",
  isEdit = false,
}) => {
  const [form, setForm] = useState<TaskFormData>({
    title: "",
    dueDate: "",
    assignee: "",
    follower: "",
    weight: 10,
    cost: 0,
    currency: defaultCurrency,
    priority: "normal",
    status: "not_started",
    progress: 0,
    budgetDistribution: undefined,
  });

  // ── حالة الـ Wizard ──
  const [showBudgetWizard, setShowBudgetWizard] = useState(false);

      const [errors, setErrors] = useState<Partial<Record<keyof TaskFormData | "multiTitles", string>>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState("");
  const [followerSearch, setFollowerSearch] = useState("");
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [showFollowerDropdown, setShowFollowerDropdown] = useState(false);
  const [addMode, setAddMode] = useState<"single" | "multiple">("single");
  const [multiTitles, setMultiTitles] = useState("");

  const [isCustomAssignee, setIsCustomAssignee] = useState(false);
  const [customAssigneeName, setCustomAssigneeName] = useState("");
  const [customAssigneeContact, setCustomAssigneeContact] = useState("");

  const [isCustomFollower, setIsCustomFollower] = useState(false);
  const [customFollowerName, setCustomFollowerName] = useState("");
  const [customFollowerContact, setCustomFollowerContact] = useState("");

  const assigneeRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  // تعبئة البيانات عند التعديل
  useEffect(() => {
    if (initialData) {
      setForm(initialData);
      const assigneeMember = members.find((m) => m.id === initialData.assignee || m.name === initialData.assignee);
      setAssigneeSearch(assigneeMember?.name || initialData.assignee || "");
      const followerMember = members.find((m) => m.id === initialData.follower || m.name === initialData.follower);
      setFollowerSearch(followerMember?.name || initialData.follower || "");
    } else {
      setForm({
        title: "",
        dueDate: "",
        assignee: "",
        follower: "",
        weight: Math.min(10, 100 - currentWeightSum),
        cost: 0,
        currency: defaultCurrency,
        priority: "normal",
        status: "not_started",
        progress: 0,
        budgetDistribution: undefined,
      });
      setAssigneeSearch("");
      setFollowerSearch("");
    }
    setErrors({});
    setIsCustomAssignee(false);
    setIsCustomFollower(false);
    setAddMode("single");
    setMultiTitles("");
    setShowBudgetWizard(false);
  }, [initialData, open, currentWeightSum, defaultCurrency, members]);

  // تركيز على حقل العنوان عند الفتح
  useEffect(() => {
    if (open) setTimeout(() => titleRef.current?.focus(), 100);
  }, [open]);

  // إغلاق القوائم المنسدلة عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (assigneeRef.current && !assigneeRef.current.contains(e.target as Node))
        setShowAssigneeDropdown(false);
      if (followerRef.current && !followerRef.current.contains(e.target as Node))
        setShowFollowerDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const remainingWeight = 100 - currentWeightSum;
  const weightAfterSave = currentWeightSum + form.weight;
  const isWeightOver = weightAfterSave > 100;

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof TaskFormData | "multiTitles", string>> = {};
    
    if (addMode === "single") {
      if (!form.title.trim()) newErrors.title = "عنوان المهمة مطلوب.";
      if (form.weight < 1 || form.weight > 100) newErrors.weight = "الوزن يجب أن يكون بين 1% و 100%.";
      if (isWeightOver) newErrors.weight = `مجموع الأوزان سيتجاوز 100%. المتبقي: ${remainingWeight}%.`;
      if (form.cost < 0) newErrors.cost = "التكلفة لا يمكن أن تكون سالبة.";
    } else {
      const titles = multiTitles.split("\n").map(t => t.trim()).filter(Boolean);
      if (titles.length === 0) newErrors.multiTitles = "يجب إدخال مهمة واحدة على الأقل.";
      else {
        const wPerTask = Math.floor(remainingWeight / titles.length);
        if (wPerTask < 1) newErrors.multiTitles = `الوزن المتبقي (${remainingWeight}%) لا يكفي لـ ${titles.length} مهام. (الحد الأدنى 1% لكل مهمة).`;
      }
    }

    if (!form.dueDate) newErrors.dueDate = "تاريخ الإنجاز مطلوب.";
    if (!form.assignee) newErrors.assignee = "يجب تحديد المسؤول عن التنفيذ.";
    if (!form.follower) newErrors.follower = "يجب تحديد المعني بالمتابعة.";
    if (form.assignee && form.follower && form.assignee === form.follower)
      newErrors.follower = "لا يمكن أن يكون المتابع نفس المسؤول.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (addAnother: boolean) => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      if (addMode === "single") {
        await onSave(form, addAnother);
      } else {
        const titles = multiTitles.split("\n").map(t => t.trim()).filter(Boolean);
        const wPerTask = Math.floor(remainingWeight / titles.length);
        const tasksToSave: TaskFormData[] = titles.map(title => ({
          ...form,
          title,
          weight: wPerTask,
          cost: 0,
          budgetDistribution: undefined,
        }));
        await onSave(tasksToSave, addAnother);
      }

      if (addAnother) {
        setForm({
          title: "",
          dueDate: form.dueDate,
          assignee: "",
          follower: "",
          weight: Math.min(10, remainingWeight - (addMode === "single" ? form.weight : 0)),
          cost: 0,
          currency: form.currency,
          priority: "normal",
          status: "not_started",
          progress: 0,
        });
        setMultiTitles("");
        setAssigneeSearch("");
        setFollowerSearch("");
        setErrors({});
        setIsCustomAssignee(false);
        setIsCustomFollower(false);
        if (addMode === "single") titleRef.current?.focus();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const filteredAssignees = members.filter(
    (m) =>
      m.role !== 'owner' && m.role !== 'admin' &&
      (m.name.toLowerCase().includes(assigneeSearch.toLowerCase()) ||
       m.email.toLowerCase().includes(assigneeSearch.toLowerCase()))
  );

  const filteredFollowers = members.filter(
    (m) =>
      m.id !== form.assignee &&
      (m.name.toLowerCase().includes(followerSearch.toLowerCase()) ||
        m.email.toLowerCase().includes(followerSearch.toLowerCase()))
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl max-h-[90vh] rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-gradient-to-l from-slate-50 to-white">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-bold text-slate-900">
              {isEdit
                ? `تعديل مهمة ${ar(goalIndex)}.${ar(taskIndex)}`
                : `إضافة مهمة ${ar(goalIndex)}.${ar(taskIndex)} للهدف رقم ${ar(goalIndex)}`}
            </h2>
            <p className="text-xs text-slate-500 line-clamp-1 max-w-md">{goalText}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toggle Mode */}
        {!isEdit && (
          <div className="px-5 pt-5 pb-2">
            <div className="flex p-1 bg-slate-100/80 rounded-xl">
              <button
                type="button"
                onClick={() => { setAddMode("single"); setErrors({}); }}
                className={clsx(
                  "flex-1 py-2 text-sm font-bold rounded-lg transition-all",
                  addMode === "single" ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200/50" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                )}
              >
                مهمة واحدة
              </button>
              <button
                type="button"
                onClick={() => { setAddMode("multiple"); setErrors({}); }}
                className={clsx(
                  "flex-1 py-2 text-sm font-bold rounded-lg transition-all",
                  addMode === "multiple" ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200/50" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                )}
              >
                إضافة عدة مهام
              </button>
            </div>
          </div>
        )}


        {/* Weight indicator */}
        <div className={clsx("px-5 py-2.5 bg-slate-50 border-b border-slate-100", !isEdit && "border-t mt-3")}>
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-600">مجموع الأوزان</span>
            <span className={clsx("font-bold", isWeightOver ? "text-red-600" : weightAfterSave === 100 ? "text-emerald-600" : "text-amber-600")}>
              {ar(weightAfterSave)}% {isWeightOver ? `— تجاوز بـ ${ar(weightAfterSave - 100)}%` : weightAfterSave === 100 ? "✓ مكتمل" : `— متبقٍّ ${ar(100 - weightAfterSave)}%`}
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full mt-1.5 overflow-hidden">
            <div
              className={clsx("h-full rounded-full transition-all duration-500", isWeightOver ? "bg-red-500" : weightAfterSave === 100 ? "bg-emerald-500" : "bg-amber-500")}
              style={{ width: `${Math.min(weightAfterSave, 100)}%` }}
            />
          </div>
        </div>

        {/* Form Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {/* عنوان المهمة — عرض كامل */}
          {addMode === "single" && (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                عنوان المهمة (الوسيلة) <span className="text-red-500">*</span>
              </label>
              <input
                ref={titleRef}
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="مثال: تصميم الهوية البصرية للمشروع"
                className={clsx(
                  "w-full px-4 py-3 rounded-xl border bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 transition-all",
                  errors.title ? "border-red-300 focus:ring-red-400/30" : "border-slate-200 focus:ring-indigo-500/30 focus:border-indigo-400"
                )}
              />
              {errors.title && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.title}</p>}
            </div>
          )}

          {/* عناوين المهام - متعدد */}
          {addMode === "multiple" && (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-2">
                عناوين المهام <span className="text-red-500">*</span>
                <span className="text-[11px] font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">كل مهمة في سطر منفصل</span>
              </label>
              <textarea
                rows={5}
                value={multiTitles}
                onChange={(e) => setMultiTitles(e.target.value)}
                placeholder={"المهمة الأولى...\nالمهمة الثانية...\nالمهمة الثالثة..."}
                className={clsx(
                  "w-full px-4 py-3 rounded-xl border bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 transition-all resize-none leading-relaxed",
                  errors.multiTitles ? "border-red-300 focus:ring-red-400/30" : "border-slate-200 focus:ring-indigo-500/30 focus:border-indigo-400"
                )}
              />
              {errors.multiTitles && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.multiTitles}</p>}
            </div>
          )}


          {/* شبكة من عمودين */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* تاريخ الإنجاز */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                <Calendar className="w-3.5 h-3.5 inline-block ml-1 opacity-50" />
                تاريخ الإنجاز <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className={clsx(
                  "w-full px-4 py-3 rounded-xl border bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 transition-all",
                  errors.dueDate ? "border-red-300 focus:ring-red-400/30" : "border-slate-200 focus:ring-indigo-500/30 focus:border-indigo-400"
                )}
              />
              {errors.dueDate && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.dueDate}</p>}
            </div>

            {/* الأهمية */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                <Flag className="w-3.5 h-3.5 inline-block ml-1 opacity-50" />
                الأهمية
              </label>
              <div className="flex gap-2">
                {PRIORITY_OPTIONS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setForm({ ...form, priority: p.value as TaskFormData["priority"] })}
                    className={clsx(
                      "flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all",
                      form.priority === p.value ? `${p.color} ring-2 ring-offset-1 ring-current shadow-sm` : "text-slate-400 bg-white border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* المسؤول عن التنفيذ */}
            <div ref={assigneeRef} className="relative">
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                <User className="w-3.5 h-3.5 inline-block ml-1 opacity-50" />
                المسؤول عن التنفيذ <span className="text-red-500">*</span>
              </label>
              
              {isCustomAssignee ? (
                <div className="flex flex-col gap-2 mt-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <input
                    type="text"
                    placeholder="الاسم الكامل"
                    value={customAssigneeName}
                    onChange={(e) => setCustomAssigneeName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                  <input
                    type="text"
                    placeholder="رقم الجوال أو الإيميل"
                    value={customAssigneeContact}
                    onChange={(e) => setCustomAssigneeContact(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                  <div className="flex gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (customAssigneeName.trim()) {
                          const val = customAssigneeContact.trim() ? `${customAssigneeName.trim()} (${customAssigneeContact.trim()})` : customAssigneeName.trim();
                          setForm({ ...form, assignee: val });
                          setAssigneeSearch(val);
                          setIsCustomAssignee(false);
                          setShowAssigneeDropdown(false);
                        }
                      }}
                      className="flex-1 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold hover:bg-indigo-200 transition-colors"
                    >
                      إضافة
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCustomAssignee(false)}
                      className="flex-1 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    value={assigneeSearch}
                    onChange={(e) => { setAssigneeSearch(e.target.value); setShowAssigneeDropdown(true); setForm({ ...form, assignee: "" }); }}
                    onFocus={() => setShowAssigneeDropdown(true)}
                    placeholder="ابحث في فريق العمل..."
                    className={clsx(
                      "w-full px-4 py-3 rounded-xl border bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 transition-all",
                      errors.assignee ? "border-red-300 focus:ring-red-400/30" : "border-slate-200 focus:ring-indigo-500/30 focus:border-indigo-400"
                    )}
                  />
                  {showAssigneeDropdown && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto flex flex-col">
                      {filteredAssignees.length > 0 ? (
                        filteredAssignees.map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => { setForm({ ...form, assignee: m.name }); setAssigneeSearch(m.name); setShowAssigneeDropdown(false); }}
                            className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-indigo-50 text-right transition-colors"
                          >
                            <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">
                              {m.name.charAt(0)}
                            </span>
                            <div className="flex flex-col items-start">
                              <span className="text-sm font-semibold text-slate-800">{m.name}</span>
                              <span className="text-[11px] text-slate-400">{m.email}</span>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-xs text-slate-500 text-center">لا توجد نتائج مطابقة</div>
                      )}
                      
                      <div className="p-2 border-t border-slate-100 bg-slate-50 mt-auto sticky bottom-0">
                        <button
                          type="button"
                          onClick={() => {
                            setIsCustomAssignee(true);
                            setCustomAssigneeName(assigneeSearch);
                            setCustomAssigneeContact("");
                          }}
                          className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-indigo-600 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          إضافة شخص من خارج مساحة العمل
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
              {errors.assignee && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.assignee}</p>}
            </div>

            {/* المعني بالمتابعة */}
            <div ref={followerRef} className="relative">
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                <Eye className="w-3.5 h-3.5 inline-block ml-1 opacity-50" />
                المعني بالمتابعة <span className="text-red-500">*</span>
              </label>
              
              {isCustomFollower ? (
                <div className="flex flex-col gap-2 mt-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <input
                    type="text"
                    placeholder="الاسم الكامل"
                    value={customFollowerName}
                    onChange={(e) => setCustomFollowerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                  <input
                    type="text"
                    placeholder="رقم الجوال أو الإيميل"
                    value={customFollowerContact}
                    onChange={(e) => setCustomFollowerContact(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                  <div className="flex gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (customFollowerName.trim()) {
                          const val = customFollowerContact.trim() ? `${customFollowerName.trim()} (${customFollowerContact.trim()})` : customFollowerName.trim();
                          setForm({ ...form, follower: val });
                          setFollowerSearch(val);
                          setIsCustomFollower(false);
                          setShowFollowerDropdown(false);
                        }
                      }}
                      className="flex-1 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-200 transition-colors"
                    >
                      إضافة
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCustomFollower(false)}
                      className="flex-1 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    value={followerSearch}
                    onChange={(e) => { setFollowerSearch(e.target.value); setShowFollowerDropdown(true); setForm({ ...form, follower: "" }); }}
                    onFocus={() => setShowFollowerDropdown(true)}
                    placeholder="ابحث في فريق العمل..."
                    className={clsx(
                      "w-full px-4 py-3 rounded-xl border bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 transition-all",
                      errors.follower ? "border-red-300 focus:ring-red-400/30" : "border-slate-200 focus:ring-indigo-500/30 focus:border-indigo-400"
                    )}
                  />
                  {showFollowerDropdown && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto flex flex-col">
                      {filteredFollowers.length > 0 ? (
                        filteredFollowers.map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => { setForm({ ...form, follower: m.name }); setFollowerSearch(m.name); setShowFollowerDropdown(false); }}
                            className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-emerald-50 text-right transition-colors"
                          >
                            <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold shrink-0">
                              {m.name.charAt(0)}
                            </span>
                            <div className="flex flex-col items-start">
                              <span className="text-sm font-semibold text-slate-800">{m.name}</span>
                              <span className="text-[11px] text-slate-400">{m.email}</span>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-xs text-slate-500 text-center">لا توجد نتائج مطابقة</div>
                      )}
                      
                      <div className="p-2 border-t border-slate-100 bg-slate-50 mt-auto sticky bottom-0">
                        <button
                          type="button"
                          onClick={() => {
                            setIsCustomFollower(true);
                            setCustomFollowerName(followerSearch);
                            setCustomFollowerContact("");
                          }}
                          className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-emerald-600 bg-white border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          إضافة شخص من خارج مساحة العمل
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
              {errors.follower && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.follower}</p>}
            </div>

            {/* الوزن النسبي + التكلفة — صف واحد */}
              {addMode === "single" && (
                <>
                  {/* الوزن */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                      <Weight className="w-3.5 h-3.5 inline-block ml-1 opacity-50" />
                      الوزن النسبي (%) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={remainingWeight}
                      value={form.weight === 0 ? "" : form.weight}
                      onChange={(e) => setForm({ ...form, weight: e.target.value === "" ? 0 : parseInt(e.target.value) || 0 })}
                      className={clsx(
                        "w-full px-4 py-3 rounded-xl border bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 transition-all",
                        errors.weight ? "border-red-300 focus:ring-red-400/30" : "border-slate-200 focus:ring-indigo-500/30 focus:border-indigo-400"
                      )}
                    />
                    {errors.weight && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.weight}</p>}
                  </div>

                  {/* التكلفة */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                      <DollarSign className="w-3.5 h-3.5 inline-block ml-1 opacity-50" />
                      التكلفة / الموازنة
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={form.cost === 0 ? "" : form.cost}
                        onChange={(e) => {
                          const newCost = e.target.value === "" ? 0 : parseFloat(e.target.value) || 0;
                          setForm({ ...form, cost: newCost, budgetDistribution: newCost <= 0 ? undefined : form.budgetDistribution });
                        }}
                        placeholder="0"
                        className={clsx(
                          "flex-1 px-4 py-3 rounded-xl border bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 transition-all",
                          errors.cost ? "border-red-300 focus:ring-red-400/30" : "border-slate-200 focus:ring-indigo-500/30 focus:border-indigo-400"
                        )}
                      />
                      <select
                        value={form.currency}
                        onChange={(e) => setForm({ ...form, currency: e.target.value })}
                        className="w-20 px-2 py-3 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      >
                        <option value="SAR">ر.س</option>
                        <option value="AED">د.إ</option>
                        <option value="USD">$</option>
                        <option value="EUR">€</option>
                        <option value="KWD">د.ك</option>
                        <option value="QAR">ر.ق</option>
                        <option value="BHD">د.ب</option>
                        <option value="OMR">ر.ع</option>
                        <option value="EGP">ج.م</option>
                      </select>
                    </div>
                    {errors.cost && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.cost}</p>}

                    {/* زر الـ Wizard */}
                    {form.cost > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowBudgetWizard(true)}
                        className={clsx(
                          "mt-2 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-bold transition-all",
                          form.budgetDistribution
                            ? "bg-violet-600 text-white border-violet-600 shadow-sm"
                            : "bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-100"
                        )}
                      >
                        <BarChart2 className="w-3.5 h-3.5" />
                        {form.budgetDistribution ? "✅ تم تحديد التوزيع — اضغط للتعديل" : "توزيع الميزانية"}
                      </button>
                    )}
                  </div>
                </>
              )}

            {addMode === "multiple" && (
              <div className="col-span-1 sm:col-span-2 mt-2">
                <div className="flex items-start gap-2.5 px-4 py-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl text-indigo-700 text-[13px] font-semibold leading-relaxed">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-indigo-500" />
                  <div>
                    سيتم تقسيم الوزن المتبقي ({ar(remainingWeight)}%) بالتساوي على المهام المضافة. 
                    <span className="block mt-1 font-normal opacity-80 text-xs">
                      (التكلفة ستكون 0 ويمكن تعديلها لاحقاً لكل مهمة على حدة).
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* الحالة ونسبة الإنجاز — عند التعديل فقط */}
          {isEdit && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">الحالة</label>
                <select
                  value={form.status}
                  onChange={(e) => {
                    const newStatus = e.target.value as TaskFormData["status"];
                    setForm({
                      ...form,
                      status: newStatus,
                      progress: newStatus === "completed" ? 100 : form.progress,
                    });
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  نسبة الإنجاز: {ar(form.progress || 0)}%
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={form.progress || 0}
                  onChange={(e) => {
                    const p = parseInt(e.target.value);
                    setForm({
                      ...form,
                      progress: p,
                      status: p === 100 ? "completed" : form.status === "completed" ? "in_progress" : form.status,
                    });
                  }}
                  className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>٠%</span>
                  <span>٥٠%</span>
                  <span>١٠٠%</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 px-5 py-4 bg-slate-50 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-100 px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
          >
            إلغاء
          </button>

          {!isEdit && (
            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={isSaving}
              className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 px-5 py-2.5 text-sm font-bold text-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              "حفظ وإضافة مهمة أخرى"
            </button>
          )}

          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#5452F6] hover:bg-[#4338CA] px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all focus:outline-none focus:ring-2 focus:ring-[#5452F6]/50 focus:ring-offset-2 disabled:opacity-50 hover:-translate-y-0.5"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            "حفظ المهمة"
          </button>
        </div>
      </div>

      {/* ── Budget Wizard Modal ── */}
      <BudgetWizardModal
        open={showBudgetWizard}
        onClose={() => setShowBudgetWizard(false)}
        onConfirm={(distribution) => setForm(prev => ({ ...prev, budgetDistribution: distribution }))}
        cost={form.cost}
        currency={form.currency}
        initialDistribution={form.budgetDistribution}
      />
    </div>
  );
};

export default TaskModal;
