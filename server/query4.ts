import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const m = await prisma.workspaceMember.findMany();
  console.log("Members:", m.map(x => ({id: x.id, email: x.email})));
  const i = await prisma.workspaceInvite.findMany();
  console.log("Invites:", i.map(x => ({id: x.id, email: x.email})));
}
main().finally(() => prisma.$disconnect());
