import { prisma } from "./src/config/prisma";
import { getOverview } from "./src/services/orgService";
import { loadActor } from "./src/services/accessService";

async function main() {
  try {
    // Find a valid workspace and user
    const member = await prisma.workspaceMember.findFirst({
      where: { status: "active" },
      include: { user: true, workspace: true },
    });
    
    if (!member || !member.userId) {
      console.log("No valid workspace member found to test with");
      process.exit(0);
    }
    
    console.log(`Testing with user ${member.userId} in workspace ${member.workspaceId}`);
    
    const actor = await loadActor(member.workspaceId, member.userId, member.role);
    console.log("Actor loaded:", actor);
    
    const result = await getOverview(actor);
    console.log("Success! Data keys:", Object.keys(result));
    
  } catch (error) {
    console.error("Error occurred:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
