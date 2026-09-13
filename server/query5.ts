import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const m = await prisma.workspaceMember.findUnique({ where: { id: "487cc8d1-a272-4453-a528-f9adf1c4f123" } });
  console.log("Member:", m);
}
main().finally(() => prisma.$disconnect());
