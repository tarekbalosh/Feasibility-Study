/**
 * ─────────────────────────────────────────────────────────────
 *  الجسر من تحليل SWOT إلى أداة دراسة الجدوى
 * ─────────────────────────────────────────────────────────────
 *  التمرير يتم عبر مسودة الضيف التي تقرأها أداة دراسة الجدوى أصلاً
 *  عند التحميل — فلا سطر واحد يتغيّر في تلك الأداة، ولا تظهر بيانات
 *  المشروع في شريط العنوان: الرابط لا يحمل إلا معرّف التحليل.
 *
 *  الدمج غير مدمِّر: لا نكتب فوق حقل فيه قيمة. من ترك دراسة جدوى
 *  نصف مكتملة يجدها كما تركها.
 * ─────────────────────────────────────────────────────────────
 */

import type { SwotInput } from "@/types/swot"

/** مفتاح مسودة الضيف في أداة دراسة الجدوى — مصدره تلك الأداة */
const FEASIBILITY_DRAFT_KEY = "entrplan_guest_draft"

/** سجلّ التمريرات: يُقرأ بمعرّف التحليل، فلا بيانات في الرابط */
const HANDOFF_KEY = "swot-feasibility-handoff"

/**
 * قطاعات أداة دراسة الجدوى. قائمة SWOT تزيد «مجال آخر» ولا مقابل له
 * هناك، فيُترك القطاع فارغاً ليختاره المستخدم بنفسه بدل تمرير قيمة
 * ترفضها الأداة.
 */
const SHARED_SECTORS = new Set([
  "مطاعم وأغذية",
  "تجارة وتجزئة",
  "خدمات",
  "تقني وناشئ",
  "صناعي",
])

interface HandoffRecord {
  analysisId: string
  projectName: string
  sector: string
  description: string
  at: string
}

const readJson = (key: string): any => {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/** هل الحقل فارغ فعلاً؟ الصفر والقيم الرقمية ليست فراغاً */
const isBlank = (value: unknown): boolean =>
  value === undefined || value === null || value === ""

/**
 * يكتب اسم المشروع والقطاع ووصف النشاط في مسودة أداة دراسة الجدوى،
 * ويعيد معرّف التمرير ليُوضع في الرابط. يعيد null إن تعذّر التخزين.
 */
export const handOffToFeasibility = (
  analysisId: string,
  input: SwotInput
): string | null => {
  if (typeof window === "undefined") return null

  const projectName = input.projectName.trim()
  const description = input.description.trim()
  const sector = SHARED_SECTORS.has(input.sector) ? input.sector : ""

  try {
    const draft = readJson(FEASIBILITY_DRAFT_KEY) ?? {}
    const data = draft.data ?? {}
    const projectInfo = data.projectInfo ?? {}
    const projectDetails = data.projectDetails ?? {}

    const merged = {
      ...draft,
      data: {
        ...data,
        sector: isBlank(data.sector) ? sector : data.sector,
        projectInfo: {
          ...projectInfo,
          projectName: isBlank(projectInfo.projectName)
            ? projectName
            : projectInfo.projectName,
          description: isBlank(projectInfo.description)
            ? description
            : projectInfo.description,
        },
        projectDetails: {
          ...projectDetails,
          projectName: isBlank(projectDetails.projectName)
            ? projectName
            : projectDetails.projectName,
        },
      },
    }

    window.localStorage.setItem(FEASIBILITY_DRAFT_KEY, JSON.stringify(merged))

    const record: HandoffRecord = {
      analysisId,
      projectName,
      sector,
      description,
      at: new Date().toISOString(),
    }
    window.localStorage.setItem(HANDOFF_KEY, JSON.stringify(record))

    return analysisId
  } catch {
    // امتلاء التخزين لا يمنع فتح الأداة — يفتحها المستخدم فارغة
    return null
  }
}

/** بيانات آخر تمرير — للتشخيص أو لعرض «قادم من تحليل SWOT» لاحقاً */
export const readHandoff = (): HandoffRecord | null => {
  if (typeof window === "undefined") return null
  const record = readJson(HANDOFF_KEY)
  return record && typeof record.analysisId === "string" ? record : null
}
