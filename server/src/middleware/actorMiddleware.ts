import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";
import { loadActor, type Actor } from "../services/accessService";

declare global {
  namespace Express {
    interface Request {
      /** هوية الفاعل داخل الهيكل التنظيمي — يملؤها attachActor */
      actor?: Actor;
    }
  }
}

/**
 * يُركَّب بعد requireWorkspace: يحمّل عضوية المستخدم وأقسامه مرّة واحدة
 * لكل طلب، فتقرأ الخدمات القرار من req.actor بدل تكرار الاستعلام.
 */
export const attachActor = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.userId || !req.workspace) {
      next(ApiError.authRequired());
      return;
    }
    req.actor = await loadActor(req.workspace.id, req.user.userId, req.workspace.role);
    next();
  } catch (error) {
    next(error instanceof ApiError ? error : ApiError.internal());
  }
};
