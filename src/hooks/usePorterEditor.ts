import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { toast } from "react-hot-toast";
import porterService, {
  CreatePorterPayload,
  UpdatePorterPayload,
} from "@/services/porter.service";
import type {
  PorterAnalysisDetail,
  PorterForceKey,
  PorterFieldKey,
  PorterForces,
  PorterCreationMode,
  PorterFactorItem,
  PorterFactorsMap,
} from "@/types/porter";
import {
  FORCES_ORDER,
  forcesToFactorsMap,
  factorsMapToForces,
  textToFactorItems,
} from "@/types/porter";
import type { PendingPorterSuggestion } from "@/components/tools/porter/SuggestionCards";

const emptyForceContent = () => ({
  trends: "",
  positiveImpacts: "",
  negativeImpacts: "",
});

export const getEmptyForces = (): PorterForces => ({
  newEntrants: emptyForceContent(),
  buyers: emptyForceContent(),
  suppliers: emptyForceContent(),
  substitutes: emptyForceContent(),
  rivalry: emptyForceContent(),
});

export function usePorterEditor(initialId?: string) {
  const [analysis, setAnalysis] = useState<PorterAnalysisDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(initialId));
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [generatingScopes, setGeneratingScopes] = useState<Set<string>>(new Set());
  const [pendingSuggestions, setPendingSuggestions] = useState<PendingPorterSuggestion[]>([]);
  const [undoSnapshot, setUndoSnapshot] = useState<PorterFactorsMap | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // Factor map state
  const [factors, setFactors] = useState<PorterFactorsMap>(() =>
    forcesToFactorsMap(getEmptyForces())
  );

  // Metadata state
  const [title, setTitle] = useState("تحليل قوى بورتر الجديد");
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [industry, setIndustry] = useState("");
  const [countryRegion, setCountryRegion] = useState("");

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Derived forces object for print or export
  const forces = useMemo(() => factorsMapToForces(factors), [factors]);

  const showSaveSuccess = useCallback(() => {
    setSaveState("saved");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      setSaveState("idle");
    }, 2500);
  }, []);

  // ── Load Analysis ──
  const loadAnalysis = useCallback(async (id: string) => {
    try {
      setLoading(true);
      const data = await porterService.get(id);
      setAnalysis(data);
      setTitle(data.title || "تحليل قوى بورتر");
      setProjectName(data.projectName || "");
      setProjectDescription(data.projectDescription || "");
      setIndustry(data.industry || "");
      setCountryRegion(data.countryRegion || "");
      setFactors(forcesToFactorsMap(data.forces || getEmptyForces()));
    } catch (err: any) {
      toast.error(
        err?.response?.data?.error?.message || "تعذّر تحميل تحليل قوى بورتر."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialId) {
      loadAnalysis(initialId);
    } else {
      setAnalysis(null);
      setFactors(forcesToFactorsMap(getEmptyForces()));
      setLoading(false);
    }
  }, [initialId, loadAnalysis]);

  // ── Internal Save Executor ──
  const executeSave = useCallback(
    async (
      currentFactors: PorterFactorsMap,
      metaOverrides?: {
        title?: string;
        projectName?: string;
        projectDescription?: string;
        industry?: string;
        countryRegion?: string;
        creationMode?: PorterCreationMode;
      }
    ) => {
      const activeTitle = (metaOverrides?.title ?? title).trim() || "تحليل قوى بورتر الخمس";
      const activeProjectName = metaOverrides?.projectName ?? projectName;
      const activeProjectDesc = metaOverrides?.projectDescription ?? projectDescription;
      const activeIndustry = metaOverrides?.industry ?? industry;
      const activeRegion = metaOverrides?.countryRegion ?? countryRegion;
      const currentForces = factorsMapToForces(currentFactors);

      setSaveState("saving");

      try {
        if (analysis?.id) {
          const payload: UpdatePorterPayload = {
            title: activeTitle,
            projectName: activeProjectName?.trim() || undefined,
            projectDescription: activeProjectDesc?.trim() || undefined,
            industry: activeIndustry?.trim() || undefined,
            countryRegion: activeRegion?.trim() || undefined,
            forces: currentForces,
            creationMode: metaOverrides?.creationMode ?? analysis.creationMode,
          };
          const updated = await porterService.update(analysis.id, payload);
          setAnalysis(updated);
          showSaveSuccess();
          return updated;
        } else {
          const payload: CreatePorterPayload = {
            title: activeTitle,
            projectName: activeProjectName?.trim() || undefined,
            projectDescription: activeProjectDesc?.trim() || undefined,
            industry: activeIndustry?.trim() || undefined,
            countryRegion: activeRegion?.trim() || undefined,
            forces: currentForces,
            mode: metaOverrides?.creationMode ?? "manual",
          };
          const created = await porterService.create(payload);
          setAnalysis(created);
          showSaveSuccess();
          return created;
        }
      } catch (err: any) {
        setSaveState("error");
        const msg = err?.response?.data?.error?.message || "فشل حفظ التحليل.";
        toast.error(msg);
        throw err;
      }
    },
    [analysis, title, projectName, projectDescription, industry, countryRegion, showSaveSuccess]
  );

  // Auto-save debouncer
  const triggerAutoSave = useCallback(
    (newFactors: PorterFactorsMap) => {
      if (autoSaveDebounceRef.current) clearTimeout(autoSaveDebounceRef.current);
      autoSaveDebounceRef.current = setTimeout(() => {
        executeSave(newFactors);
      }, 1000);
    },
    [executeSave]
  );

  // ── Update Metadata ──
  const updateMetadata = useCallback(
    async (data: {
      title?: string;
      projectName?: string;
      projectDescription?: string;
      industry?: string;
      countryRegion?: string;
    }) => {
      if (data.title !== undefined) setTitle(data.title);
      if (data.projectName !== undefined) setProjectName(data.projectName);
      if (data.projectDescription !== undefined) setProjectDescription(data.projectDescription);
      if (data.industry !== undefined) setIndustry(data.industry);
      if (data.countryRegion !== undefined) setCountryRegion(data.countryRegion);

      await executeSave(factors, data);
      toast.success("تم تحديث بيانات التحليل بنجاح.");
    },
    [factors, executeSave]
  );

  // ── Add Factor ──
  const addFactor = useCallback(
    (force: PorterForceKey, field: PorterFieldKey, initialContent: string = "") => {
      const newItem: PorterFactorItem = {
        id: `${force}-${field}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        force,
        field,
        content: initialContent || "بند جديد...",
        source: "manual",
        sortOrder: (factors[force]?.[field]?.length || 0),
      };

      setFactors((prev) => {
        const next = {
          ...prev,
          [force]: {
            ...prev[force],
            [field]: [...(prev[force]?.[field] || []), newItem],
          },
        };
        triggerAutoSave(next);
        return next;
      });

      return newItem;
    },
    [factors, triggerAutoSave]
  );

  // ── Update Factor ──
  const updateFactor = useCallback(
    (
      force: PorterForceKey,
      field: PorterFieldKey,
      factorId: string,
      newContent: string
    ) => {
      const clean = newContent.trim();
      setFactors((prev) => {
        const currentList = prev[force]?.[field] || [];
        const nextList = currentList.map((item) => {
          if (item.id === factorId) {
            return {
              ...item,
              content: clean,
              source: item.source === "ai" ? "ai_edited" : item.source,
            };
          }
          return item;
        });

        const next = {
          ...prev,
          [force]: {
            ...prev[force],
            [field]: nextList,
          },
        };
        triggerAutoSave(next);
        return next;
      });
    },
    [triggerAutoSave]
  );

  // ── Delete Factor ──
  const deleteFactor = useCallback(
    (force: PorterForceKey, field: PorterFieldKey, factorId: string) => {
      setFactors((prev) => {
        const currentList = prev[force]?.[field] || [];
        const nextList = currentList.filter((item) => item.id !== factorId);

        const next = {
          ...prev,
          [force]: {
            ...prev[force],
            [field]: nextList,
          },
        };
        triggerAutoSave(next);
        return next;
      });
    },
    [triggerAutoSave]
  );

  // ── Reorder Factors ──
  const reorderFactors = useCallback(
    (
      force: PorterForceKey,
      field: PorterFieldKey,
      newOrder: PorterFactorItem[]
    ) => {
      setFactors((prev) => {
        const next = {
          ...prev,
          [force]: {
            ...prev[force],
            [field]: newOrder,
          },
        };
        triggerAutoSave(next);
        return next;
      });
    },
    [triggerAutoSave]
  );

  // ── Move Factor (up/down) ──
  const moveFactor = useCallback(
    (
      force: PorterForceKey,
      field: PorterFieldKey,
      factorId: string,
      direction: "up" | "down"
    ) => {
      const currentList = [...(factors[force]?.[field] || [])];
      const idx = currentList.findIndex((item) => item.id === factorId);
      if (idx === -1) return;

      const targetIdx = direction === "up" ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= currentList.length) return;

      const temp = currentList[idx];
      currentList[idx] = currentList[targetIdx];
      currentList[targetIdx] = temp;

      reorderFactors(force, field, currentList);
    },
    [factors, reorderFactors]
  );

  // ── AI Generation Trigger ──
  const triggerGenerate = useCallback(
    async (
      scope: "full" | "force" | "field",
      targetForce?: PorterForceKey,
      targetField?: PorterFieldKey,
      strategy: "replace" | "append" = "replace"
    ) => {
      const scopeKey =
        scope === "full"
          ? "full"
          : scope === "force"
          ? `force:${targetForce}`
          : `field:${targetForce}:${targetField}`;

      if (strategy === "replace") {
        setUndoSnapshot(JSON.parse(JSON.stringify(factors)));
      }

      setGeneratingScopes((prev) => new Set(prev).add(scopeKey));

      try {
        const payload = {
          projectName: projectName.trim() || undefined,
          projectDescription:
            projectDescription.trim() ||
            (projectName
              ? `مشروع ${projectName} في قطاع ${industry || "التجارة والخدمات"}`
              : "مشروع تجاري واستثماري واعد"),
          industry: industry.trim() || undefined,
          countryRegion: countryRegion.trim() || undefined,
        };

        const res = await porterService.generate(payload);
        const generatedForces = res.forces;

        if (strategy === "replace") {
          let updatedFactors: PorterFactorsMap = { ...factors };

          if (scope === "full") {
            updatedFactors = forcesToFactorsMap(generatedForces, "ai");
            setFactors(updatedFactors);
            await executeSave(updatedFactors, { creationMode: "ai" });
            toast.success("تم توليد التحليل بالكامل بالذكاء الاصطناعي بنجاح!");
          } else if (scope === "force" && targetForce) {
            updatedFactors = {
              ...factors,
              [targetForce]: {
                trends: textToFactorItems(
                  generatedForces[targetForce]?.trends || "",
                  targetForce,
                  "trends",
                  "ai"
                ),
                positiveImpacts: textToFactorItems(
                  generatedForces[targetForce]?.positiveImpacts || "",
                  targetForce,
                  "positiveImpacts",
                  "ai"
                ),
                negativeImpacts: textToFactorItems(
                  generatedForces[targetForce]?.negativeImpacts || "",
                  targetForce,
                  "negativeImpacts",
                  "ai"
                ),
              },
            };
            setFactors(updatedFactors);
            await executeSave(updatedFactors, { creationMode: "hybrid" });
            toast.success("تم توليد بنود القوة بالذكاء الاصطناعي بنجاح!");
          } else if (scope === "field" && targetForce && targetField) {
            const rawText = generatedForces[targetForce]?.[targetField] || "";
            updatedFactors = {
              ...factors,
              [targetForce]: {
                ...factors[targetForce],
                [targetField]: textToFactorItems(
                  rawText,
                  targetForce,
                  targetField,
                  "ai"
                ),
              },
            };
            setFactors(updatedFactors);
            await executeSave(updatedFactors, { creationMode: "hybrid" });
            toast.success("تم توليد بنود العمود بنجاح!");
          }
        } else {
          // APPEND STRATEGY: Present as suggestions
          const newSuggestions: PendingPorterSuggestion[] = [];

          const extractItems = (f: PorterForceKey, fld: PorterFieldKey) => {
            const lines = (generatedForces[f]?.[fld] || "")
              .split(/\r?\n/)
              .map((l) => l.trim())
              .filter(Boolean);
            lines.forEach((line, i) => {
              newSuggestions.push({
                id: `sug-${f}-${fld}-${Date.now()}-${i}`,
                force: f,
                field: fld,
                content: line,
              });
            });
          };

          if (scope === "full") {
            for (const f of FORCES_ORDER) {
              extractItems(f, "trends");
              extractItems(f, "positiveImpacts");
              extractItems(f, "negativeImpacts");
            }
          } else if (scope === "force" && targetForce) {
            extractItems(targetForce, "trends");
            extractItems(targetForce, "positiveImpacts");
            extractItems(targetForce, "negativeImpacts");
          } else if (scope === "field" && targetForce && targetField) {
            extractItems(targetForce, targetField);
          }

          if (newSuggestions.length > 0) {
            setPendingSuggestions((prev) => [...prev, ...newSuggestions]);
            toast.success(
              `تم اقتراح ${newSuggestions.length} بنود جديدة. يمكنك مراجعتها وقبولها أو تجاهلها.`
            );
          } else {
            toast("لم يتم العثور على مقترحات جديدة.");
          }
        }
      } catch (err: any) {
        toast.error(
          err?.response?.data?.error?.message ||
            "تعذّر إكمال التوليد بالذكاء الاصطناعي."
        );
      } finally {
        setGeneratingScopes((prev) => {
          const next = new Set(prev);
          next.delete(scopeKey);
          return next;
        });
      }
    },
    [
      factors,
      projectName,
      projectDescription,
      industry,
      countryRegion,
      executeSave,
    ]
  );

  // ── Suggestions Management ──
  const acceptSuggestion = useCallback(
    (id: string) => {
      const sug = pendingSuggestions.find((s) => s.id === id);
      if (!sug) return;

      addFactor(sug.force, sug.field, sug.content);
      setPendingSuggestions((prev) => prev.filter((s) => s.id !== id));
      toast.success("تمت إضافة البند بنجاح.");
    },
    [pendingSuggestions, addFactor]
  );

  const rejectSuggestion = useCallback((id: string) => {
    setPendingSuggestions((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const acceptAllSuggestions = useCallback(() => {
    if (pendingSuggestions.length === 0) return;

    setFactors((prev) => {
      const next = JSON.parse(JSON.stringify(prev)) as PorterFactorsMap;
      pendingSuggestions.forEach((sug) => {
        const newItem: PorterFactorItem = {
          id: `${sug.force}-${sug.field}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          force: sug.force,
          field: sug.field,
          content: sug.content,
          source: "ai",
          sortOrder: (next[sug.force]?.[sug.field]?.length || 0),
        };
        if (!next[sug.force]) next[sug.force] = {} as any;
        if (!next[sug.force][sug.field]) next[sug.force][sug.field] = [];
        next[sug.force][sug.field].push(newItem);
      });

      triggerAutoSave(next);
      return next;
    });

    toast.success(`تم قبول جميع المقترحات (${pendingSuggestions.length}) بنجاح.`);
    setPendingSuggestions([]);
  }, [pendingSuggestions, triggerAutoSave]);

  const rejectAllSuggestions = useCallback(() => {
    setPendingSuggestions([]);
    toast("تم تجاهل جميع المقترحات.");
  }, []);

  // ── Undo Last Generation ──
  const undoLastGeneration = useCallback(async () => {
    if (!undoSnapshot) return;
    setFactors(undoSnapshot);
    setUndoSnapshot(null);
    await executeSave(undoSnapshot);
    toast.success("تم التراجع عن التوليد واستعادة المحتوى السابق.");
  }, [undoSnapshot, executeSave]);

  const closeConfirmDialog = useCallback(() => {
    setConfirmDialog((c) => ({ ...c, isOpen: false }));
  }, []);

  return {
    analysis,
    loading,
    saveState,
    generatingScopes,
    pendingSuggestions,
    canUndo: Boolean(undoSnapshot),
    confirmDialog,
    closeConfirmDialog,
    factors,
    setFactors,
    forces,
    title,
    setTitle,
    projectName,
    setProjectName,
    projectDescription,
    setProjectDescription,
    industry,
    setIndustry,
    countryRegion,
    setCountryRegion,
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
    saveAnalysis: () => executeSave(factors),
    loadAnalysis,
  };
}

export default usePorterEditor;
