import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";
import { getPrimaryWorkspace } from "../services/workspaceService";

// Extend Express Request with the resolved workspace
declare global {
  namespace Express {
    interface Request {
      workspace?: {
        id: string;
        name: string;
        role: string;
      };
    }
  }
}

/** الرمز الذي تتعرّف عليه الواجهة لتحوّل المستخدم إلى /workspace/create */
export const WORKSPACE_REQUIRED_CODE = "WORKSPACE_REQUIRED";

/**
 * حارس مساحة العمل — يُركَّب بعد authMiddleware على كل مسارات الأدوات.
 *
 * التحقق يجري على الخادم في كل طلب لا على الواجهة وحدها، فلا يُتجاوز
 * بنداء مباشر على الـ API. يرفع 403 برمز WORKSPACE_REQUIRED حتى
 * تميّزه الواجهة عن سائر أخطاء الصلاحيات وتوجّه المستخدم لإنشاء مساحة
 * بدل عرض رسالة رفض عامة.
 */
export const requireWorkspace = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.userId) {
      next(ApiError.authRequired());
      return;
    }

    const workspace = await getPrimaryWorkspace(req.user.userId);

    if (!workspace) {
      next(
        new ApiError(
          403,
          WORKSPACE_REQUIRED_CODE,
          "يجب إنشاء مساحة عمل أولاً لاستخدام الأدوات."
        )
      );
      return;
    }

    req.workspace = {
      id: workspace.id,
      name: workspace.name,
      role: workspace.role,
    };

    next();
  } catch (error) {
    next(error instanceof ApiError ? error : ApiError.internal());
  }
};
