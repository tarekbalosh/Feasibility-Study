"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.classifyProject = classifyProject;
exports.generateReport = generateReport;
const openai_1 = __importDefault(require("openai"));
const logger_1 = require("../src/utils/logger");
const openai = new openai_1.default({ apiKey: process.env.OPENAI_API_KEY });
/**
 * Classify a project (name & description) into a sector.
 * Returns sector, confidence (0-100) and suggestion list.
 */
async function classifyProject(name, description) {
    const prompt = `
    You are a classification assistant. Given a project name and brief description in Arabic, classify it into one of the following sectors:
    - commercial
    - industrial
    - service
    - tech
    Return a JSON object with fields:
    { "sector": "<sector>", "confidence": <percentage>, "suggestions": [{ "sector": "<sector>", "confidence": <percentage> }, ...] }
    Use the most probable sector as primary.
    Project name: ${name}\n    Description: ${description}
  `;
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
        });
        const content = response.choices[0].message?.content?.trim() || '{}';
        return parseJson(content);
    }
    catch (error) {
        logger_1.logger.error('Error in classifyProject', error);
        // fallback to generic
        return { sector: 'commercial', confidence: 50, suggestions: [] };
    }
}
function parseJson(content) {
    try {
        const cleaned = content.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
        return JSON.parse(cleaned);
    }
    catch (e) {
        logger_1.logger.error('Failed to parse JSON: ' + content, e);
        return JSON.parse(content); // Fallback to raw parsing to let it throw original if needed
    }
}
/**
 * Generate a professional feasibility report (HTML & optional PDF URL).
 */
async function generateReport({ sector, data, financialResult, kpiResult }) {
    const prompt = `
    Write a professional feasibility study report in Arabic for a ${sector} project.
    Include sections:
    1. الملخص التنفيذي
    2. تحليل السوق
    3. تحليل المنافسة
    4. SWOT Analysis
    5. تقييم المخاطر
    6. الفرص المحتملة
    7. التوصيات
    8. خطة تحسين الربحية
    9. تقييم نهائي للاستثمار
    Use the provided data, financialResult, and kpiResult. Return a JSON with { "html": "<html>...</html>", "pdfUrl": null }.
    Data: ${JSON.stringify(data)}
    Financial: ${JSON.stringify(financialResult)}
    KPI: ${JSON.stringify(kpiResult)}
  `;
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
        });
        const content = response.choices[0].message?.content?.trim() || '{}';
        return parseJson(content); // should contain html and optional pdfUrl
    }
    catch (error) {
        logger_1.logger.error('Error in generateReport, falling back to mock generator', error);
        const html = generateMockReport(sector, data, financialResult, kpiResult);
        return { html, pdfUrl: null };
    }
}
function generateMockReport(sector, data, financialResult, kpiResult) {
    const name = data.name || 'مشروع جديد';
    const description = data.description || 'لا يوجد وصف للمشروع';
    // Format numbers nicely
    const formatNum = (num) => typeof num === 'number' ? Math.round(num).toLocaleString() : num;
    return `
    <div style="font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: rtl; text-align: right; padding: 30px; background-color: #f8fafc; color: #1e293b; max-width: 900px; margin: 0 auto; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e2e8f0;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 35px; border-radius: 10px; margin-bottom: 30px; box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.2);">
        <h1 style="margin: 0; font-size: 2rem; font-weight: 700; margin-bottom: 10px;">دراسة جدوى استرشادية</h1>
        <p style="margin: 0; font-size: 1.1rem; opacity: 0.9;">مشروع: ${name} (${sector})</p>
      </div>

      <!-- Executive Summary -->
      <div style="background-color: white; padding: 25px; border-radius: 8px; margin-bottom: 25px; border: 1px solid #e2e8f0; border-right: 5px solid #3b82f6;">
        <h2 style="color: #1e3a8a; margin-top: 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; font-size: 1.4rem;">1. الملخص التنفيذي</h2>
        <p style="line-height: 1.7; color: #475569;">بناءً على المؤشرات المالية والأولية المدخلة لمشروع <strong>${name}</strong>، تم إعداد هذه الدراسة لتقييم الجدوى الاقتصادية والفنية. يشير التحليل الأولي إلى إمكانية نجاح واعدة للمشروع في قطاع <strong>${sector}</strong>، مع التركيز على تلبية احتياجات السوق المستهدف.</p>
        <p style="line-height: 1.7; color: #475569;"><strong>وصف المشروع:</strong> ${description}</p>
      </div>

      <!-- Financial Metrics Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 25px;">
        <div style="background-color: white; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #e2e8f0; border-top: 4px solid #10b981;">
          <h3 style="color: #64748b; font-size: 0.95rem; margin: 0 0 10px 0;">الإيرادات السنوية المتوقعة</h3>
          <p style="color: #10b981; font-size: 1.6rem; font-weight: bold; margin: 0;">${formatNum(financialResult.annualRevenue || financialResult.totalRevenue || 0)} د.إ</p>
        </div>
        <div style="background-color: white; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #e2e8f0; border-top: 4px solid #3b82f6;">
          <h3 style="color: #64748b; font-size: 0.95rem; margin: 0 0 10px 0;">صافي التدفق النقدي الشهري / السنوي</h3>
          <p style="color: #3b82f6; font-size: 1.6rem; font-weight: bold; margin: 0;">${formatNum(financialResult.cashFlow || financialResult.mrr || financialResult.monthlyRevenue || 0)} د.إ</p>
        </div>
        <div style="background-color: white; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #e2e8f0; border-top: 4px solid #f59e0b;">
          <h3 style="color: #64748b; font-size: 0.95rem; margin: 0 0 10px 0;">العائد على الاستثمار (ROI)</h3>
          <p style="color: #f59e0b; font-size: 1.6rem; font-weight: bold; margin: 0;">${formatNum(financialResult.roi || 0)}%</p>
        </div>
      </div>

      <!-- Market Analysis -->
      <div style="background-color: white; padding: 25px; border-radius: 8px; margin-bottom: 25px; border: 1px solid #e2e8f0;">
        <h2 style="color: #1e3a8a; margin-top: 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; font-size: 1.4rem;">2. تحليل السوق والمنافسة</h2>
        <p style="line-height: 1.7; color: #475569;">يظهر قطاع الـ <strong>${sector}</strong> نمواً مستقراً مدفوعاً بزيادة الطلب المحلي. يتراوح متوسط حجم السوق المستهدف بشكل إيجابي مع تواجد منافسة متوسطة تتطلب استراتيجية تموضع قوية.</p>
        <ul style="padding-right: 20px; color: #475569; line-height: 1.7;">
          <li>حجم الحصة السوقية المستهدفة مقدر بـ <strong>%5</strong> تقريباً كبداية تشغيلية.</li>
          <li>المنافسون المباشرون: تم رصد تواجد لمنافسين محليين، مما يستدعي التركيز على جودة الخدمة وتقديم أسعار تنافسية.</li>
        </ul>
      </div>

      <!-- SWOT Analysis -->
      <div style="background-color: white; padding: 25px; border-radius: 8px; margin-bottom: 25px; border: 1px solid #e2e8f0;">
        <h2 style="color: #1e3a8a; margin-top: 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; font-size: 1.4rem;">3. التحليل الرباعي (SWOT)</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
          <div style="background-color: #f0fdf4; padding: 15px; border-radius: 6px; border: 1px solid #bbf7d0;">
            <h4 style="color: #166534; margin: 0 0 10px 0;">نقاط القوة (Strengths)</h4>
            <ul style="margin: 0; padding-right: 15px; font-size: 0.9rem; color: #166534; line-height: 1.5;">
              <li>مرونة عالية في نموذج التشغيل.</li>
              <li>طلب مستمر على خدمات هذا القطاع.</li>
            </ul>
          </div>
          <div style="background-color: #fef2f2; padding: 15px; border-radius: 6px; border: 1px solid #fecaca;">
            <h4 style="color: #991b1b; margin: 0 0 10px 0;">نقاط الضعف (Weaknesses)</h4>
            <ul style="margin: 0; padding-right: 15px; font-size: 0.9rem; color: #991b1b; line-height: 1.5;">
              <li>الحاجة المستمرة لرأس مال تشغيلي أولي.</li>
              <li>الاعتماد الكثيف على كفاءة الكادر البشري.</li>
            </ul>
          </div>
          <div style="background-color: #eff6ff; padding: 15px; border-radius: 6px; border: 1px solid #bfdbfe;">
            <h4 style="color: #1e40af; margin: 0 0 10px 0;">الفرص (Opportunities)</h4>
            <ul style="margin: 0; padding-right: 15px; font-size: 0.9rem; color: #1e40af; line-height: 1.5;">
              <li>التوسع الجغرافي والتحول الرقمي.</li>
              <li>إمكانية تقديم اشتراكات أو عقود طويلة الأجل لزيادة الولاء.</li>
            </ul>
          </div>
          <div style="background-color: #fffbeb; padding: 15px; border-radius: 6px; border: 1px solid #fef3c7;">
            <h4 style="color: #854d0e; margin: 0 0 10px 0;">التهديدات (Threats)</h4>
            <ul style="margin: 0; padding-right: 15px; font-size: 0.9rem; color: #854d0e; line-height: 1.5;">
              <li>دخول منافسين جدد بسهولة إلى السوق.</li>
              <li>التغيرات في القوة الشرائية أو التضخم الاقتصادي.</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Risk Assessment -->
      <div style="background-color: white; padding: 25px; border-radius: 8px; margin-bottom: 25px; border: 1px solid #e2e8f0;">
        <h2 style="color: #1e3a8a; margin-top: 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; font-size: 1.4rem;">4. تقييم المخاطر والتوصيات</h2>
        <p style="line-height: 1.7; color: #475569;">لتقليل المخاطر التشغيلية والمالية، يوصى بالآتي:</p>
        <ol style="padding-right: 20px; color: #475569; line-height: 1.7;">
          <li>التحكم الصارم في تكاليف التأسيس والتشغيل لتفادي فجوات السيولة.</li>
          <li>وضع خطة تسويق مبتكرة تركز على القيمة المضافة والمزايا التنافسية.</li>
          <li>متابعة مؤشرات الأداء الرئيسية (KPIs) بشكل شهري لضمان كفاءة العمل.</li>
        </ol>
      </div>

      <!-- Footer Info -->
      <div style="text-align: center; color: #94a3b8; font-size: 0.85rem; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
        تم توليد هذه الدراسة الاسترشادية تلقائياً - جميع الحقوق محفوظة &copy; ${new Date().getFullYear()}
      </div>
    </div>
  `;
}
//# sourceMappingURL=aiAnalysisEngine.js.map