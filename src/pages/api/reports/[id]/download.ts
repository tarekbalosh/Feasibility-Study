import type { NextApiRequest, NextApiResponse } from 'next';
import { PDFService } from '../../../../services/pdf.service';

// Placeholder functions – replace with real DB queries
const getReportById = async (id: string) => {
  // TODO: fetch FeasibilityReport from your database
  // For now return a mock object matching the expected shape
  return {
    executiveSummary: 'ملخص تنفيذي تجريبي.',
    financialData: {
      headers: ['البند', 'القيمة'],
      rows: [
        ['الإيرادات المتوقعة', '100,000'],
        ['التكاليف المتوقعة', '70,000'],
      ],
    },
    profitabilityIndicators: ['ROI: 30%', 'نسبة الربح صافي: 15%'],
    keyFindings: ['نقطة 1', 'نقطة 2', 'نقطة 3', 'نقطة 4', 'نقطة 5'],
    recommendations: ['توصية 1', 'توصية 2', 'توصية 3'],
  };
};

const getProjectById = async (id: string) => {
  // TODO: fetch Project from your database
  return { id, name: 'مشروع تجريبي' };
};

/**
 * GET /api/reports/:id/download
 * Generates (or fetches) a PDF feasibility report and streams it to the client.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end('Method Not Allowed');
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'معرف التقرير غير صالح' });
  }

  try {
    // 1️⃣ Retrieve report and project data
    const report = await getReportById(id);
    const project = await getProjectById(id);
    if (!report || !project) {
      return res.status(404).json({ message: 'التقرير غير موجود' });
    }

    const pdfService = new PDFService();
    const pdfBuffer = await pdfService.generateReport(report, project);

    // 2️⃣ Optionally store temporarily (here we just keep the buffer)
    // const filePath = await pdfService.saveToStorage(pdfBuffer, id);

    // 3️⃣ Send PDF response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="feasibility-report.pdf"');
    res.status(200).send(pdfBuffer);
  } catch (err: any) {
    console.error('Error generating PDF report:', err);
    res.status(500).json({ message: 'حدث خطأ أثناء إنشاء التقرير' });
  }
}
