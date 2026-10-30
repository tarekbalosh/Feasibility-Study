import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import { logger } from "../../utils/logger";
import {
  type Actor,
  getRunWithAccess,
  resolveProjectPlacement,
  computeProjectLevel,
  projectListWhere,
  type ProjectLevel,
} from "../accessService";
import {
  PORTER_TOOL_SLUG,
  PORTER_FORCES,
  PORTER_FIELDS,
  type PorterForces,
  type PorterForceContent,
  type PorterForceKey,
  type PorterCreationModeKey,
  type PorterStatusKey,
  emptyForce,
  emptyForces,
  MAX_FIELD_CHARS,
} from "./porterConstants";
import {
  callOpenAIForPorter,
  suggestPorterImplications,
  type GenerateRequestInput,
  type GenerationContext,
  type SuggestPorterImplicationsInput,
} from "./porterGeneration";

// ─────────────────────────────────────────────────────────────
// Rate Limiter for AI Generation (In-Memory per user)
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
// JSON <-> typed forces
// ─────────────────────────────────────────────────────────────

/** يحوّل قيمة JSON الخام من قاعدة البيانات إلى قوة بثلاثة حقول نصية سليمة مع قائمة البنود المهيكلة */
export function normalizeForce(raw: unknown): PorterForceContent {
  const source = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const result = emptyForce();
  for (const field of PORTER_FIELDS) {
    const value = source[field];
    result[field] = typeof value === "string" ? value : "";
  }
  if (Array.isArray(source.items)) {
    result.items = source.items as any;
  }
  return result;
}

const FORCE_COLUMNS: Record<PorterForceKey, "newEntrants" | "buyers" | "suppliers" | "substitutes" | "rivalry"> = {
  newEntrants: "newEntrants",
  buyers: "buyers",
  suppliers: "suppliers",
  substitutes: "substitutes",
  rivalry: "rivalry",
};

type PorterRow = {
  newEntrants: unknown;
  buyers: unknown;
  suppliers: unknown;
  substitutes: unknown;
  rivalry: unknown;
};

function forcesFromRow(row: PorterRow): PorterForces {
  const forces = emptyForces();
  for (const key of PORTER_FORCES) {
    forces[key] = normalizeForce(row[FORCE_COLUMNS[key]]);
  }
  return forces;
}

export type PartialForces = Partial<Record<PorterForceKey, Partial<PorterForceContent>>>;

/** يدمج الحقول المرسلة فوق المحتوى الحالي ويتحقق من الحدود */
function mergeForces(current: PorterForces, incoming: PartialForces): PorterForces {
  const next: PorterForces = {
    newEntrants: { ...current.newEntrants },
    buyers: { ...current.buyers },
    suppliers: { ...current.suppliers },
    substitutes: { ...current.substitutes },
    rivalry: { ...current.rivalry },
  };

  for (const key of PORTER_FORCES) {
    const patch = incoming[key];
    if (!patch) continue;
    for (const field of PORTER_FIELDS) {
      const value = patch[field];
      if (value === undefined) continue;
      if (typeof value !== "string") {
        throw ApiError.invalidInput("محتوى الحقل يجب أن يكون نصاً.", [{ field: `${key}.${field}`, issue: "نوع غير صالح." }]);
      }
      if (value.length > MAX_FIELD_CHARS) {
        throw ApiError.invalidInput(`طول الحقل يتجاوز الحد الأقصى (${MAX_FIELD_CHARS} حرفاً).`, [
          { field: `${key}.${field}`, issue: "النص أطول من الحد المسموح." },
        ]);
      }
      next[key][field] = value;
    }
    if (patch.items !== undefined && Array.isArray(patch.items)) {
      next[key].items = patch.items;
    }
  }
  return next;
}

function forcesToPrismaData(forces: PorterForces) {
  return {
    newEntrants: forces.newEntrants as unknown as Prisma.InputJsonObject,
    buyers: forces.buyers as unknown as Prisma.InputJsonObject,
    suppliers: forces.suppliers as unknown as Prisma.InputJsonObject,
    substitutes: forces.substitutes as unknown as Prisma.InputJsonObject,
    rivalry: forces.rivalry as unknown as Prisma.InputJsonObject,
  };
}

/** عدد الحقول المعبّأة من أصل 15 */
function countFilledFields(forces: PorterForces): number {
  let filled = 0;
  for (const key of PORTER_FORCES) {
    for (const field of PORTER_FIELDS) {
      if (forces[key][field].trim().length > 0) filled++;
    }
  }
  return filled;
}

const TOTAL_FIELDS = PORTER_FORCES.length * PORTER_FIELDS.length;

// ─────────────────────────────────────────────────────────────
// Helper: Sync ToolRun Record
// ─────────────────────────────────────────────────────────────
async function syncToolRunSummary(analysisId: string) {
  const analysis = await prisma.porterAnalysis.findUnique({ where: { id: analysisId } });
  if (!analysis || !analysis.toolRunId) return;

  const filled = countFilledFields(forcesFromRow(analysis));
  const summary = `تحليل قوى بورتر: ${filled} من ${TOTAL_FIELDS} حقلاً معبّأ (${analysis.creationMode}).`;

  await prisma.toolRun.update({
    where: { id: analysis.toolRunId },
    data: {
      title: analysis.title,
      summary,
      output: JSON.stringify({
        analysisId: analysis.id,
        filledFields: filled,
        mode: analysis.creationMode,
      }),
      updatedAt: new Date(),
    },
  });
}

// ─────────────────────────────────────────────────────────────
// Service Functions: Porter Analysis CRUD
// ─────────────────────────────────────────────────────────────

export interface CreatePorterAnalysisInput {
  title: string;
  projectName?: string;
  projectDescription?: string;
  industry?: string;
  countryRegion?: string;
  departmentId?: string;
  planId?: string;
  forces?: PartialForces;
  mode?: PorterCreationModeKey;
}

const analysisIncludes = {
  department: { select: { id: true, name: true, color: true, icon: true } },
  createdBy: { select: { id: true, name: true, email: true } },
} as const;

export async function createAnalysis(actor: Actor, input: CreatePorterAnalysisInput) {
  const title = input.title?.trim();
  if (!title) {
    throw ApiError.invalidInput("عنوان التحليل مطلوب.", [{ field: "title", issue: "العنوان مطلوب." }]);
  }

  const forces = mergeForces(emptyForces(), input.forces ?? {});

  const placement = await resolveProjectPlacement(actor, {
    departmentId: input.departmentId,
    planId: input.planId,
  });

  // إنشاء سجل مرآة في tool_runs أولاً حتى تظهر في لوحة التحكم وتخضع للصلاحيات
  const toolRun = await prisma.toolRun.create({
    data: {
      toolSlug: PORTER_TOOL_SLUG,
      title: title.slice(0, 150),
      summary: "تحليل قوى بورتر جديد (قيد الإعداد)",
      input: JSON.stringify({
        projectName: input.projectName || null,
        industry: input.industry || null,
        countryRegion: input.countryRegion || null,
      }),
      output: JSON.stringify({ filledFields: 0 }),
      workspaceId: actor.workspaceId,
      userId: actor.userId,
      departmentId: placement.departmentId,
      planId: placement.planId,
      visibility: "department",
    },
  });

  const analysis = await prisma.porterAnalysis.create({
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
      ...forcesToPrismaData(forces),
      status: "draft",
      creationMode: input.mode ?? "manual",
      language: "ar",
    },
    include: analysisIncludes,
  });

  if (countFilledFields(forces) > 0) {
    await syncToolRunSummary(analysis.id);
  }

  return serializeDetail(analysis, "manage");
}

export async function listAnalyses(
  actor: Actor,
  options: { departmentId?: string; mine?: boolean; limit?: number } = {}
) {
  const limit = Math.min(Math.max(options.limit || 50, 1), 100);

  // الاعتماد على نفس سياسة رؤية المشاريع عبر سجل tool_runs المرآة
  const analyses = await prisma.porterAnalysis.findMany({
    where: {
      workspaceId: actor.workspaceId,
      toolRun: projectListWhere(actor),
      ...(options.departmentId ? { departmentId: options.departmentId } : {}),
      ...(options.mine ? { createdById: actor.userId } : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: analysisIncludes,
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
    filledFields: countFilledFields(forcesFromRow(a)),
    totalFields: TOTAL_FIELDS,
  }));
}

export async function getAnalysis(actor: Actor, analysisId: string) {
  const analysis = await prisma.porterAnalysis.findFirst({
    where: {
      workspaceId: actor.workspaceId,
      OR: [{ id: analysisId }, { toolRunId: analysisId }],
    },
    include: {
      ...analysisIncludes,
      toolRun: {
        include: {
          permissions: { select: { workspaceMemberId: true, level: true } },
          plan: { select: { members: { select: { workspaceMemberId: true } } } },
        },
      },
    },
  });

  if (!analysis) {
    throw ApiError.notFound("تحليل قوى بورتر المطلوب غير موجود.");
  }

  // التحقق من مستوى صلاحية الفاعل
  let accessLevel: ProjectLevel = "view";
  if (analysis.toolRun) {
    const level = computeProjectLevel(actor, analysis.toolRun as any);
    if (!level) {
      // نُخفي وجود التحليل عمّن لا يملك صلاحية الاطلاع (كما في getRunWithAccess)
      throw ApiError.notFound("تحليل قوى بورتر المطلوب غير موجود.");
    }
    accessLevel = level;
  }

  return serializeDetail(analysis, accessLevel);
}

export interface UpdatePorterAnalysisInput
  extends Partial<Omit<CreatePorterAnalysisInput, "mode" | "departmentId" | "planId">> {
  status?: PorterStatusKey;
  creationMode?: PorterCreationModeKey;
}

export async function updateAnalysis(actor: Actor, analysisId: string, data: UpdatePorterAnalysisInput) {
  const analysis = await prisma.porterAnalysis.findFirst({
    where: { id: analysisId, workspaceId: actor.workspaceId },
  });

  if (!analysis) {
    throw ApiError.notFound("تحليل قوى بورتر المطلوب غير موجود.");
  }

  let accessLevel: ProjectLevel = "manage";
  if (analysis.toolRunId) {
    accessLevel = (await getRunWithAccess(actor, analysis.toolRunId, "edit")).level;
  }

  const nextForces = data.forces ? mergeForces(forcesFromRow(analysis), data.forces) : null;

  const updated = await prisma.porterAnalysis.update({
    where: { id: analysisId },
    data: {
      ...(data.title ? { title: data.title.trim().slice(0, 150) } : {}),
      ...(data.projectName !== undefined ? { projectName: data.projectName?.trim() || null } : {}),
      ...(data.projectDescription !== undefined
        ? { projectDescription: data.projectDescription?.trim() || null }
        : {}),
      ...(data.industry !== undefined ? { industry: data.industry?.trim() || null } : {}),
      ...(data.countryRegion !== undefined ? { countryRegion: data.countryRegion?.trim() || null } : {}),
      ...(data.status ? { status: data.status } : {}),
      ...(data.creationMode ? { creationMode: data.creationMode } : {}),
      ...(nextForces ? forcesToPrismaData(nextForces) : {}),
    },
    include: analysisIncludes,
  });

  await syncToolRunSummary(analysisId);

  return serializeDetail(updated, accessLevel);
}

export async function deleteAnalysis(actor: Actor, analysisId: string) {
  const analysis = await prisma.porterAnalysis.findFirst({
    where: { id: analysisId, workspaceId: actor.workspaceId },
  });

  if (!analysis) {
    throw ApiError.notFound("تحليل قوى بورتر المطلوب غير موجود.");
  }

  if (analysis.toolRunId) {
    await getRunWithAccess(actor, analysis.toolRunId, "manage");
    // الحذف المتسلسل لـ toolRun سيحذف porterAnalysis تلقائياً عبر ON DELETE CASCADE
    await prisma.toolRun.delete({ where: { id: analysis.toolRunId } });
  } else {
    await prisma.porterAnalysis.delete({ where: { id: analysisId } });
  }

  return { success: true, message: "تم حذف تحليل قوى بورتر بنجاح." };
}

// ─────────────────────────────────────────────────────────────
// AI Generation Service Entry Point
// ─────────────────────────────────────────────────────────────
//  التوليد لا يحفظ شيئاً: يعيد القوى الخمس ليراجعها المستخدم في
//  الواجهة قبل الضغط على «حفظ». بهذا لا يُستبدل عمل يدوي دون علمه.

export async function generatePorterAI(actor: Actor, input: GenerateRequestInput) {
  // فحص معدل التوليد للمستخدم
  checkAiRateLimit(actor.userId);

  const ctx: GenerationContext = {
    projectDescription: input.projectDescription,
    projectName: input.projectName,
    industry: input.industry,
    countryRegion: input.countryRegion,
  };

  const { forces, tokens, model } = await callOpenAIForPorter(ctx);

  logger.info("Porter AI generation completed", {
    userId: actor.userId,
    workspaceId: actor.workspaceId,
    model,
    totalTokens: tokens.total,
  });

  return {
    forces,
    model,
    usedFallback: model === "heuristic-fallback",
    message: "تم توليد تحليل قوى بورتر بالذكاء الاصطناعي بنجاح.",
  };
}

export async function suggestImplications(
  actor: Actor,
  input: SuggestPorterImplicationsInput
) {
  checkAiRateLimit(actor.userId);
  return suggestPorterImplications(input);
}

// ─────────────────────────────────────────────────────────────
// Serializer
// ─────────────────────────────────────────────────────────────

function serializeDetail(
  analysis: {
    id: string;
    title: string;
    projectName: string | null;
    projectDescription: string | null;
    industry: string | null;
    countryRegion: string | null;
    status: string;
    creationMode: string;
    language: string;
    createdAt: Date;
    updatedAt: Date;
    department: { id: string; name: string; color: string; icon: string } | null;
    createdBy: { id: string; name: string; email: string };
  } & PorterRow,
  accessLevel: ProjectLevel
) {
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
    forces: forcesFromRow(analysis),
  };
}
