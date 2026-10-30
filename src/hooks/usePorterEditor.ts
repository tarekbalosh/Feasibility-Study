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
  CreateLinkedPorterFactorPayload,
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

  // حالة الإبراز المتبادل بين بند التوجه وانعكاسيه
  const [highlightedParentId, setHighlightedParentId] = useState<string | null>(null);

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

  const closeConfirmDialog = useCallback(() => {
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
  }, []);

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

  // صلاحية التعديل
  const canEdit = useMemo(() => {
    if (!analysis) return true;
    return analysis.accessLevel !== "view";
  }, [analysis]);

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
      }, 800);
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

  // ── Add Linked Factor (Atomic Triple) ──
  const addLinkedFactor = useCallback(
    async (payload: CreateLinkedPorterFactorPayload) => {
      const force = payload.force;
      const trendId = `${force}-trend-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const sortOrder = factors[force]?.trends?.length || 0;

      const trendItem: PorterFactorItem = {
        id: trendId,
        force,
        field: "trends",
        content: payload.content,
        source: "manual",
        sortOrder,
        parentFactorId: null,
      };

      const posItem: PorterFactorItem = {
        id: `${force}-pos-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        force,
        field: "positiveImpacts",
        content: payload.positiveImplication,
        source: payload.positiveSource ?? "manual",
        sortOrder,
        parentFactorId: trendId,
      };

      const negItem: PorterFactorItem = {
        id: `${force}-neg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        force,
        field: "negativeImpacts",
        content: payload.negativeImplication,
        source: payload.negativeSource ?? "manual",
        sortOrder,
        parentFactorId: trendId,
      };

      const nextFactors: PorterFactorsMap = {
        ...factors,
        [force]: {
          trends: [...(factors[force]?.trends || []), trendItem],
          positiveImpacts: [...(factors[force]?.positiveImpacts || []), posItem],
          negativeImpacts: [...(factors[force]?.negativeImpacts || []), negItem],
        },
      };

      setFactors(nextFactors);
      triggerAutoSave(nextFactors);
      toast.success("تمت إضافة بند التوجه وانعكاسيه بنجاح.");
      return { trend: trendItem, positive: posItem, negative: negItem };
    },
    [factors, triggerAutoSave]
  );

  // ── Suggest Implications via AI ──
  const suggestImplications = useCallback(
    async (force: PorterForceKey, content: string) => {
      return porterService.suggestImplications({
        force,
        content,
        projectName,
        projectDescription,
        industry,
        countryRegion,
      });
    },
    [projectName, projectDescription, industry, countryRegion]
  );

  // ── Add Missing Implication ──
  const addMissingImplication = useCallback(
    async (
      force: PorterForceKey,
      parentFactorId: string,
      field: "positiveImpacts" | "negativeImpacts",
      content: string,
      aiSuggested?: string
    ) => {
      const parentTrend = (factors[force]?.trends || []).find((t) => t.id === parentFactorId);
      const sortOrder = parentTrend?.sortOrder ?? (factors[force]?.[field]?.length || 0);

      const newItem: PorterFactorItem = {
        id: `${force}-${field}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        force,
        field,
        content,
        source: aiSuggested ? "ai" : "manual",
        sortOrder,
        parentFactorId,
      };

      const currentList = factors[force]?.[field] || [];
      const updatedList = [...currentList, newItem];

      const nextFactors: PorterFactorsMap = {
        ...factors,
        [force]: {
          ...factors[force],
          [field]: updatedList,
        },
      };

      setFactors(nextFactors);
      triggerAutoSave(nextFactors);
      toast.success("تمت إضافة الانعكاس وربطه بالبند بنجاح.");
      return newItem;
    },
    [factors, triggerAutoSave]
  );

  // ── Add Single Factor (Generic Fallback) ──
  const addFactor = useCallback(
    (force: PorterForceKey, field: PorterFieldKey, initialContent: string = "") => {
      const newItem: PorterFactorItem = {
        id: `${force}-${field}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        force,
        field,
        content: initialContent || "بند جديد...",
        source: "manual",
        sortOrder: factors[force]?.[field]?.length || 0,
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
      newContent: string,
      parentFactorId?: string | null
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
              ...(parentFactorId !== undefined ? { parentFactorId } : {}),
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

  // ── Delete Factor (Simple) ──
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

  // ── Request Delete Factor with Cascade Confirmation for Trends ──
  const requestDeleteFactor = useCallback(
    (factor: PorterFactorItem) => {
      const force = factor.force;
      if (factor.field === "trends") {
        const posChildren = (factors[force]?.positiveImpacts || []).filter(
          (p) => p.parentFactorId === factor.id
        );
        const negChildren = (factors[force]?.negativeImpacts || []).filter(
          (n) => n.parentFactorId === factor.id
        );
        const childCount = posChildren.length + negChildren.length;

        const message =
          childCount > 0
            ? `حذف بند التوجه هذا سيحذف معه الانعكاسين المرتبطين به (${childCount} انعكاس) تلقائياً. هل أنت متأكد من الحذف؟`
            : "هل أنت متأكد من حذف هذا البند؟";

        setConfirmDialog({
          isOpen: true,
          title: "تأكيد حذف بند التوجه",
          message,
          confirmText: childCount > 0 ? "حذف التوجه وانعكاسيه" : "حذف البند",
          onConfirm: () => {
            closeConfirmDialog();
            setFactors((prev) => {
              const nextTrends = (prev[force]?.trends || []).filter((t) => t.id !== factor.id);
              const nextPos = (prev[force]?.positiveImpacts || []).filter(
                (p) => p.parentFactorId !== factor.id
              );
              const nextNeg = (prev[force]?.negativeImpacts || []).filter(
                (n) => n.parentFactorId !== factor.id
              );

              const next = {
                ...prev,
                [force]: {
                  trends: nextTrends,
                  positiveImpacts: nextPos,
                  negativeImpacts: nextNeg,
                },
              };
              triggerAutoSave(next);
              toast.success("تم حذف البند وانعكاسيه بنجاح.");
              return next;
            });
          },
        });
      } else {
        // حذف انعكاس منفرد
        deleteFactor(force, factor.field, factor.id);
        toast.success("تم حذف الانعكاس بنجاح.");
      }
    },
    [factors, deleteFactor, triggerAutoSave, closeConfirmDialog]
  );

  // ── Reorder Factors (Synchronizes Child Implications when Trends reorder) ──
  const reorderFactors = useCallback(
    (
      force: PorterForceKey,
      field: PorterFieldKey,
      newOrder: PorterFactorItem[]
    ) => {
      setFactors((prev) => {
        let nextPos = prev[force]?.positiveImpacts || [];
        let nextNeg = prev[force]?.negativeImpacts || [];

        // إذا تم تغيير ترتيب التوجهات، أعد ترتيب الانعكاسات لتطابق الترتيب الجديد
        if (field === "trends") {
          const trendOrderMap = new Map<string, number>();
          newOrder.forEach((t, i) => trendOrderMap.set(t.id, i));

          const sortImplications = (list: PorterFactorItem[]) => {
            return [...list].sort((a, b) => {
              const orderA = a.parentFactorId ? trendOrderMap.get(a.parentFactorId) : undefined;
              const orderB = b.parentFactorId ? trendOrderMap.get(b.parentFactorId) : undefined;
              if (orderA !== undefined && orderB !== undefined) return orderA - orderB;
              if (orderA !== undefined) return -1;
              if (orderB !== undefined) return 1;
              return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
            });
          };

          nextPos = sortImplications(nextPos);
          nextNeg = sortImplications(nextNeg);
        }

        const next = {
          ...prev,
          [force]: {
            ...prev[force],
            [field]: newOrder,
            positiveImpacts: nextPos,
            negativeImpacts: nextNeg,
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

  // ── Helper: Map generated forces text lines into linked items ──
  const mapGeneratedToLinkedItems = useCallback(
    (generatedForces: PorterForces): PorterFactorsMap => {
      const result: any = {};
      for (const f of FORCES_ORDER) {
        const rawTrends = (generatedForces[f]?.trends || "")
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter(Boolean);
        const rawPos = (generatedForces[f]?.positiveImpacts || "")
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter(Boolean);
        const rawNeg = (generatedForces[f]?.negativeImpacts || "")
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter(Boolean);

        const trendItems: PorterFactorItem[] = [];
        const posItems: PorterFactorItem[] = [];
        const negItems: PorterFactorItem[] = [];

        rawTrends.forEach((tLine, i) => {
          const tId = `${f}-ai-trend-${Date.now()}-${i}`;
          trendItems.push({
            id: tId,
            force: f,
            field: "trends",
            content: tLine,
            source: "ai",
            sortOrder: i,
            parentFactorId: null,
          });

          if (rawPos[i]) {
            posItems.push({
              id: `${f}-ai-pos-${Date.now()}-${i}`,
              force: f,
              field: "positiveImpacts",
              content: rawPos[i],
              source: "ai",
              sortOrder: i,
              parentFactorId: tId,
            });
          }

          if (rawNeg[i]) {
            negItems.push({
              id: `${f}-ai-neg-${Date.now()}-${i}`,
              force: f,
              field: "negativeImpacts",
              content: rawNeg[i],
              source: "ai",
              sortOrder: i,
              parentFactorId: tId,
            });
          }
        });

        // Add any remaining pos/neg as unlinked if length differed
        if (rawPos.length > rawTrends.length) {
          for (let i = rawTrends.length; i < rawPos.length; i++) {
            posItems.push({
              id: `${f}-ai-pos-${Date.now()}-${i}`,
              force: f,
              field: "positiveImpacts",
              content: rawPos[i],
              source: "ai",
              sortOrder: i,
              parentFactorId: null,
            });
          }
        }
        if (rawNeg.length > rawTrends.length) {
          for (let i = rawTrends.length; i < rawNeg.length; i++) {
            negItems.push({
              id: `${f}-ai-neg-${Date.now()}-${i}`,
              force: f,
              field: "negativeImpacts",
              content: rawNeg[i],
              source: "ai",
              sortOrder: i,
              parentFactorId: null,
            });
          }
        }

        result[f] = {
          trends: trendItems,
          positiveImpacts: posItems,
          negativeImpacts: negItems,
        };
      }
      return result as PorterFactorsMap;
    },
    []
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
        const linkedGenerated = mapGeneratedToLinkedItems(generatedForces);

        if (strategy === "replace") {
          let updatedFactors: PorterFactorsMap = { ...factors };

          if (scope === "full") {
            updatedFactors = linkedGenerated;
            setFactors(updatedFactors);
            await executeSave(updatedFactors, { creationMode: "ai" });
            toast.success("تم توليد التحليل بالكامل بالذكاء الاصطناعي بنجاح!");
          } else if (scope === "force" && targetForce) {
            updatedFactors = {
              ...factors,
              [targetForce]: linkedGenerated[targetForce],
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
              for (const fld of ["trends", "positiveImpacts", "negativeImpacts"] as const) {
                extractItems(f, fld);
              }
            }
          } else if (scope === "force" && targetForce) {
            for (const fld of ["trends", "positiveImpacts", "negativeImpacts"] as const) {
              extractItems(targetForce, fld);
            }
          } else if (scope === "field" && targetForce && targetField) {
            extractItems(targetForce, targetField);
          }

          setPendingSuggestions(newSuggestions);
          toast.success(`تم استلام ${newSuggestions.length} اقتراحاً! راجعها بالأسفل للموافقة أو الرفض.`);
        }
      } catch (err: any) {
        toast.error(err?.response?.data?.error?.message || "فشل توليد البيانات بالذكاء الاصطناعي.");
      } finally {
        setGeneratingScopes((prev) => {
          const next = new Set(prev);
          next.delete(scopeKey);
          return next;
        });
      }
    },
    [factors, projectName, projectDescription, industry, countryRegion, executeSave, mapGeneratedToLinkedItems]
  );

  // ── Suggestions Management ──
  const acceptSuggestion = useCallback(
    (suggestionId: string) => {
      const item = pendingSuggestions.find((s) => s.id === suggestionId);
      if (!item) return;

      const newItem: PorterFactorItem = {
        id: `${item.force}-${item.field}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        force: item.force,
        field: item.field,
        content: item.content,
        source: "ai",
        sortOrder: factors[item.force]?.[item.field]?.length || 0,
      };

      setFactors((prev) => {
        const next = {
          ...prev,
          [item.force]: {
            ...prev[item.force],
            [item.field]: [...(prev[item.force]?.[item.field] || []), newItem],
          },
        };
        triggerAutoSave(next);
        return next;
      });

      setPendingSuggestions((prev) => prev.filter((s) => s.id !== suggestionId));
      toast.success("تمت إضافة المقترح للتحليل.");
    },
    [pendingSuggestions, factors, triggerAutoSave]
  );

  const rejectSuggestion = useCallback((suggestionId: string) => {
    setPendingSuggestions((prev) => prev.filter((s) => s.id !== suggestionId));
  }, []);

  const acceptAllSuggestions = useCallback(() => {
    if (pendingSuggestions.length === 0) return;

    setFactors((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      for (const item of pendingSuggestions) {
        const newItem: PorterFactorItem = {
          id: `${item.force}-${item.field}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          force: item.force,
          field: item.field,
          content: item.content,
          source: "ai",
          sortOrder: next[item.force]?.[item.field]?.length || 0,
        };
        next[item.force][item.field].push(newItem);
      }
      triggerAutoSave(next);
      return next;
    });

    setPendingSuggestions([]);
    toast.success("تم قبول جميع المقترحات وإضافتها للتحليل بنجاح.");
  }, [pendingSuggestions, triggerAutoSave]);

  const rejectAllSuggestions = useCallback(() => {
    setPendingSuggestions([]);
    toast("تم رفض كافة المقترحات.");
  }, []);

  // ── Undo Last Generation ──
  const undoLastGeneration = useCallback(async () => {
    if (!undoSnapshot) return;
    setFactors(undoSnapshot);
    setUndoSnapshot(null);
    await executeSave(undoSnapshot);
    toast.success("تم التراجع عن آخر توليد بنجاح.");
  }, [undoSnapshot, executeSave]);

  const canUndo = Boolean(undoSnapshot);

  return {
    analysis,
    loading,
    saveState,
    generatingScopes,
    pendingSuggestions,
    canUndo,
    canEdit,
    confirmDialog,
    closeConfirmDialog,
    factors,
    forces,
    title,
    projectName,
    projectDescription,
    industry,
    countryRegion,
    highlightedParentId,
    setHighlightedParentId,
    updateMetadata,
    addLinkedFactor,
    suggestImplications,
    addMissingImplication,
    addFactor,
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
  };
}
