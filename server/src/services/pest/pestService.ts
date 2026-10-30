import { randomUUID } from "crypto";
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
  isImplicationScope,
  selectImplicationTargets,
  suggestImplicationsForTrend,
  GenerateRequestInput,
  GenerationContext,
  ExistingFactor,
  ProposedFactor,
} from "./pestGeneration";
import {
  validateLinkedFactorInput,
  checkImplicationLink,
  orderImplications,
  isImplicationCategory,
  resolveSuggestedSource,
  LINKED_MESSAGES,
  type LinkedFactorInput,
} from "./pestLinks";
import { logger } from "../../utils/logger";

// ─────────────────────────────────────────────────────────────
// Rate Limiter for AI Generation (In-Memory per user/workspace)
// ─────────────────────────────────────────────────────────────
const AI_RATE_LIMIT_PER_HOUR = 20;
const AI_SUGGEST_RATE_LIMIT_PER_HOUR = 60;
const aiGenerationLogMap = new Map<string, number[]>();

function checkAiRateLimit(userId: string, bucket: "generate" | "suggest" = "generate") {
  const limit = bucket === "generate" ? AI_RATE_LIMIT_PER_HOUR : AI_SUGGEST_RATE_LIMIT_PER_HOUR;
  const key = `${bucket}:${userId}`;
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  const history = aiGenerationLogMap.get(key) || [];
  const activeRequests = history.filter((timestamp) => timestamp > oneHourAgo);

  if (activeRequests.length >= limit) {
    throw ApiError.rateLimitExceeded(
      `تم تجاوز الحد المسموح لتوليد الذكاء الاصطناعي (${limit} عملية/ساعة). يرجى المحاولة لاحقاً.`
    );
  }

  activeRequests.push(now);
  aiGenerationLogMap.set(key, activeRequests);
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

/** يجلب التحليل ويتحقق من صلاحية التعديل (يُستخدم في كل عمليات الكتابة) */
async function loadAnalysisForEdit(actor: Actor, analysisId: string) {
  const analysis = await prisma.pestAnalysis.findFirst({
    where: { id: analysisId, workspaceId: actor.workspaceId },
  });
  if (!analysis) throw ApiError.notFound("التحليل غير موجود.");

  if (analysis.toolRunId) {
    await getRunWithAccess(actor, analysis.toolRunId, "edit");
  }
  return analysis;
}

/** خطأ قيد التفرد (انعكاس من نفس النوع مرتبط مسبقاً بنفس البند) */
function isUniqueViolation(err: any) {
  return err?.code === "P2002";
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
  } else if (actor.canWrite) {
    accessLevel = "edit";
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

  // ترتيب الانعكاسات حسب ترتيب بنودها الأبوية (القديمة غير المرتبطة في الأسفل)
  for (const dim of PEST_DIMENSIONS) {
    const g = groupedFactors[dim];
    g.positive_impact = orderImplications(g.trend, g.positive_impact);
    g.negative_impact = orderImplications(g.trend, g.negative_impact);
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

/**
 * إضافة بند منفرد (المسار القديم). بنود التوجهات لم تعد تُضاف منفردة —
 * يجب إنشاؤها مع انعكاسيها عبر createLinkedFactor.
 */
export async function addFactor(
  actor: Actor,
  analysisId: string,
  input: AddFactorInput
) {
  await loadAnalysisForEdit(actor, analysisId);

  if (input.category === "trend") {
    throw ApiError.invalidInput(
      "يجب إضافة بند التوجه مع انعكاسيه الإيجابي والسلبي معاً.",
      [{ field: "category", issue: "استخدم إضافة البند مع الانعكاسين." }]
    );
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

/**
 * إنشاء بند توجه مع انعكاسه الإيجابي والسلبي في عملية واحدة (transaction):
 * إما أن تُحفظ الثلاثة معاً أو لا يُحفظ شيء.
 */
export async function createLinkedFactor(
  actor: Actor,
  analysisId: string,
  input: LinkedFactorInput
) {
  const validation = validateLinkedFactorInput(input);
  if (!validation.ok) {
    throw ApiError.invalidInput("يرجى إكمال الحقول المطلوبة للبند وانعكاسيه.", validation.issues);
  }
  const v = validation.value;

  await loadAnalysisForEdit(actor, analysisId);

  return prisma.$transaction(
    async (tx) => {
      const [totalCount, last] = await Promise.all([
        tx.pestFactor.count({ where: { analysisId } }),
        tx.pestFactor.findFirst({
          where: { analysisId, dimension: v.dimension, category: "trend" },
          orderBy: { sortOrder: "desc" },
          select: { sortOrder: true },
        }),
      ]);

      if (totalCount + 3 > MAX_FACTORS_PER_ANALYSIS) {
        throw ApiError.invalidInput(`تم الوصول إلى الحد الأقصى للبنود (${MAX_FACTORS_PER_ANALYSIS}).`);
      }

      const sortOrder = (last?.sortOrder ?? -1) + 1;

      const trend = await tx.pestFactor.create({
        data: {
          analysisId,
          dimension: v.dimension,
          category: "trend",
          content: v.content,
          sortOrder,
          source: "manual",
          createdById: actor.userId,
        },
      });

      const [positive, negative] = await Promise.all([
        tx.pestFactor.create({
          data: {
            analysisId,
            dimension: v.dimension,
            category: "positive_impact",
            content: v.positiveImplication,
            sortOrder,
            source: v.positiveSource,
            createdById: actor.userId,
            parentFactorId: trend.id,
          },
        }),
        tx.pestFactor.create({
          data: {
            analysisId,
            dimension: v.dimension,
            category: "negative_impact",
            content: v.negativeImplication,
            sortOrder,
            source: v.negativeSource,
            createdById: actor.userId,
            parentFactorId: trend.id,
          },
        }),
      ]);

      const creationMode = await updateAnalysisCreationMode(analysisId, tx);
      await syncToolRunSummary(analysisId, tx);

      return { trend, positive, negative, creationMode };
    },
    { maxWait: 10000, timeout: 25000 }
  );
}

/** إضافة انعكاس ناقص لبند توجه قائم */
export async function addImplication(
  actor: Actor,
  analysisId: string,
  parentFactorId: string,
  input: { category?: unknown; content?: unknown; aiSuggested?: unknown }
) {
  if (!isImplicationCategory(input.category)) {
    throw ApiError.invalidInput("نوع الانعكاس غير صالح.", [
      { field: "category", issue: "يجب أن يكون positive_impact أو negative_impact." },
    ]);
  }
  const category = input.category;
  const content = typeof input.content === "string" ? input.content.trim() : "";
  if (!content) {
    throw ApiError.invalidInput(LINKED_MESSAGES.implicationRequired, [
      { field: "content", issue: LINKED_MESSAGES.implicationRequired },
    ]);
  }
  if (content.length > MAX_FACTOR_CHARS) {
    throw ApiError.invalidInput(LINKED_MESSAGES.tooLong, [{ field: "content", issue: LINKED_MESSAGES.tooLong }]);
  }

  await loadAnalysisForEdit(actor, analysisId);

  try {
    return await prisma.$transaction(
      async (tx) => {
        const parent = await tx.pestFactor.findFirst({ where: { id: parentFactorId, analysisId } });
        const siblings = parent
          ? await tx.pestFactor.findMany({ where: { analysisId, parentFactorId: parent.id } })
          : [];
        const error = checkImplicationLink(
          { id: "__new__", dimension: parent?.dimension ?? "", category },
          parent,
          siblings
        );
        if (error) throw ApiError.invalidInput(error, [{ field: "parentFactorId", issue: error }]);

        const factor = await tx.pestFactor.create({
          data: {
            analysisId,
            dimension: parent!.dimension,
            category,
            content,
            sortOrder: parent!.sortOrder,
            source: resolveSuggestedSource(content, input.aiSuggested),
            createdById: actor.userId,
            parentFactorId: parent!.id,
          },
        });

        const creationMode = await updateAnalysisCreationMode(analysisId, tx);
        await syncToolRunSummary(analysisId, tx);
        return { factor, creationMode };
      },
      { maxWait: 10000, timeout: 20000 }
    );
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw ApiError.invalidInput("هذا البند مرتبط مسبقاً بانعكاس من نفس النوع.");
    }
    throw err;
  }
}

export interface UpdateFactorPatch {
  content?: unknown;
  /** ربط انعكاس ببند أب (أو null لفك الربط) */
  parentFactorId?: unknown;
}

export async function updateFactor(
  actor: Actor,
  analysisId: string,
  factorId: string,
  patch: UpdateFactorPatch
) {
  await loadAnalysisForEdit(actor, analysisId);

  const existing = await prisma.pestFactor.findFirst({
    where: { id: factorId, analysisId },
  });
  if (!existing) throw ApiError.notFound("البند غير موجود.");

  const data: Record<string, unknown> = {};

  if (patch.content !== undefined) {
    const cleanContent = typeof patch.content === "string" ? patch.content.trim() : "";
    if (cleanContent.length > MAX_FACTOR_CHARS) {
      throw ApiError.invalidInput(`طول البند يتجاوز الحد الأقصى (${MAX_FACTOR_CHARS} حرفاً).`);
    }
    // البنود المرتبطة (التوجه وانعكاساه) لا تُترك فارغة
    if (!cleanContent && (existing.category === "trend" || existing.parentFactorId)) {
      throw ApiError.invalidInput("لا يمكن ترك نص البند فارغاً.", [
        { field: "content", issue: "النص مطلوب." },
      ]);
    }
    if (cleanContent !== existing.content) {
      data.content = cleanContent;
      // تحول المصدر من ai إلى ai_edited عند التعديل
      if (existing.source === "ai") data.source = "ai_edited" as PestFactorSourceKey;
    }
  }

  if (patch.parentFactorId !== undefined) {
    if (patch.parentFactorId === null || patch.parentFactorId === "") {
      data.parentFactorId = null;
    } else {
      const parentId = String(patch.parentFactorId);
      const parent = await prisma.pestFactor.findFirst({ where: { id: parentId, analysisId } });
      const siblings = parent
        ? await prisma.pestFactor.findMany({ where: { analysisId, parentFactorId: parent.id } })
        : [];
      const error = checkImplicationLink(existing, parent, siblings);
      if (error) throw ApiError.invalidInput(error, [{ field: "parentFactorId", issue: error }]);
      data.parentFactorId = parent!.id;
      data.sortOrder = parent!.sortOrder;
    }
  }

  if (Object.keys(data).length === 0) return existing;

  let updated;
  try {
    updated = await prisma.pestFactor.update({ where: { id: factorId }, data });
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw ApiError.invalidInput("هذا البند مرتبط مسبقاً بانعكاس من نفس النوع.");
    }
    throw err;
  }

  await updateAnalysisCreationMode(analysisId);
  await syncToolRunSummary(analysisId);

  return updated;
}

/** حذف بند. حذف بند توجه يحذف انعكاسيه المرتبطين معه في نفس العملية */
export async function deleteFactor(
  actor: Actor,
  analysisId: string,
  factorId: string
) {
  await loadAnalysisForEdit(actor, analysisId);

  const existing = await prisma.pestFactor.findFirst({
    where: { id: factorId, analysisId },
  });
  if (!existing) throw ApiError.notFound("البند غير موجود.");

  const deletedIds = await prisma.$transaction(
    async (tx) => {
      const children = await tx.pestFactor.findMany({
        where: { analysisId, parentFactorId: factorId },
        select: { id: true },
      });
      const childIds = children.map((c) => c.id);
      if (childIds.length > 0) {
        await tx.pestFactor.deleteMany({ where: { id: { in: childIds } } });
      }
      await tx.pestFactor.delete({ where: { id: factorId } });

      await updateAnalysisCreationMode(analysisId, tx);
      await syncToolRunSummary(analysisId, tx);
      return [factorId, ...childIds];
    },
    { maxWait: 10000, timeout: 20000 }
  );

  return { success: true, deletedIds };
}

/** إعادة الترتيب — ترتيب التوجه يُطبَّق على انعكاسيه المرتبطين أيضاً */
export async function reorderFactors(
  actor: Actor,
  analysisId: string,
  items: Array<{ id: string; sortOrder: number }>
) {
  await loadAnalysisForEdit(actor, analysisId);

  if (!items || items.length === 0) {
    return { success: true };
  }

  await prisma.$transaction(
    items.flatMap((item) => [
      prisma.pestFactor.updateMany({
        where: { id: item.id, analysisId },
        data: { sortOrder: item.sortOrder },
      }),
      prisma.pestFactor.updateMany({
        where: { parentFactorId: item.id, analysisId },
        data: { sortOrder: item.sortOrder },
      }),
    ])
  );

  return { success: true };
}

// ─────────────────────────────────────────────────────────────
// AI: اقتراح انعكاسين لبند واحد (بدون حفظ)
// ─────────────────────────────────────────────────────────────

export async function suggestImplications(
  actor: Actor,
  analysisId: string,
  input: { dimension?: unknown; content?: unknown }
) {
  if (!PEST_DIMENSIONS.includes(input.dimension as PestDimensionKey)) {
    throw ApiError.invalidInput(LINKED_MESSAGES.dimensionInvalid);
  }
  const content = typeof input.content === "string" ? input.content.trim() : "";
  if (content.length < 3) {
    throw ApiError.invalidInput("اكتب نص البند أولاً ليتم اقتراح الانعكاسين.", [
      { field: "content", issue: "اكتب نص البند أولاً ليتم اقتراح الانعكاسين." },
    ]);
  }

  const analysis = await loadAnalysisForEdit(actor, analysisId);
  checkAiRateLimit(actor.userId, "suggest");

  const factors = await prisma.pestFactor.findMany({
    where: { analysisId },
    orderBy: { sortOrder: "asc" },
  });

  const ctx: GenerationContext = {
    projectName: analysis.projectName || analysis.title,
    projectDescription: analysis.projectDescription,
    industry: analysis.industry,
    countryRegion: analysis.countryRegion,
    existingFactors: factors.map((f) => ({
      id: f.id,
      dimension: f.dimension as PestDimensionKey,
      category: f.category as PestCategoryKey,
      content: f.content,
      sortOrder: f.sortOrder,
      source: f.source as PestFactorSourceKey,
      parentFactorId: f.parentFactorId,
    })),
  };

  return suggestImplicationsForTrend(ctx, input.dimension as PestDimensionKey, content);
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

  const dimension = input.dimension as PestDimensionKey | undefined;
  const category = input.category as PestCategoryKey | undefined;

  const existingFactors: ExistingFactor[] = analysis.factors.map((f) => ({
    id: f.id,
    dimension: f.dimension as PestDimensionKey,
    category: f.category as PestCategoryKey,
    content: f.content,
    sortOrder: f.sortOrder,
    source: f.source as PestFactorSourceKey,
    parentFactorId: f.parentFactorId,
  }));

  // توليد عمود الانعكاسات: يعمل فقط على توجهات قائمة (لا انعكاسات بلا بند أب)
  let implicationTargets: ExistingFactor[] = [];
  if (isImplicationScope(input.scope, category) && dimension) {
    const hasTrends = existingFactors.some((f) => f.dimension === dimension && f.category === "trend");
    if (!hasTrends) {
      throw ApiError.invalidInput(
        "لا توجد بنود في «أبرز التوجهات والمؤشرات» لهذا البُعد. أضف بنوداً أولاً أو استخدم «توليد البُعد»."
      );
    }
    implicationTargets = selectImplicationTargets(existingFactors, dimension, category, input.strategy);
    if (implicationTargets.length === 0) {
      return {
        requiresConfirmation: false,
        message: "جميع بنود هذا البُعد لديها انعكاس من هذا النوع بالفعل.",
        data: await getAnalysisWithFactors(actor, analysisId),
      };
    }
  }

  // فحص التعارض مع البنود اليدوية قبل استدعاء النموذج (توفيراً للاستهلاك)
  const preCheck = computeMergePlan(
    input.scope, input.strategy, dimension, category, existingFactors, null, input.confirmOverwrite
  );
  if (preCheck.hasProtectedManualConflict) {
    return {
      requiresConfirmation: true,
      protectedManualCount: preCheck.protectedManualCount,
      message: `يحتوي هذا النطاق على ${preCheck.protectedManualCount} بنود يدوية أو معدلة. هل ترغب بالتأكيد في استبدالها؟`,
    };
  }

  // فحص معدل التوليد للمستخدم
  checkAiRateLimit(actor.userId);

  const ctx: GenerationContext = {
    projectName: analysis.projectName,
    projectDescription: analysis.projectDescription,
    industry: analysis.industry,
    countryRegion: analysis.countryRegion,
    existingFactors,
  };

  // 1. استدعاء النموذج: توجهات مع انعكاسيها، أو انعكاسات لتوجهات قائمة
  const { proposal, tokens, model } = await callOpenAIForPest(
    ctx, input.scope, input.strategy, dimension, category, implicationTargets
  );

  // 2. منطق الحماية والدمج
  const mergePlan = computeMergePlan(
    input.scope, input.strategy, dimension, category, existingFactors, proposal, input.confirmOverwrite
  );

  const deleted = new Set(mergePlan.factorsToDeleteIds);
  const remaining = existingFactors.filter(
    (f) => !deleted.has(f.id) && !(f.parentFactorId && deleted.has(f.parentFactorId))
  );
  const remainingById = new Map(remaining.map((f) => [f.id, f]));

  // حساب أعلى ترتيب للتوجهات في كل بُعد
  const trendMaxOrder: Record<string, number> = {};
  for (const f of remaining) {
    if (f.category === "trend") {
      trendMaxOrder[f.dimension] = Math.max(trendMaxOrder[f.dimension] ?? -1, f.sortOrder);
    }
  }

  type Row = {
    id: string;
    analysisId: string;
    dimension: PestDimensionKey;
    category: PestCategoryKey;
    content: string;
    sortOrder: number;
    source: PestFactorSourceKey;
    createdById: string;
    parentFactorId: string | null;
  };
  const trendRows: Row[] = [];
  const childRows: Row[] = [];

  for (const t of proposal.triples) {
    const order = (trendMaxOrder[t.dimension] ?? -1) + 1;
    trendMaxOrder[t.dimension] = order;
    const trendId = randomUUID();
    const base = { analysisId, dimension: t.dimension, sortOrder: order, source: t.source, createdById: actor.userId };
    trendRows.push({ ...base, id: trendId, category: "trend", content: t.content, parentFactorId: null });
    childRows.push({ ...base, id: randomUUID(), category: "positive_impact", content: t.positiveImplication, parentFactorId: trendId });
    childRows.push({ ...base, id: randomUUID(), category: "negative_impact", content: t.negativeImplication, parentFactorId: trendId });
  }

  for (const imp of proposal.implications) {
    const parent = remainingById.get(imp.parentFactorId);
    if (!parent || parent.category !== "trend" || parent.dimension !== imp.dimension) continue; // لا انعكاس بلا أب صالح
    childRows.push({
      id: randomUUID(),
      analysisId,
      dimension: imp.dimension,
      category: imp.category,
      content: imp.content,
      sortOrder: parent.sortOrder,
      source: imp.source,
      createdById: actor.userId,
      parentFactorId: parent.id,
    });
  }

  // 3. تطبيق التغييرات في قاعدة البيانات دفعة واحدة
  await prisma.$transaction(
    async (tx) => {
      if (mergePlan.factorsToDeleteIds.length > 0) {
        // الانعكاسات المرتبطة بالتوجهات المحذوفة تُحذف تلقائياً (ON DELETE CASCADE)
        await tx.pestFactor.deleteMany({
          where: { id: { in: mergePlan.factorsToDeleteIds } },
        });
      }

      // الآباء أولاً ثم الانعكاسات لضمان سلامة المفتاح الأجنبي
      if (trendRows.length > 0) await tx.pestFactor.createMany({ data: trendRows });
      if (childRows.length > 0) await tx.pestFactor.createMany({ data: childRows });

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
          itemsCount: trendRows.length + childRows.length,
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
