import { createTask } from "./src/controllers/swotTasksController";
import { prisma } from "./src/config/prisma";

async function test() {
  // Find a workspace and user
  const user = await prisma.user.findFirst();
  if (!user) return;
  const workspace = await prisma.workspace.findFirst({ where: { ownerId: user.id } });
  if (!workspace) return;
  
  // Find a swotCustomGoal
  const goal = await prisma.swotCustomGoal.findFirst();
  if (!goal) {
    console.log("No goal found");
    return;
  }

  const req = {
    params: { goalId: goal.id },
    workspace: { id: workspace.id },
    user: { userId: user.id },
    body: {
      title: "Test Task",
      dueDate: "2026-12-31",
      assignee: "Ahmed",
      follower: "Test Company",
      weight: 10,
      cost: 0,
      goalIndex: 7
    }
  };

  const res = {
    status: (code: number) => ({
      json: (data: any) => console.log(`Status: ${code}`, data)
    })
  };

  await createTask(req as any, res as any);
}

test().catch(console.error).finally(() => process.exit(0));
