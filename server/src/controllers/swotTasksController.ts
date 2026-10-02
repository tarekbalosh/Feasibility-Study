import { Request, Response } from "express";
import { prisma } from "../config/prisma";

// ——————————————————————————————————————————————
// Helpers
// ——————————————————————————————————————————————

/** مجموع الأوزان الحالية لمهام هدف معيّن */
const getCurrentWeightSum = async (goalId: string, excludeTaskId?: string): Promise<number> => {
  const tasks = await prisma.swotTask.findMany({
    where: {
      goalId,
      ...(excludeTaskId ? { id: { not: excludeTaskId } } : {}),
    },
    select: { weight: true },
  });
  return tasks.reduce((sum, t) => sum + t.weight, 0);
};

/** أكبر رقم مهمة حالي لهدف معيّن */
const getNextTaskIndex = async (goalId: string): Promise<number> => {
  const last = await prisma.swotTask.findFirst({
    where: { goalId },
    orderBy: { taskIndex: "desc" },
    select: { taskIndex: true },
  });
  return (last?.taskIndex ?? 0) + 1;
};

/** التحقق من أن الهدف ينتمي لمساحة العمل */
const verifyGoalOwnership = async (goalId: string, workspaceId: string) => {
  const goal = await prisma.swotCustomGoal.findUnique({
    where: { id: goalId },
    include: { toolRun: { select: { workspaceId: true } } },
  });
  if (!goal || goal.toolRun.workspaceId !== workspaceId) return null;
  return goal;
};

/** التحقق من أن المهمة تنتمي لمساحة العمل */
const verifyTaskOwnership = async (taskId: string, workspaceId: string) => {
  const task = await prisma.swotTask.findUnique({
    where: { id: taskId },
    include: { goal: { include: { toolRun: { select: { workspaceId: true } } } } },
  });
  if (!task || task.goal.toolRun.workspaceId !== workspaceId) return null;
  return task;
};

// ——————————————————————————————————————————————
// Controllers
// ——————————————————————————————————————————————

/** جلب مهام هدف بعينه */
export const getTasksByGoalId = async (req: Request, res: Response) => {
  try {
    const { goalId } = req.params;
    const workspaceId = req.workspace?.id;
    if (!workspaceId) return res.status(401).json({ message: "Workspace required." });

    const goal = await verifyGoalOwnership(goalId, workspaceId);
    if (!goal) return res.status(200).json({ tasks: [] });

    const tasks = await prisma.swotTask.findMany({
      where: { goalId },
      orderBy: { taskIndex: "asc" },
    });

    return res.status(200).json({ tasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/** جلب كل المهام لتحليل SWOT (عبر toolRun id) */
export const getTasksByAnalysisId = async (req: Request, res: Response) => {
  try {
    const { analysisId } = req.params;
    const workspaceId = req.workspace?.id;
    if (!workspaceId) return res.status(401).json({ message: "Workspace required." });

    const toolRun = await prisma.toolRun.findFirst({
      where: {
        workspaceId,
        toolSlug: "swot",
        OR: [{ id: analysisId }, { output: { contains: analysisId } }],
      },
    });
    if (!toolRun) return res.status(200).json({ tasks: [], goals: [] });

    const goals = await prisma.swotCustomGoal.findMany({
      where: { swotAnalysisId: toolRun.id },
      include: {
        tasks: { orderBy: { taskIndex: "asc" } },
      },
      orderBy: { createdAt: "asc" },
    });

    // تسطيح المهام في مصفوفة واحدة مع الحفاظ على معرّف الهدف
    const allTasks = goals.flatMap((g) => g.tasks);

    return res.status(200).json({ tasks: allTasks, goals });
  } catch (error) {
    console.error("Error fetching tasks by analysis:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/** إنشاء مهمة جديدة */
export const createTask = async (req: Request, res: Response) => {
  try {
    const { goalId } = req.params;
    const workspaceId = req.workspace?.id;
    const userId = req.user?.userId;
    if (!workspaceId || !userId)
      return res.status(401).json({ message: "Workspace and User required." });

    const goal = await verifyGoalOwnership(goalId, workspaceId);
    if (!goal) return res.status(404).json({ message: "الهدف غير موجود أو لا تملك صلاحية الوصول." });

    const { title, dueDate, assignee, follower, weight, cost, currency, priority, goalIndex, budgetDistribution } = req.body;

    // التحقق: المسؤول والمتابع لا يجوز أن يكونا نفس الشخص
    if (assignee === follower) {
      return res.status(400).json({
        message: "لا يمكن أن يكون المسؤول عن التنفيذ والمعني بالمتابعة نفس الشخص.",
      });
    }

    // التحقق: مجموع الأوزان لا يتجاوز 100
    const currentWeight = await getCurrentWeightSum(goalId);
    const newWeight = parseInt(weight, 10);
    if (currentWeight + newWeight > 100) {
      return res.status(400).json({
        message: `مجموع الأوزان سيتجاوز 100%. المتبقي: ${100 - currentWeight}%.`,
      });
    }

    const taskIndex = await getNextTaskIndex(goalId);

    const task = await prisma.swotTask.create({
      data: {
        goalId,
        goalIndex: parseInt(goalIndex, 10) || 1,
        taskIndex,
        title,
        dueDate: new Date(dueDate),
        assignee,
        follower,
        weight: newWeight,
        cost: parseFloat(cost) || 0,
        currency: currency || "SAR",
        priority: priority || "normal",
        status: "not_started",
        progress: 0,
        budgetDistribution,
        createdBy: userId,
      },
    });

    return res.status(201).json({ task });
  } catch (error) {
    console.error("Error creating task:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/** تعديل مهمة */
export const updateTask = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const workspaceId = req.workspace?.id;
    if (!workspaceId) return res.status(401).json({ message: "Workspace required." });

    const task = await verifyTaskOwnership(taskId, workspaceId);
    if (!task) return res.status(404).json({ message: "المهمة غير موجودة أو لا تملك صلاحية الوصول." });

    const { title, dueDate, assignee, follower, weight, cost, currency, priority, status, progress, budgetDistribution } = req.body;

    // التحقق: المسؤول والمتابع
    if (assignee && follower && assignee === follower) {
      return res.status(400).json({
        message: "لا يمكن أن يكون المسؤول عن التنفيذ والمعني بالمتابعة نفس الشخص.",
      });
    }

    // التحقق: مجموع الأوزان
    if (weight !== undefined) {
      const currentWeight = await getCurrentWeightSum(task.goalId, taskId);
      const newWeight = parseInt(weight, 10);
      if (currentWeight + newWeight > 100) {
        return res.status(400).json({
          message: `مجموع الأوزان سيتجاوز 100%. المتبقي: ${100 - currentWeight}%.`,
        });
      }
    }

    // منطق الحالة/التقدم المترابط
    let finalStatus = status ?? task.status;
    let finalProgress = progress !== undefined ? parseInt(progress, 10) : task.progress;

    // عند اختيار "أُنجزت" → 100%
    if (finalStatus === "completed") {
      finalProgress = 100;
    }
    // عند وصول النسبة لـ 100% → "أُنجزت"
    if (finalProgress === 100) {
      finalStatus = "completed";
    }

    // التحقق من التأخر التلقائي
    if (
      finalStatus !== "completed" &&
      dueDate &&
      new Date(dueDate) < new Date() &&
      finalStatus !== "overdue"
    ) {
      finalStatus = "overdue";
    }

    const updatedTask = await prisma.swotTask.update({
      where: { id: taskId },
      data: {
        ...(title !== undefined && { title }),
        ...(dueDate !== undefined && { dueDate: new Date(dueDate) }),
        ...(assignee !== undefined && { assignee }),
        ...(follower !== undefined && { follower }),
        ...(weight !== undefined && { weight: parseInt(weight, 10) }),
        ...(cost !== undefined && { cost: parseFloat(cost) }),
        ...(currency !== undefined && { currency }),
        ...(priority !== undefined && { priority }),
        ...(budgetDistribution !== undefined && { budgetDistribution }),
        status: finalStatus,
        progress: finalProgress,
      },
    });

    return res.status(200).json({ task: updatedTask });
  } catch (error) {
    console.error("Error updating task:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/** تحديث الحالة والتقدم فقط (للمسؤول عن المهمة) */
export const updateTaskStatus = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const workspaceId = req.workspace?.id;
    if (!workspaceId) return res.status(401).json({ message: "Workspace required." });

    const task = await verifyTaskOwnership(taskId, workspaceId);
    if (!task) return res.status(404).json({ message: "المهمة غير موجودة." });

    const { status, progress } = req.body;

    let finalStatus = status ?? task.status;
    let finalProgress = progress !== undefined ? parseInt(progress, 10) : task.progress;

    if (finalStatus === "completed") finalProgress = 100;
    if (finalProgress === 100) finalStatus = "completed";

    // تأخر تلقائي
    if (finalStatus !== "completed" && task.dueDate < new Date() && finalStatus !== "overdue") {
      finalStatus = "overdue";
    }

    const updatedTask = await prisma.swotTask.update({
      where: { id: taskId },
      data: { status: finalStatus, progress: finalProgress },
    });

    return res.status(200).json({ task: updatedTask });
  } catch (error) {
    console.error("Error updating task status:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/** حذف مهمة */
export const deleteTask = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const workspaceId = req.workspace?.id;
    if (!workspaceId) return res.status(401).json({ message: "Workspace required." });

    const task = await verifyTaskOwnership(taskId, workspaceId);
    if (!task) return res.status(404).json({ message: "المهمة غير موجودة." });

    await prisma.swotTask.delete({ where: { id: taskId } });

    // إعادة ترقيم المهام المتبقية
    const remaining = await prisma.swotTask.findMany({
      where: { goalId: task.goalId },
      orderBy: { taskIndex: "asc" },
    });

    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i].taskIndex !== i + 1) {
        await prisma.swotTask.update({
          where: { id: remaining[i].id },
          data: { taskIndex: i + 1 },
        });
      }
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error deleting task:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/** تكرار مهمة */
export const duplicateTask = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const workspaceId = req.workspace?.id;
    const userId = req.user?.userId;
    if (!workspaceId || !userId) return res.status(401).json({ message: "Workspace and User required." });

    const task = await verifyTaskOwnership(taskId, workspaceId);
    if (!task) return res.status(404).json({ message: "المهمة غير موجودة." });

    // التحقق من مجموع الأوزان
    const currentWeight = await getCurrentWeightSum(task.goalId);
    if (currentWeight + task.weight > 100) {
      return res.status(400).json({
        message: `لا يمكن تكرار المهمة: مجموع الأوزان سيتجاوز 100%. المتبقي: ${100 - currentWeight}%.`,
      });
    }

    const taskIndex = await getNextTaskIndex(task.goalId);

    const duplicate = await prisma.swotTask.create({
      data: {
        goalId: task.goalId,
        goalIndex: task.goalIndex,
        taskIndex,
        title: task.title + " (نسخة)",
        dueDate: task.dueDate,
        assignee: task.assignee,
        follower: task.follower,
        weight: task.weight,
        cost: task.cost,
        currency: task.currency,
        priority: task.priority,
        status: "not_started",
        progress: 0,
        createdBy: userId,
      },
    });

    return res.status(201).json({ task: duplicate });
  } catch (error) {
    console.error("Error duplicating task:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
