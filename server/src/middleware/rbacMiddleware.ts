import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";

// ——————————————————————————————————————————————
// خريطة الصلاحيات — المصدر الوحيد للحقيقة
// ——————————————————————————————————————————————

/**
 * كل صلاحية هي بوابة منطقية: إما مسموحة أو ممنوعة لكل دور.
 *
 * | الصلاحية              | owner | admin | member | viewer |
 * |-----------------------|-------|-------|--------|--------|
 * | canRead               |   ✓   |   ✓   |   ✓    |   ✓    |
 * | canWrite              |   ✓   |   ✓   |   ✓    |   ✗    |
 * | canManageMembers      |   ✓   |   ✓   |   ✗    |   ✗    |
 * | canManageWorkspace    |   ✓   |   ✓   |   ✗    |   ✗    |
 * | canAccessBilling      |   ✓   |   ✓   |   ✗    |   ✗    |
 */
export interface RolePermissions {
  canRead: boolean;
  canWrite: boolean;
  canManageMembers: boolean;
  canManageWorkspace: boolean;
  canAccessBilling: boolean;
}

export type WorkspaceRole = "owner" | "admin" | "member" | "viewer";
export type Permission = keyof RolePermissions;

export const ROLE_PERMISSIONS: Record<WorkspaceRole, RolePermissions> = {
  owner: {
    canRead: true,
    canWrite: true,
    canManageMembers: true,
    canManageWorkspace: true,
    canAccessBilling: true,
  },
  admin: {
    canRead: true,
    canWrite: true,
    canManageMembers: true,
    canManageWorkspace: true,
    canAccessBilling: true,
  },
  member: {
    canRead: true,
    canWrite: true,
    canManageMembers: false,
    canManageWorkspace: false,
    canAccessBilling: false,
  },
  viewer: {
    canRead: true,
    canWrite: false,
    canManageMembers: false,
    canManageWorkspace: false,
    canAccessBilling: false,
  },
};

// ——————————————————————————————————————————————
// رسائل الرفض بالعربية — تصف السبب بوضوح
// ——————————————————————————————————————————————

const PERMISSION_MESSAGES: Record<Permission, string> = {
  canRead: "ليس لديك صلاحية الاطلاع على هذا المحتوى.",
  canWrite: "صلاحيتك (مُطّلع) لا تسمح بالإنشاء أو التعديل أو الحذف.",
  canManageMembers: "إدارة الأعضاء متاحة للمالك والمشرفين فقط.",
  canManageWorkspace: "إدارة إعدادات مساحة العمل متاحة للمالك والمشرفين فقط.",
  canAccessBilling: "الوصول إلى بيانات الفوترة متاح للمالك والمشرفين فقط.",
};

// ——————————————————————————————————————————————
// Middleware factories
// ——————————————————————————————————————————————

/**
 * يسمح فقط لأدوار محددة بالمرور.
 *
 * @example
 * router.post("/invite", requireRole("owner", "admin"), controller.invite);
 */
export function requireRole(...allowedRoles: WorkspaceRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const role = req.workspace?.role as WorkspaceRole | undefined;

    if (!role) {
      next(ApiError.accessDenied("لم يُحدَّد دورك في مساحة العمل."));
      return;
    }

    if (!allowedRoles.includes(role)) {
      next(
        ApiError.accessDenied(
          `هذا الإجراء متاح للأدوار التالية فقط: ${allowedRoles.join("، ")}.`
        )
      );
      return;
    }

    next();
  };
}

/**
 * يسمح لمن يملك الصلاحية المحددة بالمرور.
 *
 * @example
 * router.post("/tool-runs", requirePermission("canWrite"), controller.save);
 * router.delete("/tool-runs/:id", requirePermission("canWrite"), controller.remove);
 */
export function requirePermission(permission: Permission) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const role = req.workspace?.role as WorkspaceRole | undefined;

    if (!role) {
      next(ApiError.accessDenied("لم يُحدَّد دورك في مساحة العمل."));
      return;
    }

    const permissions = ROLE_PERMISSIONS[role];

    if (!permissions || !permissions[permission]) {
      next(
        ApiError.accessDenied(
          PERMISSION_MESSAGES[permission] ||
            "ليس لديك الصلاحية الكافية لتنفيذ هذا الإجراء."
        )
      );
      return;
    }

    next();
  };
}

/**
 * يُلحق صلاحيات الدور بالطلب — يُستدعى بعد requireWorkspace
 * حتى تتمكن الخدمات من قراءة الصلاحيات مباشرةً من req.permissions.
 */
export function attachPermissions(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const role = req.workspace?.role as WorkspaceRole | undefined;

  if (role && ROLE_PERMISSIONS[role]) {
    (req as any).permissions = ROLE_PERMISSIONS[role];
  }

  next();
}
