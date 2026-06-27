import rateLimit from "express-rate-limit";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Rate Limiter — تقييد الطلبات
 * Development: 1000 طلب / دقيقة واحدة (لتسهيل التطوير)
 * Production:  100 طلب / 15 دقيقة لكل IP
 */
export const rateLimiter = rateLimit({
  windowMs: isDev ? 60 * 1000 : 15 * 60 * 1000,
  max: isDev ? 1000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "تم تجاوز الحد الأقصى للطلبات. حاول مجدداً بعد قليل.",
    },
  },
});

/**
 * Rate Limiter أشد للـ Auth routes
 * Development: 500 طلب / دقيقة واحدة (لتسهيل التطوير)
 * Production:  20 طلب / 15 دقيقة لكل IP
 */
export const authRateLimiter = rateLimit({
  windowMs: isDev ? 60 * 1000 : 15 * 60 * 1000,
  max: isDev ? 500 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "محاولات كثيرة. حاول مجدداً بعد قليل.",
    },
  },
});
