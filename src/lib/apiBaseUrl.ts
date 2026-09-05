/**
 * مصدر واحد لعنوان الـ API في المتصفح.
 *
 * كان الاشتقاق مكرَّراً في ثلاثة ملفات، وطبّق ملفان منها تصحيحاً لم
 * يطبّقه الثالث (services/auth.service) — فكان تجديد الجلسة والخروج
 * يناديان نطاق الواجهة بدل الـ API ويرتدّان 404. التوحيد هنا يمنع
 * تكرار الانحراف.
 */

export const PRODUCTION_API_URL = "https://feasibility-study.onrender.com/api"

/**
 * متغيّر NEXT_PUBLIC_API_BASE_URL على Vercel قد يكون مضبوطاً على نطاق
 * الواجهة (‎https://…vercel.app‎) بدل الخادم. لا يمكن أن يكون ذلك
 * صحيحاً: الواجهة لا تخدم ‎/auth‎ ولا ‎/invites‎، فنعيده إلى عنوان
 * الإنتاج. أما القيمة النسبية ‎/local-api‎ فسليمة — يترجمها rewrite
 * في next.config أثناء التطوير.
 */
export const sanitizeApiBaseUrl = (raw?: string): string => {
  const baseURL = raw || PRODUCTION_API_URL
  if (baseURL.includes("vercel.app") && !baseURL.includes("/api")) {
    return PRODUCTION_API_URL
  }
  return baseURL
}

// القراءة الحرفية لازمة: Next يستبدل النص وقت البناء ولا يقرأه وقت التشغيل.
export const API_BASE_URL = sanitizeApiBaseUrl(
  process.env.NEXT_PUBLIC_API_BASE_URL
)
