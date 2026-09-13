import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  // Check the exact IDs that are failing from the screenshot URL
  // /members/fd43dfab-360b-... and /members/487cc8d1-a272-...
  
  // ailm4leaders - active member
  const m1 = await prisma.workspaceMember.findFirst({
    where: { id: 'fd43dfab-360b-4361-a296-9e39dd0ed350' }
  });
  console.log("ailm4leaders member:", m1?.id, m1?.status, m1?.role);
  
  // 09312436739 - invited member
  const m2 = await prisma.workspaceMember.findFirst({
    where: { id: '487cc8d1-a272-4453-a528-f9adf1c4f123' }
  });
  console.log("09312436739 member:", m2?.id, m2?.status, m2?.role);
  
  // actor - tarekba850 owner
  const actor = await prisma.workspaceMember.findFirst({
    where: { email: 'tarekba850@gmail.com', status: 'active' }
  });
  console.log("Actor (tarekba850):", actor?.id, actor?.role, actor?.status);
}
main().finally(() => prisma.$disconnect());
