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
    const envAdminPassword = process.env.ADMIN_PASSWORD;

    if (!envAdminPassword || envAdminPassword.trim() === '') {
      throw ApiError.internal("لم يتم إعداد كلمة مرور المدير في الخادم.");
    }

    if (!adminSecret || adminSecret !== envAdminPassword) {
      throw ApiError.accessDenied("غير مصرح بالدخول للوحة الإدارة.");
    }

    next();
  } catch (error) {
    next(error);
  }
};
