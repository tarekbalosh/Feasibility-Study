import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/ApiError";

// ——————————————————————————————————————————————
// Get All Reports (Projects with AI output) for a User
// ——————————————————————————————————————————————
export async function getAllReports(userId: string) {
  const projects = await prisma.project.findMany({
    where: {
      userId,
      aiOutput: { not: Prisma.DbNull },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      industry: true,
      location: true,
      currency: true,
      targetCapital: true,
      createdAt: true,
    },
  });

  return projects.map((p) => ({
    reportId: p.id,
    projectName: p.name,
    industry: p.industry,
    location: p.location,
    currency: p.currency,
    targetCapital: p.targetCapital,
    createdAt: p.createdAt,
  }));
}

// ——————————————————————————————————————————————
// Get Report by ID (full project data formatted as report)
// ——————————————————————————————————————————————
export async function getReportById(reportId: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: { id: reportId },
  });

  if (!project) {
    throw ApiError.notFound("التقرير المطلوب غير موجود.");
  }

  if (project.userId !== userId) {
    throw ApiError.accessDenied("ليس لديك صلاحية الوصول لهذا التقرير.");
  }

  return formatAsReport(project);
}

// ——————————————————————————————————————————————
// Generate Report from a Project
// ——————————————————————————————————————————————
export async function generateReport(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw ApiError.notFound("المشروع المطلوب غير موجود.");
  }

  if (project.userId !== userId) {
    throw ApiError.accessDenied("ليس لديك صلاحية الوصول لهذا المشروع.");
  }

  if (!project.aiOutput || !project.financialOutput) {
    throw ApiError.badRequest("لم يتم توليد تحليل لهذا المشروع بعد.");
  }

  return formatAsReport(project);
}

// ——————————————————————————————————————————————
// Download Report Data (JSON — PDF can be added later)
// ——————————————————————————————————————————————
export async function getReportDownload(reportId: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: { id: reportId },
  });

  if (!project) {
    throw ApiError.notFound("التقرير المطلوب غير موجود.");
  }

  if (project.userId !== userId) {
    throw ApiError.accessDenied("ليس لديك صلاحية تحميل هذا التقرير.");
  }

  // Return structured data — PDF generation can be integrated later
  return {
    fileName: `feasibility-report-${project.name.replace(/\s+/g, "-")}.json`,
    contentType: "application/json",
    data: formatAsReport(project),
  };
}

// ——————————————————————————————————————————————
// Helper — Format project as a report
// ——————————————————————————————————————————————
function formatAsReport(project: any) {
  return {
    reportId: project.id,
    generatedAt: new Date().toISOString(),
    project: {
      name: project.name,
      industry: project.industry,
      location: project.location,
      currency: project.currency,
      targetCapital: project.targetCapital,
      durationYears: project.durationYears,
      description: project.description,
    },
    financialInputs: project.financialInputs,
    aiAnalysis: project.aiOutput,
    financialResults: project.financialOutput,
  };
}
