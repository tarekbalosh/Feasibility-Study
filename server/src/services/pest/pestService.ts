import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import {
  type Actor,
  getRunWithAccess,
  resolveProjectPlacement,
  computeProjectLevel,
  type ProjectLevel,
  projectListWhere,
} from "../accessService";
import {
  PEST_TOOL_SLUG,
  PEST_DIMENSIONS,
  PEST_CATEGORIES,
  PestDimensionKey,
  PestCategoryKey,
  PestFactorSourceKey,
  PestCreationModeKey,
  MAX_FACTORS_PER_ANALYSIS,
  MAX_FACTOR_CHARS,
} from "./pestConstants";
import {
  callOpenAIForPest,
  computeMergePlan,
  GenerateRequestInput,
  GenerationContext,
  ExistingFactor,
  ProposedFactor,
} from "./pestGeneration";
import { logger } from "../../utils/logger";

// ─────────────────────────────────────────────────────────────
// Rate Limiter for AI Generation (In-Memory per user/workspace)
// ─────────────────────────────────────────────────────────────
const AI_RATE_LIMIT_PER_HOUR = 20;
const aiGenerationLogMap = new Map<string, number[]>();

function checkAiRateLimit(userId: string) {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  const history = aiGenerationLogMap.get(userId) || [];
  const activeRequests = history.filter((timestamp) => timestamp > oneHourAgo);

  if (activeRequests.length >= AI_RATE_LIMIT_PER_HOUR) {
    throw ApiError.rateLimitExceeded(
      `تم تجاوز الحد المسموح لتوليد الذكاء الاصطناعي (${AI_RATE_LIMIT_PER_HOUR} عملية/ساعة). يرجى المحاولة لاحقاً.`
    );
  }

  activeRequests.push(now);
  aiGenerationLogMap.set(userId, activeRequests);
}

// ─────────────────────────────────────────────────────────────
// Helper: Compute Analysis Creation Mode
// ─────────────────────────────────────────────────────────────
export async function updateAnalysisCreationMode(
  analysisId: string,
  tx: any = prisma
): Promise<PestCreationModeKey> {
  const factors = await tx.pestFactor.findMany({
    where: { analysisId },
    select: { source: true },
  });

  if (factors.length === 0) {
    return "manual";
  }

  const hasManualOrEdited = factors.some(
    (f: { source: string }) => f.source === "manual" || f.source === "ai_edited"
  );
  const hasPureAi = factors.some((f: { source: string }) => f.source === "ai");

  let mode: PestCreationModeKey = "manual";
  if (hasPureAi && hasManualOrEdited) {
    mode = "hybrid";
  } else if (hasPureAi && !hasManualOrEdited) {
    mode = "ai";
  } else {
    mode = "manual";
  }

  await tx.pestAnalysis.update({
    where: { id: analysisId },
    data: { creationMode: mode },
  });

  return mode;
}

// ─────────────────────────────────────────────────────────────
// Helper: Sync ToolRun Record
// ─────────────────────────────────────────────────────────────
async function syncToolRunSummary(
  analysisId: string,
  tx: any = prisma
) {
  const analysis = await tx.pestAnalysis.findUnique({
    where: { id: analysisId },
    include: {
      factors: {
        select: { dimension: true, category: true, content: true },
      },
    },
  });

  if (!analysis || !analysis.toolRunId) return;

  const count = analysis.factors.length;
  const summary = `تحليل PEST: ${count} بند موزعة على 5 أبعاد (${analysis.creationMode}).`;

  await tx.toolRun.update({
    where: { id: analysis.toolRunId },
    data: {
      title: analysis.title,
      summary,
      output: JSON.stringify({
        analysisId: analysis.id,
        factorsCount: count,
        mode: analysis.creationMode,
      }),
      updatedAt: new Date(),
    },
  });
}

// ─────────────────────────────────────────────────────────────
// Service Functions: Pest Analysis CRUD
// ─────────────────────────────────────────────────────────────

export interface CreatePestAnalysisInput {
  title: string;
  projectName?: string;
  projectDescription?: string;
  industry?: string;
  countryRegion?: string;
  departmentId?: string;
  planId?: string;
  mode?: "manual" | "ai";
}

export async function createAnalysis(actor: Actor, input: CreatePestAnalysisInput) {
  const title = input.title?.trim();
  if (!title) {
    throw ApiError.invalidInput("عنوان التحليل مطلوب.", [{ field: "title", issue: "العنوان مطلوب." }]);
  }

  const placement = await resolveProjectPlacement(actor, {
    departmentId: input.departmentId,
    planId: input.planId,
  });

  // إنشاء سجل مرآة في tool_runs أولاً حتى تظهر في لوحة التحكم وتخضع للصلاحيات
  const toolRun = await prisma.toolRun.create({
    data: {
      toolSlug: PEST_TOOL_SLUG,
      title: title.slice(0, 150),
      summary: "تحليل PEST جديد (قيد الإعداد)",
      input: JSON.stringify({
        projectName: input.projectName || null,
        industry: input.industry || null,
        countryRegion: input.countryRegion || null,
      }),
      output: JSON.stringify({ factorsCount: 0 }),
      workspaceId: actor.workspaceId,
      userId: actor.userId,
      departmentId: placement.departmentId,
      planId: placement.planId,
      visibility: "department",
    },
  });

  const analysis = await prisma.pestAnalysis.create({
    data: {
      workspaceId: actor.workspaceId,
      departmentId: placement.departmentId,
      toolRunId: toolRun.id,
      createdById: actor.userId,
      title: title.slice(0, 150),
      projectName: input.projectName?.trim() || null,
      projectDescription: input.projectDescription?.trim() || null,
      industry: input.industry?.trim() || null,
      countryRegion: input.countryRegion?.trim() || null,
      status: "draft",
      creationMode: input.mode === "ai" ? "ai" : "manual",
      language: "ar",
    },
    include: {
      department: { select: { id: true, name: true, color: true, icon: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });

  return analysis;
}

export async function listAnalyses(
  actor: Actor,
  options: { departmentId?: string; mine?: boolean; limit?: number } = {}
) {
  // الاعتماد على نفس سياسة رؤية المشاريع في accessService عبر toolRun
  const analyses = await prisma.pestAnalysis.findMany({
    where: {
      workspaceId: actor.workspaceId,
      ...(options.departmentId ? { departmentId: options.departmentId } : {}),
      ...(options.mine ? { createdById: actor.userId } : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: options.limit || 50,
    include: {
      department: { select: { id: true, name: true, color: true, icon: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      _count: { select: { factors: true } },
    },
  });

  return analyses.map((a) => ({
    id: a.id,
    title: a.title,
    projectName: a.projectName,
    projectDescription: a.projectDescription,
    industry: a.industry,
    countryRegion: a.countryRegion,
    status: a.status,
    creationMode: a.creationMode,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
    department: a.department,
    createdBy: a.createdBy,
    factorsCount: a._count.factors,
  }));
}

export async function getAnalysisWithFactors(actor: Actor, analysisId: string) {
  const analysis = await prisma.pestAnalysis.findFirst({
    where: {
      workspaceId: actor.workspaceId,
      OR: [{ id: analysisId }, { toolRunId: analysisId }],
    },
    include: {
      department: { select: { id: true, name: true, color: true, icon: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      toolRun: {
        include: {
          permissions: { select: { workspaceMemberId: true, level: true } },
          plan: { select: { members: { select: { workspaceMemberId: true } } } },
        },
      },
      factors: {
        orderBy: [{ dimension: "asc" }, { category: "asc" }, { sortOrder: "asc" }],
      },
    },
  });

  if (!analysis) {
    throw ApiError.notFound("تحليل PEST المطلوب غير موجود.");
  }

  // التحقق من مستوى صلاحية الفاعل
  let accessLevel: ProjectLevel = "view";
  if (analysis.toolRun) {
    const level = computeProjectLevel(actor, analysis.toolRun as any);
    if (!level) {
      throw ApiError.accessDenied("ليس لديك صلاحية للاطلاع على هذا التحليل.");
    }
    accessLevel = level;
  }

  // تجميع البنود حسب البُعد والفئة
  const groupedFactors: Record<
    PestDimensionKey,
    Record<PestCategoryKey, typeof analysis.factors>
  > = {
    political: { trend: [], positive_impact: [], negative_impact: [] },
    economic: { trend: [], positive_impact: [], negative_impact: [] },
    social: { trend: [], positive_impact: [], negative_impact: [] },
    technological: { trend: [], positive_impact: [], negative_impact: [] },
    legal: { trend: [], positive_impact: [], negative_impact: [] },
  };

  for (const factor of analysis.factors) {
    if (
      groupedFactors[factor.dimension as PestDimensionKey] &&
      groupedFactors[factor.dimension as PestDimensionKey][factor.category as PestCategoryKey]
    ) {
      groupedFactors[factor.dimension as PestDimensionKey][factor.category as PestCategoryKey].push(factor);
    }
  }

  return {
    id: analysis.id,
    title: analysis.title,
    projectName: analysis.projectName,
    projectDescription: analysis.projectDescription,
    industry: analysis.industry,
    countryRegion: analysis.countryRegion,
    status: analysis.status,
    creationMode: analysis.creationMode,
    language: analysis.language,
    createdAt: analysis.createdAt,
    updatedAt: analysis.updatedAt,
    department: analysis.department,
    createdBy: analysis.createdBy,
    accessLevel,
    factors: groupedFactors,
    factorsFlat: analysis.factors,
  };
}

export async function updateAnalysis(
  actor: Actor,
  analysisId: string,
  data: Partial<CreatePestAnalysisInput> & { status?: "draft" | "completed" }
) {
  const analysis = await prisma.pestAnalysis.findFirst({
    where: { id: analysisId, workspaceId: actor.workspaceId },
  });

  if (!analysis) {
    throw ApiError.notFound("تحليل PEST المطلوب غير موجود.");
  }

  if (analysis.toolRunId) {
    await getRunWithAccess(actor, analysis.toolRunId, "edit");
  }

  const updated = await prisma.pestAnalysis.update({
    where: { id: analysisId },
    data: {
      ...(data.title ? { title: data.title.trim().slice(0, 150) } : {}),
      ...(data.projectName !== undefined ? { projectName: data.projectName?.trim() || null } : {}),
      ...(data.projectDescription !== undefined ? { projectDescription: data.projectDescription?.trim() || null } : {}),
      ...(data.industry !== undefined ? { industry: data.industry?.trim() || null } : {}),
      ...(data.countryRegion !== undefined ? { countryRegion: data.countryRegion?.trim() || null } : {}),
      ...(data.status ? { status: data.status } : {}),
    },
  });

  if (analysis.toolRunId && data.title) {
    await prisma.toolRun.update({
      where: { id: analysis.toolRunId },
      data: { title: updated.title },
    });
  }

  return updated;
}

export async function deleteAnalysis(actor: Actor, analysisId: string) {
  const analysis = await prisma.pestAnalysis.findFirst({
    where: { id: analysisId, workspaceId: actor.workspaceId },
  });

  if (!analysis) {
    throw ApiError.notFound("تحليل PEST المطلوب غير موجود.");
  }

  if (analysis.toolRunId) {
    await getRunWithAccess(actor, analysis.toolRunId, "manage");
    // الحذف المتسلسل لـ toolRun سيحذف pestAnalysis تلقائياً عبر ON DELETE CASCADE
    await prisma.toolRun.delete({ where: { id: analysis.toolRunId } });
  } else {
    await prisma.pestAnalysis.delete({ where: { id: analysisId } });
  }

  return { success: true, message: "تم حذف تحليل PEST بنجاح." };
}

// ─────────────────────────────────────────────────────────────
// Factors CRUD
// ─────────────────────────────────────────────────────────────

export interface AddFactorInput {
  dimension: PestDimensionKey;
  category: PestCategoryKey;
  content: string;
}

export async function addFactor(
  actor: Actor,
  analysisId: string,
  input: AddFactorInput
) {
  const analysis = await prisma.pestAnalysis.findFirst({
    where: { id: analysisId, workspaceId: actor.workspaceId },
  });
  if (!analysis) throw ApiError.notFound("التحليل غير موجود.");

  if (analysis.toolRunId) {
    await getRunWithAccess(actor, analysis.toolRunId, "edit");
  }

  const content = typeof input.content === "string" ? input.content.trim() : "";
  if (content.length > MAX_FACTOR_CHARS) {
    throw ApiError.invalidInput(`طول البند يتجاوز الحد الأقصى (${MAX_FACTOR_CHARS} حرفاً).`);
  }

  const totalCount = await prisma.pestFactor.count({ where: { analysisId } });
  if (totalCount >= MAX_FACTORS_PER_ANALYSIS) {
    throw ApiError.invalidInput(`تم الوصول إلى الحد الأقصى للبنود (${MAX_FACTORS_PER_ANALYSIS}).`);
  }

  // الحصول على أعلى sortOrder في نفس البعد والفئة
  const lastFactor = await prisma.pestFactor.findFirst({
    where: {
      analysisId,
      dimension: input.dimension,
      category: input.category,
    },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  const nextSortOrder = (lastFactor?.sortOrder ?? -1) + 1;

  const factor = await prisma.pestFactor.create({
    data: {
      analysisId,
      dimension: input.dimension,
      category: input.category,
      content,
      sortOrder: nextSortOrder,
      source: "manual",
      createdById: actor.userId,
    },
  });

  await updateAnalysisCreationMode(analysisId);
  await syncToolRunSummary(analysisId);

  return factor;
}

export async function updateFactor(
  actor: Actor,
  analysisId: string,
  factorId: string,
  content: string
) {
  const analysis = await prisma.pestAnalysis.findFirst({
    where: { id: analysisId, workspaceId: actor.workspaceId },
  });
  if (!analysis) throw ApiError.notFound("التحليل غير موجود.");

  if (analysis.toolRunId) {
    await getRunWithAccess(actor, analysis.toolRunId, "edit");
  }

  const cleanContent = typeof content === "string" ? content.trim() : "";
  if (cleanContent.length > MAX_FACTOR_CHARS) {
    throw ApiError.invalidInput(`طول البند يتجاوز الحد الأقصى (${MAX_FACTOR_CHARS} حرفاً).`);
  }

  const existing = await prisma.pestFactor.findFirst({
    where: { id: factorId, analysisId },
  });
  if (!existing) throw ApiError.notFound("البند غير موجود.");

  // تحول المصدر من ai إلى ai_edited عند التعديل
  let nextSource: PestFactorSourceKey = existing.source as PestFactorSourceKey;
  if (existing.source === "ai") {
    nextSource = "ai_edited";
  }

  const updated = await prisma.pestFactor.update({
    where: { id: factorId },
    data: {
      content: cleanContent,
      source: nextSource,
    },
  });

  await updateAnalysisCreationMode(analysisId);
  await syncToolRunSummary(analysisId);

  return updated;
}

export async function deleteFactor(
  actor: Actor,
  analysisId: string,
  factorId: string
) {
  const analysis = await prisma.pestAnalysis.findFirst({
    where: { id: analysisId, workspaceId: actor.workspaceId },
  });
  if (!analysis) throw ApiError.notFound("التحليل غير موجود.");

  if (analysis.toolRunId) {
    await getRunWithAccess(actor, analysis.toolRunId, "edit");
  }

  const existing = await prisma.pestFactor.findFirst({
    where: { id: factorId, analysisId },
  });
  if (!existing) throw ApiError.notFound("البند غير موجود.");

  await prisma.pestFactor.delete({ where: { id: factorId } });

  await updateAnalysisCreationMode(analysisId);
  await syncToolRunSummary(analysisId);

  return { success: true };
}

export async function reorderFactors(
  actor: Actor,
  analysisId: string,
  items: Array<{ id: string; sortOrder: number }>
) {
  const analysis = await prisma.pestAnalysis.findFirst({
    where: { id: analysisId, workspaceId: actor.workspaceId },
  });
  if (!analysis) throw ApiError.notFound("التحليل غير موجود.");

  if (analysis.toolRunId) {
    await getRunWithAccess(actor, analysis.toolRunId, "edit");
  }

  if (!items || items.length === 0) {
    return { success: true };
  }

  await prisma.$transaction(
    items.map((item) =>
      prisma.pestFactor.updateMany({
        where: { id: item.id, analysisId },
        data: { sortOrder: item.sortOrder },
      })
    )
  );

  return { success: true };
}

// ─────────────────────────────────────────────────────────────
// AI Generation Service Entry Point
// ─────────────────────────────────────────────────────────────

export async function generatePestAI(
  actor: Actor,
  analysisId: string,
  input: GenerateRequestInput
) {
  const analysis = await prisma.pestAnalysis.findFirst({
    where: { id: analysisId, workspaceId: actor.workspaceId },
    include: {
      factors: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });
  if (!analysis) throw ApiError.notFound("تحليل PEST غير موجود.");

  if (analysis.toolRunId) {
    await getRunWithAccess(actor, analysis.toolRunId, "edit");
  }

  // التحقق من اكتمال بيانات المشروع الأساسية قبل استدعاء الذكاء الاصطناعي
  if (!analysis.projectName || analysis.projectName.trim().length < 2) {
    throw ApiError.invalidInput(
      "بيانات المشروع غير مكتملة للتوليد بالذكاء الاصطناعي. يرجى إدخال اسم المشروع أولاً في بيانات التحليل."
    );
  }

  // فحص معدل التوليد للمستخدم
  checkAiRateLimit(actor.userId);

  const existingFactors: ExistingFactor[] = analysis.factors.map((f) => ({
    id: f.id,
    dimension: f.dimension as PestDimensionKey,
    category: f.category as PestCategoryKey,
    content: f.content,
    sortOrder: f.sortOrder,
    source: f.source as PestFactorSourceKey,
  }));

  const ctx: GenerationContext = {
    projectName: analysis.projectName,
    projectDescription: analysis.projectDescription,
    industry: analysis.industry,
    countryRegion: analysis.countryRegion,
    existingFactors,
  };

  // 1. استدعاء OpenAI للحصول على البنود المقترحة
  const { proposedFactors, tokens, model } = await callOpenAIForPest(
    ctx,
    input.scope,
    input.strategy,
    input.dimension as PestDimensionKey,
    input.category as PestCategoryKey
  );

  // 2. تطبيق منطق الحماية والدمج (Merge Logic)
  const mergePlan = computeMergePlan(
    input.scope,
    input.strategy,
    input.dimension as PestDimensionKey,
    input.category as PestCategoryKey,
    existingFactors,
    proposedFactors,
    input.confirmOverwrite
  );

  // إذا وجد تعارض مع بنود يدوية ولم يؤكد المستخدم الاستبدال:
  if (mergePlan.hasProtectedManualConflict) {
    return {
      requiresConfirmation: true,
      protectedManualCount: mergePlan.protectedManualCount,
      message: `يحتوي هذا النطاق على ${mergePlan.protectedManualCount} بنود يدوية أو معدلة. هل ترغب بالتأكيد في استبدالها؟`,
      proposedFactors,
    };
  }

  // 3. تطبيق التغييرات في قاعدة البيانات دفعة واحدة مع مهلة كافية
  await prisma.$transaction(
    async (tx) => {
      // حذف البنود المحددة في خطة الدمج إن وجدت (في وضع replace)
      if (mergePlan.factorsToDeleteIds.length > 0) {
        await tx.pestFactor.deleteMany({
          where: { id: { in: mergePlan.factorsToDeleteIds } },
        });
      }

      // حساب أعلى ترتيب حالي لكل خلية في الذاكرة لتجنب استعلامات متكررة عبر الشبكة
      const cellMaxOrder: Record<string, number> = {};
      const remainingFactors = existingFactors.filter(
        (f) => !mergePlan.factorsToDeleteIds.includes(f.id)
      );
      for (const f of remainingFactors) {
        const key = `${f.dimension}:${f.category}`;
        cellMaxOrder[key] = Math.max(cellMaxOrder[key] ?? -1, f.sortOrder);
      }

      const factorsToInsert = mergePlan.factorsToCreate.map((factor) => {
        const key = `${factor.dimension}:${factor.category}`;
        const nextOrder = (cellMaxOrder[key] ?? -1) + 1;
        cellMaxOrder[key] = nextOrder;
        return {
          analysisId,
          dimension: factor.dimension,
          category: factor.category,
          content: factor.content,
          sortOrder: nextOrder,
          source: factor.source,
          createdById: actor.userId,
        };
      });

      if (factorsToInsert.length > 0) {
        await tx.pestFactor.createMany({
          data: factorsToInsert,
        });
      }

      // تسجيل استهلاك التوليد في pest_generation_logs
      await tx.pestGenerationLog.create({
        data: {
          analysisId,
          userId: actor.userId,
          scope: input.scope,
          dimension: input.dimension ? (input.dimension as any) : null,
          category: input.category ? (input.category as any) : null,
          strategy: input.strategy,
          model,
          promptTokens: tokens.prompt,
          completionTokens: tokens.completion,
          totalTokens: tokens.total,
          itemsCount: mergePlan.factorsToCreate.length,
        },
      });

      await updateAnalysisCreationMode(analysisId, tx);
      await syncToolRunSummary(analysisId, tx);
    },
    { timeout: 20000, maxWait: 10000 }
  );

  const updatedResult = await getAnalysisWithFactors(actor, analysisId);

  return {
    requiresConfirmation: false,
    message: "تم توليد بنود التحليل بالذكاء الاصطناعي بنجاح.",
    data: updatedResult,
  };
}
