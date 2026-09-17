import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";

/**
 * Middleware للتحقق من صلاحيات مدير النظام (Admin)
 * يعتمد على التحقق من سر خاص من الواجهة الأمامية
 */
export const adminMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const adminSecret = req.headers['x-admin-secret'];
    // Allow either ADMIN_SECRET or ADMIN_PASSWORD to be used on the backend
    const expectedSecret = process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD;

    if (!expectedSecret || expectedSecret.trim() === '') {
      console.error("[ADMIN_AUTH] ADMIN_SECRET and ADMIN_PASSWORD environment variables are missing on the server");
      throw ApiError.internal("لم يتم إعداد كلمة مرور المدير في الخادم.");
    }

    if (!adminSecret || adminSecret !== expectedSecret) {
      throw ApiError.accessDenied("غير مصرح بالدخول للوحة الإدارة.");
    }

    next();
  } catch (error) {
    next(error);
  }
};
