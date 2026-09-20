import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "react-hot-toast"
import { MAX_CUSTOM_ITEMS_PER_CATEGORY } from "@/config/swotSuggestions"
import {
  buildSelectionPayload,
  countAllSelected,
  findConflicts,
  normalizeStoredSelections,
  toSwotItems,
  validateCustomItem,
  validateEditCustomItem,
} from "@/utils/swotSelections"
import { withReportDefaults } from "@/utils/swotReport"
import * as toolRunsService from "@/services/toolRuns.service"
import {
  emptySwotSelections,
  type SwotAnalysis,
  type SwotApiResponse,
  type SwotInput,
  type SwotQuadrantKey,
  type SwotSelections,
} from "@/types/swot"

/** مفتاح المسودة في localStorage — نفس أسلوب حفظ مسودات أداة دراسة الجدوى */
const DRAFT_KEY = "swot-tool-draft"

/**
 * مراحل الأداة:
 * form → selection → generating → result
 * شاشة الاختيار (selection) اختيارية بالكامل ويمكن تخطّيها.
 */
export type SwotPhase = "form" | "selection" | "generating" | "result"

export type SwotFieldErrors = Partial<Record<keyof SwotInput, string>>

/** رسالة الخطأ الظاهرة تحت حقل الإضافة اليدوية في كل مجموعة */
export type SwotCustomErrors = Partial<Record<SwotQuadrantKey, string>>

const emptyInput: SwotInput = {
  projectName: "",
  sector: "",
  description: "",
  targetMarket: "",
  competitors: "",
  stage: "idea",
}

interface StoredDraft {
  input: SwotInput
  analysis: SwotAnalysis | null
  selections: SwotSelections
  /** معرّف السجل في لوحة التحكم — وجوده يعني تحديثاً لا إضافة */
  runId?: string | null
}

/**
 * تُقرأ المسودة مرّة واحدة عند التحميل. الأرباع في المسودات القديمة
 * محفوظة كقوائم نصوص، فنرقّيها إلى بنود قبل التصيير.
 */
const readDraft = (): StoredDraft | null => {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<StoredDraft>
    if (!parsed?.input) return null

    const storedAnalysis = parsed.analysis as any
    // withReportDefaults يُكمل ما لا تحمله التقارير المحفوظة قبل إضافة
    // الخاتمة: المعرّف وتاريخ التوليد والأولويات
    const analysis: SwotAnalysis | null = storedAnalysis
      ? withReportDefaults({
          ...storedAnalysis,
          strengths: toSwotItems(storedAnalysis.strengths),
          weaknesses: toSwotItems(storedAnalysis.weaknesses),
          opportunities: toSwotItems(storedAnalysis.opportunities),
          threats: toSwotItems(storedAnalysis.threats),
        })
      : null

    return {
      input: { ...emptyInput, ...parsed.input },
      analysis,
      runId: parsed.runId ?? null,
      selections: normalizeStoredSelections(parsed.selections),
    }
  } catch {
    return null
  }
}

/** تحقّق من المدخلات على الطرف العميل — يطابق مخطط الـ API */
const validate = (input: SwotInput): SwotFieldErrors => {
  const errors: SwotFieldErrors = {}

  if (input.projectName.trim().length < 2) {
    errors.projectName = "اسم المشروع مطلوب"
  } else if (input.projectName.trim().length > 100) {
    errors.projectName = "الحد الأقصى 100 حرف"
  }

  if (!input.sector) {
    errors.sector = "يرجى اختيار قطاع المشروع"
  }

  const description = input.description.trim()
  if (description.length < 30) {
    errors.description = `الحد الأدنى 30 حرفاً (المتبقي ${30 - description.length})`
  } else if (description.length > 1000) {
    errors.description = "الحد الأقصى 1000 حرف"
  }

  return errors
}

export const useSwotTool = () => {
  const [input, setInput] = useState<SwotInput>(emptyInput)
  const [selections, setSelections] = useState<SwotSelections>(
    emptySwotSelections
  )
  const [analysis, setAnalysis] = useState<SwotAnalysis | null>(null)
  const [phase, setPhase] = useState<SwotPhase>("form")
  const [errors, setErrors] = useState<SwotFieldErrors>({})
  const [customErrors, setCustomErrors] = useState<SwotCustomErrors>({})
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [draftRestored, setDraftRestored] = useState(false)

  /**
   * معرّف التحليل في لوحة التحكم.
   * يُحفظ مع المسودة، فإعادة التوليد أو تعديل البنود تُحدّث السجل نفسه
   * بدل أن تُراكم نسخاً من المشروع ذاته.
   */
  const runIdRef = useRef<string | null>(null)

  /** حالة المزامنة مع لوحة التحكم — تعرضها الواجهة بسطر خفيف */
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle")

  /** عدّاد تصاعدي لمعرّفات البنود المخصّصة — يضمن التفرّد داخل الجلسة */
  const customSeq = useRef(0)

  // ── استعادة المسودة عند أول تحميل ─────────────────────────
  // بناءً على طلب المستخدم، نبدأ من الصفر دائماً ونمسح المسودة القديمة
  useEffect(() => {
    if (typeof window !== "undefined" && !window.location.search.includes("run=")) {
      window.localStorage.removeItem(DRAFT_KEY)
    }
  }, [])

  /**
   * تحميل تحليل محفوظ من لوحة التحكم إلى داخل الأداة.
   * يُبقي المعرّف، فأي تعديل بعد الفتح يُحدّث السجل نفسه لا ينسخه.
   */
  const loadSavedRun = useCallback(async (runId: string) => {
    setPhase("generating")

    try {
      const run = await toolRunsService.getToolRun<SwotInput, SwotAnalysis>(runId)

      if (!run.output) {
        throw new Error("التحليل المحفوظ فارغ أو تالف.")
      }

      runIdRef.current = run.id
      if (run.input) setInput({ ...emptyInput, ...run.input })

      const stored = run.output as any
      setAnalysis(
        withReportDefaults({
          ...stored,
          strengths: toSwotItems(stored.strengths),
          weaknesses: toSwotItems(stored.weaknesses),
          opportunities: toSwotItems(stored.opportunities),
          threats: toSwotItems(stored.threats),
        })
      )
      setPhase("result")
      setSaveState("saved")
    } catch {
      setGenerateError(
        "تعذّر فتح التحليل المحفوظ. قد يكون حُذف أو أنك لا تملك صلاحية الوصول إليه."
      )
      setPhase("form")
    }
  }, [])

  // ── حفظ المسودة عند كل تغيير ──────────────────────────────
  // تم إيقاف الحفظ التلقائي في localStorage بناءً على طلب المستخدم لضمان البدء من الصفر

  const setField = useCallback(
    <K extends keyof SwotInput>(key: K, value: SwotInput[K]) => {
      setInput((prev) => ({ ...prev, [key]: value }))
      setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev))
    },
    []
  )

  // ── الانتقال من النموذج إلى شاشة اختيار العناصر ────────────
  const goToSelection = useCallback(() => {
    const validationErrors = validate(input)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      toast.error("يرجى إكمال الحقول المطلوبة قبل بدء التحليل")
      return
    }
    setErrors({})
    setPhase("selection")
  }, [input])

  /** العودة من شاشة الاختيار إلى النموذج — الحالة كلها محفوظة */
  const backToForm = useCallback(() => setPhase("form"), [])

  // ── تفاعلات شاشة الاختيار ─────────────────────────────────

  const toggleSelection = useCallback(
    (category: SwotQuadrantKey, id: string) => {
      setSelections((prev) => {
        const current = prev[category]
        const isSelected = current.selectedIds.includes(id)
        return {
          ...prev,
          [category]: {
            ...current,
            selectedIds: isSelected
              ? current.selectedIds.filter((entry) => entry !== id)
              : [...current.selectedIds, id],
          },
        }
      })
    },
    []
  )

  /** إضافة بند مخصّص — يُدرَج محدَّداً تلقائياً */
  const addCustomItem = useCallback(
    (category: SwotQuadrantKey, rawLabel: string): boolean => {
      const error = validateCustomItem(rawLabel, category, selections[category])
      if (error) {
        setCustomErrors((prev) => ({ ...prev, [category]: error }))
        return false
      }

      customSeq.current += 1
      const id = `custom-${category}-${customSeq.current}-${Date.now().toString(36)}`
      const label = rawLabel.trim()

      setSelections((prev) => ({
        ...prev,
        [category]: {
          customItems: [...prev[category].customItems, { id, label }],
          selectedIds: [...prev[category].selectedIds, id],
        },
      }))
      setCustomErrors((prev) => ({ ...prev, [category]: undefined }))
      return true
    },
    [selections]
  )

  /** تعديل نص بند مخصّص قائم — بلا تغيير حالة تحديده */
  const editCustomItem = useCallback(
    (category: SwotQuadrantKey, id: string, rawLabel: string): boolean => {
      const error = validateEditCustomItem(
        rawLabel,
        category,
        selections[category],
        id
      )
      if (error) {
        setCustomErrors((prev) => ({ ...prev, [category]: error }))
        return false
      }

      const label = rawLabel.trim()
      setSelections((prev) => ({
        ...prev,
        [category]: {
          ...prev[category],
          customItems: prev[category].customItems.map((item) =>
            item.id === id ? { ...item, label } : item
          ),
        },
      }))
      setCustomErrors((prev) => ({ ...prev, [category]: undefined }))
      return true
    },
    [selections]
  )

  /** حذف بند مخصّص — بنود القوائم الجاهزة تُلغى فقط ولا تُحذف */
  const removeCustomItem = useCallback(
    (category: SwotQuadrantKey, id: string) => {
      setSelections((prev) => ({
        ...prev,
        [category]: {
          customItems: prev[category].customItems.filter(
            (item) => item.id !== id
          ),
          selectedIds: prev[category].selectedIds.filter(
            (entry) => entry !== id
          ),
        },
      }))
      setCustomErrors((prev) => ({ ...prev, [category]: undefined }))
    },
    []
  )

  const clearCustomError = useCallback((category: SwotQuadrantKey) => {
    setCustomErrors((prev) =>
      prev[category] ? { ...prev, [category]: undefined } : prev
    )
  }, [])

  /** مسح تحديدات مجموعة واحدة — البنود المخصّصة تبقى موجودة غير محدَّدة */
  const clearCategory = useCallback((category: SwotQuadrantKey) => {
    setSelections((prev) => ({
      ...prev,
      [category]: { ...prev[category], selectedIds: [] },
    }))
  }, [])

  const conflicts = useMemo(() => findConflicts(selections), [selections])
  const totalSelected = useMemo(() => countAllSelected(selections), [selections])

  // ── التوليد ───────────────────────────────────────────────

  /**
   * withSelections = false يعني «تخطّي» — نمرّر للتوليد بلا اختيارات
   * دون مسح ما اختاره المستخدم، حتى يجده كما هو إن رجع للخطوة.
   */
  /**
   * حفظ التحليل في لوحة التحكم.
   *
   * يجري في الخلفية ولا يُوقف المستخدم: فشلُه يُسجَّل في حالة المزامنة
   * فقط، لأن التحليل ظاهر أمامه ومحفوظ في المتصفح على أي حال — وقطعُ
   * تجربته بتنبيه أحمر بسبب تعثّر شبكة عقوبةٌ بلا مقابل.
   *
   * الزائر غير المسجَّل لا يُحاول أصلاً: المسار محروس بمساحة العمل.
   */
  const persist = useCallback(
    async (currentInput: SwotInput, currentAnalysis: SwotAnalysis) => {
      if (typeof window === "undefined") return
      if (!window.localStorage.getItem("accessToken")) return

      setSaveState("saving")

      try {
        const saved = await toolRunsService.saveToolRun({
          id: runIdRef.current ?? undefined,
          toolSlug: "swot",
          title: currentInput.projectName.trim() || "تحليل SWOT",
          summary: currentAnalysis.summary?.slice(0, 300) || undefined,
          input: currentInput,
          output: currentAnalysis,
        })

        runIdRef.current = saved.id
        setSaveState("saved")
      } catch (error: any) {
        // سجل حُذف من لوحة التحكم في تبويب آخر: ننسى معرّفه ليُنشأ
        // سجل جديد في المحاولة التالية بدل الفشل الأبدي.
        if (error?.response?.status === 404) {
          runIdRef.current = null
        }
        setSaveState("error")
      }
    },
    []
  )

  const runGeneration = useCallback(
    async (withSelections: boolean) => {
      const validationErrors = validate(input)
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors)
        setPhase("form")
        toast.error("يرجى إكمال الحقول المطلوبة قبل بدء التحليل")
        return
      }

      setErrors({})
      setGenerateError(null)
      setPhase("generating")

      try {
        // المسار محروس بمساحة العمل، فيلزمه رمز الدخول. fetch الخام
        // لا يمرّ باعتراض lib/axios الذي يرفق الرمز تلقائياً.
        const token =
          typeof window !== "undefined"
            ? window.localStorage.getItem("accessToken")
            : null

        const response = await fetch("/api/tools/swot", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            ...input,
            projectName: input.projectName.trim(),
            description: input.description.trim(),
            targetMarket: input.targetMarket?.trim() || undefined,
            competitors: input.competitors?.trim() || undefined,
            selections: withSelections
              ? buildSelectionPayload(selections)
              : undefined,
          }),
        })

        if (!response.ok) {
          const body = await response.json().catch(() => null)
          throw new Error(body?.message || "تعذّر إنشاء التحليل")
        }

        const { analysis: result } = (await response.json()) as SwotApiResponse
        // تطبيع عند حدود الحالة أيضاً لا عند قراءة المسودة وحدها: لا يدخل
        // الحالة تحليل ناقص المعرّف أو التاريخ أو الأولويات مهما كان مصدره
        const normalized = withReportDefaults(result)
        setAnalysis(normalized)
        setPhase("result")

        // الحفظ في لوحة التحكم لا يُنتظر: النتيجة معروضة أصلاً
        void persist(input, normalized)
      } catch (error: any) {
        const message =
          error?.message || "تعذّر إنشاء التحليل. يرجى المحاولة مرة أخرى."
        // نرجع إلى شاشة الاختيار محافظين على الاختيارات، مع زر إعادة المحاولة
        setGenerateError(message)
        setPhase("selection")
      }
    },
    [input, selections, persist]
  )

  /** توليد التحليل مع اختيارات المستخدم */
  const generate = useCallback(() => runGeneration(true), [runGeneration])

  /** تخطّي الاختيار — دع الذكاء الاصطناعي يقترح كل شيء */
  const skipSelection = useCallback(() => runGeneration(false), [runGeneration])

  const dismissGenerateError = useCallback(() => setGenerateError(null), [])

  // ── تحرير بنود المصفوفة بعد التوليد ───────────────────────
  /** حذف بند تعديلٌ على التقرير، فيُحدَّث تاريخ آخر تعديل معه */
  const removeItem = useCallback((quadrant: SwotQuadrantKey, index: number) => {
    setAnalysis((prev) =>
      prev
        ? {
            ...prev,
            [quadrant]: prev[quadrant].filter((_, i) => i !== index),
            updatedAt: new Date().toISOString(),
          }
        : prev
    )
  }, [])

  /** تعديل نص بند بعد التوليد — عنوانه وشرحه، تعديلٌ يُحدِّث تاريخ التقرير */
  const editItem = useCallback(
    (
      quadrant: SwotQuadrantKey,
      index: number,
      updates: { title: string; detail?: string }
    ) => {
      setAnalysis((prev) =>
        prev
          ? {
              ...prev,
              [quadrant]: prev[quadrant].map((item, i) =>
                i === index ? { ...item, ...updates } : item
              ),
              updatedAt: new Date().toISOString(),
            }
          : prev
      )
    },
    []
  )

  /** العودة إلى نموذج المدخلات دون فقدان التحليل الحالي */
  const editInput = useCallback(() => setPhase("form"), [])

  /** العودة إلى شاشة اختيار العناصر لتعديل الاختيارات قبل إعادة التوليد */
  const editSelection = useCallback(() => setPhase("selection"), [])

  /** العودة إلى التحليل بعد فتح النموذج دون إعادة توليد */
  const showResult = useCallback(() => setPhase("result"), [])

  const reset = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(DRAFT_KEY)
    }
    setInput(emptyInput)
    setSelections(emptySwotSelections())
    setAnalysis(null)
    setErrors({})
    setCustomErrors({})
    setGenerateError(null)
    setDraftRestored(false)
    setPhase("form")
  }, [])

  const isComplete = useMemo(
    () => Object.keys(validate(input)).length === 0,
    [input]
  )

  return {
    input,
    setField,
    errors,
    phase,
    analysis,
    draftRestored,
    isComplete,
    // شاشة اختيار العناصر
    selections,
    conflicts,
    totalSelected,
    customErrors,
    maxCustomItems: MAX_CUSTOM_ITEMS_PER_CATEGORY,
    goToSelection,
    backToForm,
    toggleSelection,
    addCustomItem,
    editCustomItem,
    removeCustomItem,
    clearCustomError,
    clearCategory,
    generateError,
    dismissGenerateError,
    // المزامنة مع لوحة التحكم
    saveState,
    savedRunId: runIdRef.current,
    loadSavedRun,
    // التوليد والنتيجة
    generate,
    skipSelection,
    removeItem,
    editItem,
    editInput,
    editSelection,
    showResult,
    reset,
  }
}

export default useSwotTool
