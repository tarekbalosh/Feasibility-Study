import {
  ROLE_PERMISSIONS,
  type Permission,
  type RolePermissions,
  type WorkspaceRole,
} from "@/types/workspace"

/**
 * دوال مساعدة للتحقق من صلاحيات الأدوار في الواجهة.
 *
 * تُستخدم لإخفاء أو تعطيل عناصر الواجهة بناءً على دور المستخدم
 * في مساحة العمل الحالية — مع بقاء الحماية الحقيقية على الخادم.
 *
 * @example
 * import { canWrite, canManageMembers } from "@/utils/permissions"
 *
 * // إخفاء زر الحذف للمُطّلع
 * {canWrite(role) && <DeleteButton />}
 *
 * // تعطيل زر دعوة الأعضاء للعضو العادي
 * <InviteButton disabled={!canManageMembers(role)} />
 */

/** جميع صلاحيات الدور */
export function getPermissions(role: WorkspaceRole): RolePermissions {
  return ROLE_PERMISSIONS[role] ?? ROLE_PERMISSIONS.viewer
}

/** هل يملك هذا الدور صلاحية محددة؟ */
export function hasPermission(
  role: WorkspaceRole,
  permission: Permission
): boolean {
  return getPermissions(role)[permission]
}

// ——————————————————————————————————————————————
// اختصارات مسمّاة — أوضح في القراءة من hasPermission العامة
// ——————————————————————————————————————————————

/** هل يستطيع إنشاء أو تعديل أو حذف المحتوى؟ (owner + admin + member) */
export function canWrite(role: WorkspaceRole): boolean {
  return getPermissions(role).canWrite
}

/** هل يستطيع القراءة فقط؟ (جميع الأدوار) */
export function canRead(role: WorkspaceRole): boolean {
  return getPermissions(role).canRead
}

/** هل يستطيع دعوة أو إزالة أعضاء؟ (owner + admin) */
export function canManageMembers(role: WorkspaceRole): boolean {
  return getPermissions(role).canManageMembers
}

/** هل يستطيع تعديل إعدادات المساحة؟ (owner + admin) */
export function canManageWorkspace(role: WorkspaceRole): boolean {
  return getPermissions(role).canManageWorkspace
}

/** هل يستطيع رؤية بيانات الفوترة والاشتراك؟ (owner + admin) */
export function canAccessBilling(role: WorkspaceRole): boolean {
  return getPermissions(role).canAccessBilling
}
