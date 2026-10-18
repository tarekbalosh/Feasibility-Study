import { useState, useCallback, useRef, useEffect } from "react"
import { toast } from "react-hot-toast"
import pestService, { GeneratePestPayload } from "@/services/pest.service"
import type {
  PestAnalysisDetail,
  PestDimension,
  PestCategory,
  PestFactor,
  PestCreationMode,
} from "@/types/pest"

export interface PendingSuggestion {
  id: string
  dimension: PestDimension
  category: PestCategory
  content: string
}

export interface ConfirmDialogState {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  onConfirm: () => void
}

export function usePestEditor(initialId?: string) {
  const [analysis, setAnalysis] = useState<PestAnalysisDetail | null>(null)
  const [loading, setLoading] = useState<boolean>(Boolean(initialId))
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [generatingScopes, setGeneratingScopes] = useState<Set<string>>(new Set())
  const [pendingSuggestions, setPendingSuggestions] = useState<PendingSuggestion[]>([])
  const [undoSnapshot, setUndoSnapshot] = useState<Record<PestDimension, Record<PestCategory, PestFactor[]>> | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  })

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null)

  const showSaveSuccess = useCallback(() => {
    setSaveState("saved")
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      setSaveState("idle")
    }, 2500)
  }, [])

  const loadAnalysis = useCallback(async (id: string) => {
    try {
      setLoading(true)
      const data = await pestService.get(id)
      setAnalysis(data)
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || "تعذّر تحميل تحليل PEST.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (initialId) {
      loadAnalysis(initialId)
    } else {
      setAnalysis(null)
      setLoading(false)
    }
  }, [initialId, loadAnalysis])

  // ── التعديل الفوري للبيانات الوصفية ──
  const updateMetadata = useCallback(
    async (fields: { title?: string; projectName?: string; projectDescription?: string; industry?: string; countryRegion?: string }) => {
      if (!analysis) return
      try {
        setSaveState("saving")
        setAnalysis((prev) => (prev ? { ...prev, ...fields } : null))
        await pestService.update(analysis.id, fields)
        showSaveSuccess()
      } catch (err) {
        setSaveState("error")
        toast.error("فشل حفظ التعديلات.")
      }
    },
    [analysis, showSaveSuccess]
  )

  // ── إضافة بند ──
  const addFactor = useCallback(
    async (dimension: PestDimension, category: PestCategory, content: string = "") => {
      if (!analysis) return
      try {
        setSaveState("saving")
        const defaultText = content ? content.trim() : ""
        const newFactor = await pestService.addFactor(analysis.id, {
          dimension,
          category,
          content: defaultText,
        })

        setAnalysis((prev) => {
          if (!prev) return null
          const dimObj = { ...prev.factors[dimension] }
          dimObj[category] = [...dimObj[category], newFactor]

          // تحديث نمط الإنشاء تلقائياً
          let nextMode: PestCreationMode = prev.creationMode
          if (prev.creationMode === "ai") nextMode = "hybrid"

          return {
            ...prev,
            creationMode: nextMode,
            factors: {
              ...prev.factors,
              [dimension]: dimObj,
            },
            factorsFlat: [...prev.factorsFlat, newFactor],
          }
        })
        showSaveSuccess()
        return newFactor
      } catch (err: any) {
        setSaveState("error")
        toast.error(err?.response?.data?.error?.message || "فشلت إضافة البند.")
      }
    },
    [analysis, showSaveSuccess]
  )

  // ── تعديل محتوى بند ──
  const updateFactor = useCallback(
    async (factorId: string, dimension: PestDimension, category: PestCategory, newContent: string) => {
      if (!analysis) return
      const clean = typeof newContent === "string" ? newContent.trim() : ""

      // تحديث متفائل في الواجهة فوراً
      setAnalysis((prev) => {
        if (!prev) return null
        const dimObj = { ...prev.factors[dimension] }
        dimObj[category] = dimObj[category].map((f) => {
          if (f.id === factorId) {
            return {
              ...f,
              content: clean,
              source: f.source === "ai" ? "ai_edited" : f.source,
            }
          }
          return f
        })
        return {
          ...prev,
          factors: {
            ...prev.factors,
            [dimension]: dimObj,
          },
          factorsFlat: prev.factorsFlat.map((f) =>
            f.id === factorId ? { ...f, content: clean, source: f.source === "ai" ? "ai_edited" : f.source } : f
          ),
        }
      })

      try {
        setSaveState("saving")
        const updated = await pestService.updateFactor(analysis.id, factorId, clean)
        setAnalysis((prev) => {
          if (!prev) return null
          const dimObj = { ...prev.factors[dimension] }
          dimObj[category] = dimObj[category].map((f) => (f.id === factorId ? updated : f))
          return {
            ...prev,
            factors: { ...prev.factors, [dimension]: dimObj },
            factorsFlat: prev.factorsFlat.map((f) => (f.id === factorId ? updated : f)),
          }
        })
        showSaveSuccess()
      } catch (err) {
        setSaveState("error")
        toast.error("فشل حفظ تعديل البند.")
      }
    },
    [analysis, showSaveSuccess]
  )

  // ── حذف بند ──
  const deleteFactor = useCallback(
    async (factorId: string, dimension: PestDimension, category: PestCategory) => {
      if (!analysis) return
      try {
        setSaveState("saving")
        setAnalysis((prev) => {
          if (!prev) return null
          const dimObj = { ...prev.factors[dimension] }
          dimObj[category] = dimObj[category].filter((f) => f.id !== factorId)
          return {
            ...prev,
            factors: {
              ...prev.factors,
              [dimension]: dimObj,
            },
            factorsFlat: prev.factorsFlat.filter((f) => f.id !== factorId),
          }
        })

        await pestService.deleteFactor(analysis.id, factorId)
        showSaveSuccess()
      } catch (err) {
        setSaveState("error")
        toast.error("فشل حذف البند.")
      }
    },
    [analysis, showSaveSuccess]
  )

  // ── إعادة الترتيب ──
  const reorderFactors = useCallback(
    async (dimension: PestDimension, category: PestCategory, reorderedList: PestFactor[]) => {
      if (!analysis) return

      // تحديث الواجهة فوراً
      setAnalysis((prev) => {
        if (!prev) return null
        const dimObj = { ...prev.factors[dimension] }
        dimObj[category] = reorderedList
        return {
          ...prev,
          factors: { ...prev.factors, [dimension]: dimObj },
        }
      })

      try {
        setSaveState("saving")
        const items = reorderedList.map((f, idx) => ({ id: f.id, sortOrder: idx }))
        await pestService.reorderFactors(analysis.id, items)
        showSaveSuccess()
      } catch (err) {
        setSaveState("error")
        toast.error("فشل حفظ ترتيب البنود.")
      }
    },
    [analysis, showSaveSuccess]
  )

  // ── نقل بند لأعلى أو لأسفل ──
  const moveFactor = useCallback(
    (dimension: PestDimension, category: PestCategory, factorId: string, direction: "up" | "down") => {
      if (!analysis) return
      const currentList = [...analysis.factors[dimension][category]]
      const idx = currentList.findIndex((f) => f.id === factorId)
      if (idx === -1) return

      const targetIdx = direction === "up" ? idx - 1 : idx + 1
      if (targetIdx < 0 || targetIdx >= currentList.length) return

      const temp = currentList[idx]
      currentList[idx] = currentList[targetIdx]
      currentList[targetIdx] = temp

      reorderFactors(dimension, category, currentList)
    },
    [analysis, reorderFactors]
  )

  // ── مفتاح نطاق التوليد لتحديد مؤشر التحميل ──
  const getScopeKey = (scope: "full" | "dimension" | "category", dim?: PestDimension, cat?: PestCategory) => {
    if (scope === "full") return "full"
    if (scope === "dimension") return `dim:${dim}`
    return `cat:${dim}:${cat}`
  }

  // ── استدعاء التوليد بالذكاء الاصطناعي ──
  const triggerGenerate = useCallback(
    async (
      scope: "full" | "dimension" | "category",
      dimension?: PestDimension,
      category?: PestCategory,
      strategy: "replace" | "append" = "replace",
      confirmOverwrite: boolean = false
    ) => {
      if (!analysis) return
      const scopeKey = getScopeKey(scope, dimension, category)

      // حفظ نسخة تراجع Snapshot قبل الاستبدال
      if (strategy === "replace") {
        setUndoSnapshot(JSON.parse(JSON.stringify(analysis.factors)))
      }

      setGeneratingScopes((prev) => new Set(prev).add(scopeKey))

      try {
        const payload: GeneratePestPayload = {
          scope,
          dimension,
          category,
          strategy,
          confirmOverwrite,
        }

        const res = await pestService.generate(analysis.id, payload)

        // 1. إذا طلب الخادم تأكيد الاستبدال لبنود يدوية
        if (res.requiresConfirmation) {
          setConfirmDialog({
            isOpen: true,
            title: "تأكيد استبدال بنود مخصصة",
            message:
              res.message ||
              `يحتوي هذا النطاق على ${res.protectedManualCount || ""} بنود قمت بكتابتها أو تعديلها يدوياً. استبدالها سيحذف هذه البنود ويستبدلها بتوليد جديد بالذكاء الاصطناعي. هل تريد المتابعة؟`,
            confirmText: "نعم، استبدل المحتوى",
            onConfirm: () => {
              setConfirmDialog((c) => ({ ...c, isOpen: false }))
              triggerGenerate(scope, dimension, category, "replace", true)
            },
          })
          return
        }

        // 2. إذا كنا في وضع append: نعرض البنود كبطاقات اقتراحات مؤقتة للموافقة/الرفض
        if (strategy === "append" && res.proposedFactors && res.proposedFactors.length > 0) {
          const suggestions: PendingSuggestion[] = res.proposedFactors.map((f, i) => ({
            id: `sug-${Date.now()}-${i}`,
            dimension: f.dimension,
            category: f.category,
            content: f.content,
          }))
          setPendingSuggestions((prev) => [...prev, ...suggestions])
          toast.success(`تم اقتراح ${suggestions.length} بنود جديدة. يمكنك مراجعتها وقبولها أو تجاهلها.`)
          return
        }

        // 3. نجاح الاستبدال وتحديث التحليل
        if (res.data) {
          setAnalysis(res.data)
          toast.success("تم توليد بنود التحليل بنجاح.")
        }
      } catch (err: any) {
        toast.error(err?.response?.data?.error?.message || "تعذّر إكمال التوليد بالذكاء الاصطناعي.")
      } finally {
        setGeneratingScopes((prev) => {
          const next = new Set(prev)
          next.delete(scopeKey)
          return next
        })
      }
    },
    [analysis]
  )

  // ── قبول اقتراح append وحفظه ──
  const acceptSuggestion = useCallback(
    async (suggestionId: string) => {
      const sug = pendingSuggestions.find((s) => s.id === suggestionId)
      if (!sug || !analysis) return

      setPendingSuggestions((prev) => prev.filter((s) => s.id !== suggestionId))
      await addFactor(sug.dimension, sug.category, sug.content)
      toast.success("تمت إضافة البند المقترح إلى الجدول.")
    },
    [pendingSuggestions, analysis, addFactor]
  )

  // ── رفض اقتراح append ──
  const rejectSuggestion = useCallback((suggestionId: string) => {
    setPendingSuggestions((prev) => prev.filter((s) => s.id !== suggestionId))
  }, [])

  // ── قبول كل الاقتراحات ──
  const acceptAllSuggestions = useCallback(async () => {
    if (!analysis || pendingSuggestions.length === 0) return
    const items = [...pendingSuggestions]
    setPendingSuggestions([])
    for (const sug of items) {
      await addFactor(sug.dimension, sug.category, sug.content)
    }
    toast.success(`تمت إضافة جميع المقترحات (${items.length}).`)
  }, [analysis, pendingSuggestions, addFactor])

  // ── رفض كل الاقتراحات ──
  const rejectAllSuggestions = useCallback(() => {
    setPendingSuggestions([])
    toast("تم تجاهل جميع المقترحات.")
  }, [])

  // ── التراجع عن آخر توليد (Undo) ──
  const undoLastGeneration = useCallback(async () => {
    if (!analysis || !undoSnapshot) return

    try {
      setSaveState("saving")
      // استعادة البنود محلياً
      setAnalysis((prev) => (prev ? { ...prev, factors: undoSnapshot } : null))
      setUndoSnapshot(null)
      toast.success("تم التراجع عن آخر عملية توليد.")
      // إعادة تحميل التحليل الأصلي لضمان تزامن السيرفر
      await loadAnalysis(analysis.id)
    } catch {
      toast.error("تعذّر التراجع.")
    }
  }, [analysis, undoSnapshot, loadAnalysis])

  const closeConfirmDialog = useCallback(() => {
    setConfirmDialog((c) => ({ ...c, isOpen: false }))
  }, [])

  return {
    analysis,
    loading,
    saveState,
    generatingScopes,
    pendingSuggestions,
    canUndo: Boolean(undoSnapshot),
    confirmDialog,
    loadAnalysis,
    updateMetadata,
    addFactor,
    updateFactor,
    deleteFactor,
    moveFactor,
    reorderFactors,
    triggerGenerate,
    acceptSuggestion,
    rejectSuggestion,
    acceptAllSuggestions,
    rejectAllSuggestions,
    undoLastGeneration,
    closeConfirmDialog,
  }
}
