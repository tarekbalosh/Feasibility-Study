/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  /**
   * مجلد البناء. الافتراضي .next كما هو، لكن يمكن تحويله بمتغيّر بيئة:
   *   NEXT_DIST_DIR=.next-check npx next build
   * فلا يكتب بناءُ تحقّقٍ فوق مجلد خادم التطوير وهو يعمل — كان ذلك
   * يترك الخادم يخدم حزماً مفقودة (404 على كل _next/static).
   */
  distDir: process.env.NEXT_DIST_DIR || '.next',

  // Proxy /local-api/* → http://localhost:8080/api/* (server-side, no CORS)
  async rewrites() {
    return [
      {
        source: '/local-api/:path*',
        destination: 'http://localhost:8080/api/:path*',
      },
    ]
  },

  /**
   * تحويلات دائمة (301) بعد تحويل الموقع من أداة واحدة إلى منصة أدوات.
   * نستخدم statusCode: 301 صراحةً — لأن permanent: true في Next يُصدر 308.
   * الترتيب مهم — Next يطبّق أول قاعدة مطابقة.
   * ملاحظة: Next يحافظ على معاملات الرابط (query) تلقائياً،
   * فرابط مثل /tool/FeasibilityTool?edit=123 يصل سليماً إلى المسار الجديد.
   */
  async redirects() {
    return [
      // معالج دراسة الجدوى — المسار القديم الأكثر انتشاراً
      {
        source: '/tool/FeasibilityTool',
        destination: '/tools/feasibility-study/start',
        statusCode: 301,
      },
      // بقية ما كان تحت /tool (شاشات الخطوات) → صفحة تعريف الأداة
      {
        source: '/tool/:path*',
        destination: '/tools/feasibility-study',
        statusCode: 301,
      },
      // مسار تسجيل قديم كان مستخدماً في أزرار الدعوة للإجراء
      {
        source: '/signup',
        destination: '/auth/register',
        statusCode: 301,
      },
    ]
  },
}

module.exports = nextConfig
