import crypto from "crypto";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/ApiError";
import { generateFeasibilityAnalysis } from "./openaiService";

// ——————————————————————————————————————————————
// Get All Projects for a User
// ——————————————————————————————————————————————
export async function getAllProjects(userId: string) {
  const projects = await prisma.project.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      industry: true,
      location: true,
      currency: true,
      targetCapital: true,
      isShared: true,
      createdAt: true,
      updatedAt: true,
      aiOutput: true,
    },
  });

  return projects.map((p) => {
    let status = 'غير محدد';
    if (p.aiOutput) {
      try {
        const parsed = typeof p.aiOutput === 'string' ? JSON.parse(p.aiOutput) : p.aiOutput;
        status = (parsed as any).status || 'غير محدد';
      } catch (e) {}
    }
    return {
      ...p,
      aiOutput: undefined, // remove full aiOutput to save payload size
      status,
    };
  });
}

// ——————————————————————————————————————————————
// Get Project by ID
// ——————————————————————————————————————————————
export async function getProjectById(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw ApiError.notFound("دراسة الجدوى المطلوبة غير موجودة.");
  }

  if (project.userId !== userId) {
    throw ApiError.accessDenied("ليس لديك صلاحية الوصول لهذه الدراسة.");
  }

  return parseProjectJSON(project);
}

// ——————————————————————————————————————————————
// Create Project
// ——————————————————————————————————————————————
export async function createProject(
  userId: string,
  data: {
    name: string;
    industry: string;
    location: string;
    currency?: string;
    targetCapital: number;
    durationYears?: number;
    description: string;
    financialInputs: Record<string, any>;
  }
) {
  // Check user generation limits
  const userLimit = await prisma.userLimit.findUnique({
    where: { userId },
  });

  if (userLimit) {
    // Reset counter if past reset date
    if (new Date() > userLimit.resetAt) {
      await prisma.userLimit.update({
        where: { userId },
        data: {
          generationsUsed: 0,
          resetAt: getNextMonthDate(),
        },
      });
    } else if (userLimit.generationsUsed >= userLimit.generationsLimit) {
      throw ApiError.insufficientLimits();
    }
  }

  // Generate AI analysis
  const aiOutput = await generateFeasibilityAnalysis({
    name: data.name,
    industry: data.industry,
    location: data.location,
    description: data.description,
    targetCapital: data.targetCapital,
    financialInputs: data.financialInputs,
  });

  // Calculate financial output
  const financialOutput = calculateFinancials(
    data.financialInputs,
    data.targetCapital,
    data.durationYears || 3
  );

  // Create project and increment usage in a transaction
  const project = await prisma.$transaction(async (tx) => {
    const newProject = await tx.project.create({
      data: {
        userId,
        name: data.name,
        industry: data.industry,
        location: data.location,
        currency: data.currency || "USD",
        targetCapital: data.targetCapital,
        durationYears: data.durationYears || 3,
        description: data.description,
        financialInputs: JSON.stringify(data.financialInputs),
        aiOutput: JSON.stringify(aiOutput),
        financialOutput: JSON.stringify(financialOutput),
      },
    });

    // Increment generations used
    await tx.userLimit.upsert({
      where: { userId },
      update: { generationsUsed: { increment: 1 } },
      create: {
        userId,
        generationsUsed: 1,
        generationsLimit: 10,
        resetAt: getNextMonthDate(),
      },
    });

    return newProject;
  });

  return parseProjectJSON(project);
}

// ——————————————————————————————————————————————
// Update Project
// ——————————————————————————————————————————————
export async function updateProject(
  projectId: string,
  userId: string,
  data: Partial<{
    name: string;
    industry: string;
    location: string;
    currency: string;
    targetCapital: number;
    durationYears: number;
    description: string;
    financialInputs: Record<string, any>;
  }>
) {
  // Verify ownership
  const existing = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!existing) {
    throw ApiError.notFound("دراسة الجدوى المطلوبة غير موجودة.");
  }

  if (existing.userId !== userId) {
    throw ApiError.accessDenied("ليس لديك صلاحية تعديل هذه الدراسة.");
  }

  const updateData: any = { ...data };
  if (updateData.financialInputs) {
    updateData.financialInputs = JSON.stringify(updateData.financialInputs);
  }

  const updated = await prisma.project.update({
    where: { id: projectId },
    data: updateData,
  });

  return parseProjectJSON(updated);
}

// ——————————————————————————————————————————————
// Delete Project
// ——————————————————————————————————————————————
export async function deleteProject(projectId: string, userId: string) {
  const existing = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!existing) {
    throw ApiError.notFound("دراسة الجدوى المطلوبة غير موجودة.");
  }

  if (existing.userId !== userId) {
    throw ApiError.accessDenied("ليس لديك صلاحية حذف هذه الدراسة.");
  }

  await prisma.project.delete({ where: { id: projectId } });

  return { message: "تم حذف دراسة الجدوى بنجاح." };
}

// ——————————————————————————————————————————————
// Share Project (toggle)
// ——————————————————————————————————————————————
export async function toggleShareProject(
  projectId: string,
  userId: string,
  isShared: boolean
) {
  const existing = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!existing) {
    throw ApiError.notFound("دراسة الجدوى المطلوبة غير موجودة.");
  }

  if (existing.userId !== userId) {
    throw ApiError.accessDenied();
  }

  const shareToken = isShared
    ? `sha_${crypto.randomBytes(16).toString("hex")}`
    : null;

  const updated = await prisma.project.update({
    where: { id: projectId },
    data: { isShared, shareToken },
  });

  return {
    projectId: updated.id,
    isShared: updated.isShared,
    shareToken: updated.shareToken,
  };
}

// ——————————————————————————————————————————————
// Helpers
// ——————————————————————————————————————————————
function getNextMonthDate(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1);
}

function calculateFinancials(
  inputs: Record<string, any>,
  targetCapital: number,
  durationYears: number
) {
  const rent = Number(inputs.rent) || 0;
  const salaries = Number(inputs.salaries) || 0;
  const marketing = Number(inputs.marketing) || 0;
  const supplies = Number(inputs.supplies) || 0;
  const averageOrderValue = Number(inputs.averageOrderValue) || 0;
  const estimatedOrdersPerMonth = Number(inputs.estimatedOrdersPerMonth) || 0;

  const monthlyFixedCosts = rent + salaries + marketing + supplies;
  const monthlyExpectedRevenue = averageOrderValue * estimatedOrdersPerMonth;
  const monthlyNetProfit = monthlyExpectedRevenue - monthlyFixedCosts;

  const breakEvenPointMonthly =
    monthlyNetProfit > 0
      ? Math.ceil(monthlyFixedCosts / (averageOrderValue - supplies / estimatedOrdersPerMonth || 1))
      : 0;

  const paybackPeriodMonths =
    monthlyNetProfit > 0 ? Math.ceil(targetCapital / monthlyNetProfit) : 0;

  // Simple IRR approximation
  const annualNetProfit = monthlyNetProfit * 12;
  const irr =
    targetCapital > 0
      ? parseFloat(((annualNetProfit / targetCapital) * 100).toFixed(1))
      : 0;

  // Simple NPV (discount rate 10%)
  const discountRate = 0.1;
  let npv = -targetCapital;
  for (let year = 1; year <= durationYears; year++) {
    npv += annualNetProfit / Math.pow(1 + discountRate, year);
  }
  npv = parseFloat(npv.toFixed(0));

  return {
    monthlyFixedCosts,
    monthlyExpectedRevenue,
    monthlyNetProfit,
    breakEvenPointMonthly,
    paybackPeriodMonths,
    irr,
    npv,
  };
}

function parseProjectJSON(project: any) {
  if (!project) return project;
  const parsed = { ...project };
  if (typeof parsed.financialInputs === 'string') {
    try { parsed.financialInputs = JSON.parse(parsed.financialInputs); } catch(e) {}
  }
  if (typeof parsed.aiOutput === 'string') {
    try { parsed.aiOutput = JSON.parse(parsed.aiOutput); } catch(e) {}
  }
  if (typeof parsed.financialOutput === 'string') {
    try { parsed.financialOutput = JSON.parse(parsed.financialOutput); } catch(e) {}
  }
  return parsed;
}
