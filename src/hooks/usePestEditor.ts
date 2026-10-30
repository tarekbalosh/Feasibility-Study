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

  // حالة التمييز المتبادل (المرور على بند يميّز أصله أو انعكاسيه)
  const [highlightedParentId, setHighlightedParentId] = useState<string | null>(null)

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

  // ── فحص صلاحية التعديل (View only mode) ──
  const canEdit = analysis ? analysis.accessLevel !== "view" : false

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

  // ── إضافة بند توجه مرتبط بانعكاسين (عملية واحدة) ──
  const addLinkedFactor = useCallback(
    async (payload: {
      dimension: PestDimension
      content: string
      positiveImplication: string
      negativeImplication: string
      aiSuggested?: { positive?: string; negative?: string } | null
    }) => {
      if (!analysis) return
      try {
        setSaveState("saving")
        const res = await pestService.createLinkedFactor(analysis.id, payload)

        setAnalysis((prev) => {
          if (!prev) return null
          const dimObj = { ...prev.factors[payload.dimension] }
          dimObj.trend = [...dimObj.trend, res.trend]
          dimObj.positive_impact = [...dimObj.positive_impact, res.positive]
          dimObj.negative_impact = [...dimObj.negative_impact, res.negative]

          return {
            ...prev,
            creationMode: res.creationMode || prev.creationMode,
            factors: {
              ...prev.factors,
              [payload.dimension]: dimObj,
            },
            factorsFlat: [...prev.factorsFlat, res.trend, res.positive, res.negative],
          }
        })
        showSaveSuccess()
        toast.success("تم حفظ البند وانعكاسيه بنجاح.")
        return res
      } catch (err: any) {
        setSaveState("error")
        toast.error(err?.response?.data?.error?.message || "فشل حفظ البند وانعكاسيه.")
        throw err
      }
    },
    [analysis, showSaveSuccess]
  )

  // ── اقتراح انعكاسين بالذكاء الاصطناعي ──
  const suggestImplications = useCallback(
    async (dimension: PestDimension, content: string) => {
      if (!analysis) throw new Error("التحليل غير متاح.")
      try {
        return await pestService.suggestImplications(analysis.id, { dimension, content })
      } catch (err: any) {
        toast.error(err?.response?.data?.error?.message || "تعذّر الحصول على مقترحات الذكاء الاصطناعي.")
        throw err
      }
    },
    [analysis]
  )

  // ── إضافة انعكاس ناقص لبند توجه قائم ──
  const addMissingImplication = useCallback(
    async (
      parentFactorId: string,
      dimension: PestDimension,
      category: "positive_impact" | "negative_impact",
      content: string,
      aiSuggested?: string
    ) => {
      if (!analysis) return
      try {
        setSaveState("saving")
        const res = await pestService.addImplication(analysis.id, parentFactorId, {
          category,
          content,
          aiSuggested,
        })

        setAnalysis((prev) => {
          if (!prev) return null
          const dimObj = { ...prev.factors[dimension] }
          dimObj[category] = [...dimObj[category], res.factor]

          // إعادة ترتيب الانعكاسات حسب ترتيب الأب
          const parentOrderMap = new Map(dimObj.trend.map((t, idx) => [t.id, idx]))
          const linked: PestFactor[] = []
          const unlinked: PestFactor[] = []
          for (const f of dimObj[category]) {
            if (f.parentFactorId && parentOrderMap.has(f.parentFactorId)) linked.push(f)
            else unlinked.push(f)
          }
          linked.sort((a, b) => (parentOrderMap.get(a.parentFactorId!) ?? 0) - (parentOrderMap.get(b.parentFactorId!) ?? 0))
          dimObj[category] = [...linked, ...unlinked]

          return {
            ...prev,
            creationMode: res.creationMode || prev.creationMode,
            factors: {
              ...prev.factors,
              [dimension]: dimObj,
            },
            factorsFlat: [...prev.factorsFlat, res.factor],
          }
        })
        showSaveSuccess()
        toast.success("تمت إضافة الانعكاس بنجاح.")
        return res.factor
      } catch (err: any) {
        setSaveState("error")
        toast.error(err?.response?.data?.error?.message || "فشلت إضافة الانعكاس.")
        throw err
      }
    },
    [analysis, showSaveSuccess]
  )

  // ── إضافة بند يدوي منفرد ──
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

  // ── تعديل محتوى بند أو ربطه ──
  const updateFactor = useCallback(
    async (
      factorId: string,
      dimension: PestDimension,
      category: PestCategory,
      patch: string | { content?: string; parentFactorId?: string | null }
    ) => {
      if (!analysis) return
      const patchObj = typeof patch === "string" ? { content: patch } : patch
      const clean = patchObj.content !== undefined ? patchObj.content.trim() : undefined

      // تحديث متفائل في الواجهة فوراً
      setAnalysis((prev) => {
        if (!prev) return null
        const dimObj = { ...prev.factors[dimension] }
        dimObj[category] = dimObj[category].map((f) => {
          if (f.id === factorId) {
            return {
              ...f,
              ...(clean !== undefined ? { content: clean, source: f.source === "ai" ? "ai_edited" : f.source } : {}),
              ...(patchObj.parentFactorId !== undefined ? { parentFactorId: patchObj.parentFactorId } : {}),
            }
          }
          return f
        })

        // إذا تم تغيير parentFactorId، إعادة فرز الانعكاسات
        if (patchObj.parentFactorId !== undefined) {
          const parentOrderMap = new Map(dimObj.trend.map((t, idx) => [t.id, idx]))
          const linked: PestFactor[] = []
          const unlinked: PestFactor[] = []
          for (const f of dimObj[category]) {
            if (f.parentFactorId && parentOrderMap.has(f.parentFactorId)) linked.push(f)
            else unlinked.push(f)
          }
          linked.sort((a, b) => (parentOrderMap.get(a.parentFactorId!) ?? 0) - (parentOrderMap.get(b.parentFactorId!) ?? 0))
          dimObj[category] = [...linked, ...unlinked]
        }

        return {
          ...prev,
          factors: {
            ...prev.factors,
            [dimension]: dimObj,
          },
          factorsFlat: prev.factorsFlat.map((f) =>
            f.id === factorId
              ? {
                  ...f,
                  ...(clean !== undefined ? { content: clean, source: f.source === "ai" ? "ai_edited" : f.source } : {}),
                  ...(patchObj.parentFactorId !== undefined ? { parentFactorId: patchObj.parentFactorId } : {}),
                }
              : f
          ),
        }
      })

      try {
        setSaveState("saving")
        const updated = await pestService.updateFactor(analysis.id, factorId, patchObj)
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
      } catch (err: any) {
        setSaveState("error")
        toast.error(err?.response?.data?.error?.message || "فشل حفظ تعديل البند.")
      }
    },
    [analysis, showSaveSuccess]
  )

  // ── حذف بند (مع الحذف المتسلسل للتابعين) ──
  const deleteFactor = useCallback(
    async (factorId: string, dimension: PestDimension, category: PestCategory) => {
      if (!analysis) return
      try {
        setSaveState("saving")
        setAnalysis((prev) => {
          if (!prev) return null
          const dimObj = { ...prev.factors[dimension] }
          let removedIds = new Set<string>([factorId])

          if (category === "trend") {
            // حذف التوجه وانعكاسيه المرتبطين به
            const children = prev.factorsFlat.filter((f) => f.parentFactorId === factorId)
            children.forEach((c) => removedIds.add(c.id))

            dimObj.trend = dimObj.trend.filter((f) => f.id !== factorId)
            dimObj.positive_impact = dimObj.positive_impact.filter((f) => f.parentFactorId !== factorId)
            dimObj.negative_impact = dimObj.negative_impact.filter((f) => f.parentFactorId !== factorId)
          } else {
            dimObj[category] = dimObj[category].filter((f) => f.id !== factorId)
          }

          return {
            ...prev,
            factors: {
              ...prev.factors,
              [dimension]: dimObj,
            },
            factorsFlat: prev.factorsFlat.filter((f) => !removedIds.has(f.id)),
          }
        })

        await pestService.deleteFactor(analysis.id, factorId)
        showSaveSuccess()
        toast.success(category === "trend" ? "تم حذف البند وانعكاسيه المرتبطين." : "تم حذف البند.")
      } catch (err) {
        setSaveState("error")
        toast.error("فشل حذف البند.")
      }
    },
    [analysis, showSaveSuccess]
  )

  // ── طلب حذف بند مع تأكيد إذا كان بند توجه ──
  const requestDeleteFactor = useCallback(
    (factor: PestFactor) => {
      if (!analysis) return
      if (factor.category === "trend") {
        const childCount = analysis.factorsFlat.filter((f) => f.parentFactorId === factor.id).length
        setConfirmDialog({
          isOpen: true,
          title: "تأكيد حذف البند",
          message:
            childCount > 0
              ? `سيؤدي حذف هذا البند («${factor.content.slice(0, 45)}...») إلى حذف انعكاسيه المرتبطين (${childCount} انعكاس) في نفس البُعد أيضاً. هل ترغب بالاستمرار؟`
              : `هل أنت متأكد من رغبتك في حذف هذا البند؟`,
          confirmText: "حذف البند",
          onConfirm: () => {
            setConfirmDialog((c) => ({ ...c, isOpen: false }))
            deleteFactor(factor.id, factor.dimension, factor.category)
          },
        })
      } else {
        deleteFactor(factor.id, factor.dimension, factor.category)
      }
    },
    [analysis, deleteFactor]
  )

  // ── إعادة الترتيب (مع تحريك الانعكاسات آلياً مع بندها الأب) ──
  const reorderFactors = useCallback(
    async (dimension: PestDimension, category: PestCategory, reorderedList: PestFactor[]) => {
      if (!analysis) return

      // تحديث الواجهة فوراً
      setAnalysis((prev) => {
        if (!prev) return null
        const dimObj = { ...prev.factors[dimension] }
        dimObj[category] = reorderedList

        // إذا كانت إعادة الترتيب للتوجهات، نحرك انعكاساتها معها
        if (category === "trend") {
          const parentOrderMap = new Map(reorderedList.map((t, idx) => [t.id, idx]))
          const sortChildList = (list: PestFactor[]) => {
            const linked: PestFactor[] = []
            const unlinked: PestFactor[] = []
            for (const f of list) {
              if (f.parentFactorId && parentOrderMap.has(f.parentFactorId)) linked.push(f)
              else unlinked.push(f)
            }
            linked.sort(
              (a, b) => (parentOrderMap.get(a.parentFactorId!) ?? 0) - (parentOrderMap.get(b.parentFactorId!) ?? 0)
            )
            return [...linked, ...unlinked]
          }
          dimObj.positive_impact = sortChildList(dimObj.positive_impact)
          dimObj.negative_impact = sortChildList(dimObj.negative_impact)
        }

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
      setAnalysis((prev) => (prev ? { ...prev, factors: undoSnapshot } : null))
      setUndoSnapshot(null)
      toast.success("تم التراجع عن آخر عملية توليد.")
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
    canEdit,
    saveState,
    generatingScopes,
    pendingSuggestions,
    canUndo: Boolean(undoSnapshot),
    confirmDialog,
    highlightedParentId,
    setHighlightedParentId,
    loadAnalysis,
    updateMetadata,
    addFactor,
    addLinkedFactor,
    suggestImplications,
    addMissingImplication,
    updateFactor,
    deleteFactor,
    requestDeleteFactor,
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

export default usePestEditor
