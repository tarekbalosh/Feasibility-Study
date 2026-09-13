import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const m = await prisma.workspaceMember.findFirst({ where: { email: { contains: "ailm4leaders" } } });
  console.log("Member:", m);
  const i = await prisma.workspaceInvite.findFirst({ where: { email: { contains: "ailm4leaders" } } });
  console.log("Invite:", i);
}
main().finally(() => prisma.$disconnect());
