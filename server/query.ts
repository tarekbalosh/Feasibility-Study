import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const depts = await prisma.department.findMany({ include: { members: true, plans: { include: { members: true, tasks: true } } } })
  console.log(JSON.stringify(depts, null, 2))
}
main()
