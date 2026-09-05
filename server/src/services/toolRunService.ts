import { prisma } from "../config/prisma";
import { ApiError } from "../utils/ApiError";

/** حدّ حجم الحمولة المحفوظة — يمنع إغراق الجدول بمخرجات ضخمة */
const MAX_PAYLOAD_CHARS = 400_000;

/** أقصى ما يُعاد في صفحة واحدة */
const MAX_PAGE_SIZE = 100;

export interface SaveToolRunInput {
  id?: string;
  toolSlug: string;
  title: string;
  summary?: string;
  input: unknown;
  output: unknown;
}

/** الشكل المختصر لبطاقة لوحة التحكم — بلا الحمولة الكاملة */
const listSelect = {
  id: true,
  toolSlug: true,
  title: true,
  summary: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { id: true, name: true } },
} as const;

function serialize(value: unknown, field: string): string {
  const json = JSON.stringify(value ?? null);

  if (json.length > MAX_PAYLOAD_CHARS) {
    throw ApiError.invalidInput("حجم البيانات المحفوظة كبير جداً.", [
      { field, issue: `الحد الأقصى ${MAX_PAYLOAD_CHARS} حرفاً.` },
    ]);
  }

  return json;
}

/** JSON التالف لا يُسقط الصفحة كلها — البطاقة تظهر ومحتواها فارغ */
function parse(json: string): unknown {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * حفظ مخرجات أداة — يُنشئ سجلاً جديداً أو يُحدّث القائم.
 *
 * التحديث لا الإضافة هو السلوك الافتراضي حين تُمرَّر الواجهة معرّفاً:
 * إعادة توليد التحليل نفسه أو تعديل بنوده يجب ألا تُراكم نسخاً في
 * لوحة التحكم.
 */
export async function saveToolRun(
  workspaceId: string,
  userId: string,
  data: SaveToolRunInput
) {
  const title = data.title?.trim();

  if (!title) {
    throw ApiError.invalidInput("عنوان التحليل مطلوب.", [
      { field: "title", issue: "العنوان مطلوب." },
    ]);
  }

  const payload = {
    toolSlug: data.toolSlug,
    title: title.slice(0, 150),
    summary: data.summary?.trim().slice(0, 300) || null,
    input: serialize(data.input, "input"),
    output: serialize(data.output, "output"),
  };

  if (data.id) {
    // التحديث مشروط بمساحة العمل: معرّف من مساحة أخرى لا يُحدَّث ولا
    // يُنشئ سجلاً بديلاً — نرفضه صراحةً بدل أن نتجاوزه بصمت.
    const existing = await prisma.toolRun.findFirst({
      where: { id: data.id, workspaceId },
      select: { id: true },
    });

    if (!existing) {
      throw ApiError.notFound("التحليل المطلوب تحديثه غير موجود في مساحة عملك.");
    }

    return await prisma.toolRun.update({
      where: { id: existing.id },
      data: payload,
      select: listSelect,
    });
  }

  return await prisma.toolRun.create({
    data: { ...payload, workspaceId, userId },
    select: listSelect,
  });
}

/** قائمة تحليلات مساحة العمل — أحدثها أولاً، مع فلترة اختيارية بالأداة */
export async function listToolRuns(
  workspaceId: string,
  options: { toolSlug?: string; limit?: number } = {}
) {
  const runs = await prisma.toolRun.findMany({
    where: {
      workspaceId,
      ...(options.toolSlug ? { toolSlug: options.toolSlug } : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: Math.min(options.limit ?? 50, MAX_PAGE_SIZE),
    select: listSelect,
  });

  return runs;
}

/** تحليل واحد بحمولته الكاملة — لإعادة فتحه داخل أداته */
export async function getToolRun(workspaceId: string, id: string) {
  const run = await prisma.toolRun.findFirst({
    where: { id, workspaceId },
    include: { user: { select: { id: true, name: true } } },
  });

  if (!run) {
    throw ApiError.notFound("التحليل المطلوب غير موجود.");
  }

  return {
    id: run.id,
    toolSlug: run.toolSlug,
    title: run.title,
    summary: run.summary,
    input: parse(run.input),
    output: parse(run.output),
    user: run.user,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
  };
}

/** حذف تحليل — أي عضو فعّال في المساحة يملك ذلك */
export async function deleteToolRun(workspaceId: string, id: string) {
  const { count } = await prisma.toolRun.deleteMany({
    where: { id, workspaceId },
  });

  if (count === 0) {
    throw ApiError.notFound("التحليل المطلوب غير موجود.");
  }

  return { message: "تم حذف التحليل بنجاح." };
}
