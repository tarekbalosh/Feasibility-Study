import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  // حذف جميع سجلات الأعضاء القديمة بحالة "invited" (التي لا تمثل عضواً نشطاً)
  const deleted = await prisma.workspaceMember.deleteMany({
    where: { status: 'invited', userId: null }
  });
  console.log(`Deleted ${deleted.count} stale invited member records`);
}
main().finally(() => prisma.$disconnect());

async function cleanupDuplicates() {
  // تنظيف الدعوات المكررة — احتفظ فقط بالأحدث لكل إيميل في كل مساحة
  const workspaceId = 'a2d6cfeb-1f0d-4c91-a9ec-6f902c21553d';
  const invites = await prisma.workspaceInvite.findMany({
    where: { workspaceId, accepted: false },
    orderBy: { createdAt: 'desc' }
  });
  
  const seen = new Set<string>();
  const toDelete: string[] = [];
  for (const inv of invites) {
    if (seen.has(inv.email)) {
      toDelete.push(inv.id);
    } else {
      seen.add(inv.email);
    }
  }
  
  if (toDelete.length > 0) {
    await prisma.workspaceInvite.deleteMany({ where: { id: { in: toDelete } } });
    console.log(`Deleted ${toDelete.length} duplicate pending invites`);
  } else {
    console.log('No duplicate invites to clean');
  }
}
cleanupDuplicates().finally(() => prisma.$disconnect());
