import { Request, Response } from "express";
import { prisma } from "../config/prisma";

export const getGoalsBySwotAnalysisId = async (req: Request, res: Response) => {
  try {
    const { swotAnalysisId } = req.params;
    const workspaceId = req.workspace?.id;

    if (!workspaceId) {
      return res.status(401).json({ message: "Workspace required." });
    }

    const toolRun = await prisma.toolRun.findFirst({
      where: {
        workspaceId,
        toolSlug: "swot",
        OR: [
          { id: swotAnalysisId },
          { output: { contains: swotAnalysisId } }
        ]
      }
    });

    if (!toolRun) {
      return res.status(200).json({ goals: [] });
    }

    const goals = await prisma.swotCustomGoal.findMany({
      where: { swotAnalysisId: toolRun.id },
      orderBy: { createdAt: 'asc' }
    });

    return res.status(200).json({ goals });
  } catch (error) {
    console.error("Error fetching swot goals:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const createGoal = async (req: Request, res: Response) => {
  try {
    const { swotAnalysisId } = req.params;
    const workspaceId = req.workspace?.id;
    const userId = req.user?.userId;
    const { goalText, linkedStrengths, linkedWeaknesses, linkedOpportunities, linkedThreats } = req.body;

    if (!workspaceId || !userId) {
      return res.status(401).json({ message: "Workspace and User required." });
    }

    if (!goalText || typeof goalText !== "string") {
      return res.status(400).json({ message: "goalText is required and must be a string." });
    }

    let toolRun = await prisma.toolRun.findFirst({
      where: {
        workspaceId,
        toolSlug: "swot",
        OR: [
          { id: swotAnalysisId },
          { output: { contains: swotAnalysisId } }
        ]
      }
    });

    if (!toolRun) {
      toolRun = await prisma.toolRun.create({
        data: {
          workspaceId,
          userId,
          toolSlug: "swot",
          title: "تحليل SWOT",
          input: "{}",
          output: JSON.stringify({ id: swotAnalysisId }),
        }
      });
    }

    const goal = await prisma.swotCustomGoal.create({
      data: {
        swotAnalysisId: toolRun.id,
        goalText,
        linkedStrengths: linkedStrengths || [],
        linkedWeaknesses: linkedWeaknesses || [],
        linkedOpportunities: linkedOpportunities || [],
        linkedThreats: linkedThreats || [],
      }
    });

    return res.status(201).json({ goal });
  } catch (error) {
    console.error("Error creating swot goal:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateGoal = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const workspaceId = req.workspace?.id;
    const { goalText, linkedStrengths, linkedWeaknesses, linkedOpportunities, linkedThreats } = req.body;

    if (!workspaceId) {
      return res.status(401).json({ message: "Workspace required." });
    }

    const goalToUpdate = await prisma.swotCustomGoal.findUnique({
      where: { id },
      include: { toolRun: true }
    });

    if (!goalToUpdate || goalToUpdate.toolRun.workspaceId !== workspaceId) {
       return res.status(404).json({ message: "Goal not found or access denied." });
    }

    const updatedGoal = await prisma.swotCustomGoal.update({
      where: { id },
      data: {
        goalText,
        linkedStrengths: linkedStrengths || [],
        linkedWeaknesses: linkedWeaknesses || [],
        linkedOpportunities: linkedOpportunities || [],
        linkedThreats: linkedThreats || [],
      }
    });

    return res.status(200).json({ goal: updatedGoal });
  } catch (error) {
    console.error("Error updating swot goal:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteGoal = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const workspaceId = req.workspace?.id;

    if (!workspaceId) {
      return res.status(401).json({ message: "Workspace required." });
    }
    
    const goalToDelete = await prisma.swotCustomGoal.findUnique({
      where: { id },
      include: { toolRun: true }
    });

    if (!goalToDelete || goalToDelete.toolRun.workspaceId !== workspaceId) {
       return res.status(404).json({ message: "Goal not found or access denied." });
    }

    await prisma.swotCustomGoal.delete({
      where: { id }
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error deleting swot goal:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
