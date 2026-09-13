import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const members = await prisma.workspaceMember.findMany({ 
    where: { workspaceId: 'a2d6cfeb-1f0d-4c91-a9ec-6f902c21553d' } 
  });
  console.log("WorkspaceMembers after cleanup:");
  members.forEach(m => console.log(` - ${m.email} | status: ${m.status} | id: ${m.id}`));
  
  const invites = await prisma.workspaceInvite.findMany({ 
    where: { workspaceId: 'a2d6cfeb-1f0d-4c91-a9ec-6f902c21553d', accepted: false } 
  });
  console.log("\nPending WorkspaceInvites:");
  invites.forEach(i => console.log(` - ${i.email} | id: ${i.id}`));
}
main().finally(() => prisma.$disconnect());
