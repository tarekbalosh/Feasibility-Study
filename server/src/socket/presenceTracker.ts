/**
 * متتبع حالة التواجد المباشر لأعضاء مساحات العمل داخل شاشة الدردشة (In-Memory Tracker)
 * يضمن تحديث فوري بدون أي تأخير وبدقة 100%
 */

// workspaceId -> Map<userId, socketCount>
const activeChatUsers = new Map<string, Map<string, number>>();

/** تسجيل دخول المستخدم إلى شاشة الدردشة */
export function markUserInChat(workspaceId: string, userId: string): void {
  if (!activeChatUsers.has(workspaceId)) {
    activeChatUsers.set(workspaceId, new Map());
  }
  const userMap = activeChatUsers.get(workspaceId)!;
  userMap.set(userId, (userMap.get(userId) || 0) + 1);
}

/** تسجيل مغادرة المستخدم لشاشة الدردشة */
export function markUserLeaveChat(workspaceId: string, userId: string): boolean {
  const userMap = activeChatUsers.get(workspaceId);
  if (!userMap) return true;
  const current = (userMap.get(userId) || 0) - 1;
  if (current <= 0) {
    userMap.delete(userId);
    return true; // غادر الدردشة كلياً
  } else {
    userMap.set(userId, current);
    return false; // لا يزال لديه تبويب آخر مفتوح
  }
}

/** التحقق مما إذا كان المستخدم متواجداً حالياً داخل شاشة الدردشة */
export function isUserInChat(workspaceId: string, userId: string): boolean {
  return (activeChatUsers.get(workspaceId)?.get(userId) || 0) > 0;
}

/** جلب جميع معرفات الأعضاء المتواجدين داخل شاشة الدردشة لمساحة عمل */
export function getChatOnlineUserIds(workspaceId: string): string[] {
  const userMap = activeChatUsers.get(workspaceId);
  if (!userMap) return [];
  return Array.from(userMap.keys());
}
