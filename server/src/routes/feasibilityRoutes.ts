import { Router, Request, Response } from 'express';
import { getSectorConfig } from '../../engine/sectorEngine';
import { computeRawFinancials } from '../../engine/financialEngine';
import { generateReport, classifyProject } from '../../engine/aiAnalysisEngine';
import { interpretFinancial } from '../../engine/interpretationEngine';
import { validateConsistency, FinancialInsight } from '../../engine/types';
import { prisma } from '../config/prisma';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const { sector, data } = req.body;
    let finalSector = sector;
    let confidence = 100;

    // If sector is "other", classify via AI
    if (sector === 'other') {
      const classification = await classifyProject(data.name, data.description);
      finalSector = classification.sector;
      confidence = classification.confidence;
      if (confidence < 70) {
        return res.status(200).json({ needUserSelection: true, suggestions: classification.suggestions });
      }
    }

    const sectorConfig = getSectorConfig(finalSector);

    // Pure Financial Engine – deterministic calculations
    const rawFinancial = computeRawFinancials(finalSector, data);

    // Interpretation Engine – deterministic risk & break‑even conversion
    const interpretation = interpretFinancial(rawFinancial);

    // Assemble final insight object
    const insight: FinancialInsight = { rawFinancial, ...interpretation };

    // Consistency validation (rule‑based)
    validateConsistency(insight);

    // KPI calculation based on raw financial numbers
    const kpiResult = sectorConfig.computeKPI(insight.rawFinancial);

    // Generate AI‑assisted report (AI only used for narrative, not calculations)
    const report = await generateReport({ sector: finalSector, data, financialResult: insight.rawFinancial, kpiResult });

    // Persist to DB
    await prisma.feasibilityStudy.create({
      data: {
        sector: finalSector,
        rawData: JSON.stringify(data),
        resultData: JSON.stringify({ insight, kpiResult, confidence }),
        reportHtml: report.html,
        reportPdf: report.pdfUrl ?? null,
      },
    });

    res.json({ sector: finalSector, confidence, insight, kpiResult, reportHtml: report.html, reportPdf: report.pdfUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
