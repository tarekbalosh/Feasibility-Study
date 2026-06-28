import { PrismaClient } from '@prisma/client';

type PrismaReport = any; // placeholder type for Report model
import { logger } from '../utils/logger'; // optional logger

// Initialize Prisma client (singleton)
const prisma = new PrismaClient();

// Types for clarity (adjust according to your schema)
export interface ReportCreateInput {
  userId: string;
  projectId: string;
  content: any; // JSON or structured report content
  pdfPath?: string;
}

export class ReportService {
  /** Save a new report after verifying ownership of the project */
  async saveReport(
    userId: string,
    projectId: string,
    reportContent: any,
    pdfPath?: string
  ): Promise<PrismaReport> {
    // Ensure the project belongs to the user – replace with your actual project check
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project || project.userId !== userId) {
      throw new Error('Unauthorized: project does not belong to user');
    }

    const created = await prisma.report.create({
      data: {
        userId,
        projectId,
        content: reportContent,
        pdfPath: pdfPath ?? null,
      },
    });
    logger?.info('Report saved', { reportId: created.id, userId });
    return created;
  }

  /** Get paginated reports for a user, newest first */
  async getUserReports(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ reports: PrismaReport[]; total: number }> {
    const skip = (page - 1) * limit;
    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.report.count({ where: { userId } }),
    ]);
    return { reports, total };
  }

  /** Get a specific report ensuring it belongs to the user */
  async getReportById(reportId: string, userId: string): Promise<PrismaReport | null> {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });
    if (!report || report.userId !== userId) {
      return null; // or throw an error for unauthorized
    }
    return report;
  }

  /** Delete a report and its PDF file if present */
  async deleteReport(reportId: string, userId: string): Promise<void> {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });
    if (!report || report.userId !== userId) {
      throw new Error('Unauthorized or report not found');
    }
    // Remove PDF if it exists on filesystem
    if (report.pdfPath) {
      try {
        await import('fs').then((fs) => fs.promises.unlink(report.pdfPath!));
        logger?.info('Deleted PDF file', { path: report.pdfPath });
      } catch (e) {
        logger?.warn('Failed to delete PDF file', { path: report.pdfPath, error: e });
        // Continue even if file deletion fails
      }
    }
    await prisma.report.delete({ where: { id: reportId } });
    logger?.info('Report deleted', { reportId, userId });
  }
}

export const reportService = new ReportService();
