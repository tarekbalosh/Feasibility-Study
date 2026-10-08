import { prisma } from "./src/config/prisma";
import jwt from "jsonwebtoken";
import { env } from "./src/config/env";
import axios from "axios";

async function run() {
  const member = await prisma.workspaceMember.findFirst({ include: { workspace: true, user: true } });
  if (!member || !member.user) return console.log("No member");
  
  const workspace = member.workspace;
  const user = member.user;
  
  const toolRun = await prisma.toolRun.findFirst({ where: { workspaceId: workspace.id, toolSlug: 'swot' }});
  if (!toolRun) return console.log("No toolrun for this workspace");

  const goal = await prisma.swotCustomGoal.findFirst({ where: { swotAnalysisId: toolRun.id } });
  if (!goal) return console.log("No goal");

  const token = jwt.sign({ userId: user.id, email: user.email }, env.JWT_SECRET, { expiresIn: '1h' });

  const payload = {
    title: "Test Task via Fetch",
    dueDate: "2026-12-31",
    assignee: "Ahmed",
    follower: "Test Company",
    weight: 10,
    cost: 0,
    goalIndex: 7
  };

  try {
    const response = await axios.post(`http://localhost:5000/api/v1/swot-tasks/${goal.id}`, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Workspace': workspace.id
      }
    });
    console.log("Status:", response.status);
    console.log("Response:", JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    console.log("Status:", error.response?.status);
    console.log("Response:", JSON.stringify(error.response?.data, null, 2));
  }
}

run().catch(console.error);
