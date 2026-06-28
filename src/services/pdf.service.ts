import path from 'path';
import fs from 'fs/promises';
import { createWriteStream } from 'fs';
import puppeteer from 'puppeteer';
import Handlebars from 'handlebars';
import { logger } from '../utils/logger'; // assume a logger utility exists

// Types – adjust according to your domain models
export interface Project {
  id: string;
  name: string;
  // other project fields you want to display
  [key: string]: any;
}

export interface FeasibilityReport {
  executiveSummary: string;
  financialData: any; // expected to be an object that matches your template
  profitabilityIndicators: any;
  keyFindings: string[];
  recommendations: string[];
  // any other fields you need in the template
  [key: string]: any;
}

export class PDFService {
  private templatePath = path.resolve(__dirname, '../../templates/report.html');

  /**
   * Compile the Handlebars template with the given data and generate a PDF buffer.
   */
  async generateReport(report: FeasibilityReport, project: Project): Promise<Buffer> {
    // Load and compile Handlebars template
    const templateSource = await fs.readFile(this.templatePath, 'utf-8');
    const template = Handlebars.compile(templateSource);
    const html = template({ report, project, generatedAt: new Date().toLocaleDateString('ar-EG') });

    // Launch Puppeteer (headless Chrome) to render HTML to PDF
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'load' });
      // Generate PDF (returns Buffer in newer puppeteer typings, but ensure Buffer type
      const pdfUint8 = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
      });
      const pdfBuffer = Buffer.from(pdfUint8);
      return pdfBuffer;
    } finally {
      await browser.close();
    }
  }

  /**
   * Save a PDF buffer to temporary storage and return the file path.
   * In production you can replace this with an upload to S3/Cloudinary.
   */
  async saveToStorage(buffer: Buffer, reportId: string): Promise<string> {
    const tmpDir = '/tmp';
    const filePath = path.join(tmpDir, `${reportId}.pdf`);
    await fs.writeFile(filePath, buffer);
    logger.info('PDF saved to temporary storage', { path: filePath });
    return filePath;
  }
}
