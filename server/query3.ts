import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const m = await prisma.workspaceMember.findFirst({ where: { id: "487cc8d1-a272-4d92-9a00-50d440db7f90" } });
  console.log("Member:", m);
  const i = await prisma.workspaceInvite.findFirst({ where: { id: "487cc8d1-a272-4d92-9a00-50d440db7f90" } });
  console.log("Invite:", i);
}
main().finally(() => prisma.$disconnect());
