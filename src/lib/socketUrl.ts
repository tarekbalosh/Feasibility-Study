/**
 * استخراج رابط خادم Socket.IO المباشر.
 *
 * ملاحظة حرجة: Vercel عبارة عن خوادم Serverless (AWS Lambda) ولا تدعم
 * اتصالات WebSockets المستمرة ولا ترحيلها عبر Next.js rewrites (/local-api).
 * لذلك يجب أن يتصل المتصفح مباشرة برابط خادم Render في الإنتاج، أو
 * بـ localhost:8080 أثناء التطوير المحلي.
 */
export function getSocketUrl(): string {
  if (typeof window !== "undefined") {
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    if (isLocalhost) {
      return "http://localhost:8080";
    }
  }

  // إذا تم تحديد المتغير بشكل صريح وكان رابطاً لخادم حقيقي وليس نطاق Vercel
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    const raw = process.env.NEXT_PUBLIC_SOCKET_URL.trim();
    if (raw && !raw.includes("vercel.app") && (raw.startsWith("http://") || raw.startsWith("https://"))) {
      return raw.replace(/\/api\/?$/, "").replace(/\/+$/, "");
    }
  }

  // دائماً في الإنتاج الاتصال المباشر بخادم Render المستقل
  return "https://feasibility-study.onrender.com";
}
