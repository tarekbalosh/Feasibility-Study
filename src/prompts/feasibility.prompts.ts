export const SYSTEM_PROMPT = `
أنت خبير اقتصادي ومستشار أعمال متخصص في تحليل الجدوى الاقتصادية للمشاريع الصغيرة والمتوسطة في منطقة الخليج العربي.
مهمتك: تحليل البيانات المالية المقدّمة وإنتاج تقرير جدوى اقتصادية احترافي ومفصّل.
— قواعد الإخراج: JSON فقط · لا مقدّمات نصية · الأرقام كـ numbers لا strings
`;

/**
 * Build the analysis prompt for a given project.
 * The prompt instructs the model to output a structured JSON object with the required sections.
 */
export const buildAnalysisPrompt = (data: Record<string, any>): string => {
  const jsonData = JSON.stringify(data, null, 2);
  return `
${SYSTEM_PROMPT}

البيانات المقدّمة للمشروع هي:
${jsonData}

الرجاء تحليل البيانات المالية وإنتاج JSON يحتوي على الحقول التالية:

financial_analysis: {
  roi: number,
  payback_period: number,
  break_even_monthly: number,
  profit_margin: number
},
cost_analysis: {
  fixed_costs: number,
  variable_costs: number,
  recommendations: string
},
revenue_analysis: {
  monthly_revenue: number,
  annual_revenue: number,
  growth_potential: string
},
risk_assessment: [
  { risk: string, level: string, mitigation: string }
]

الرجاء إرجاع JSON فقط دون أي نص تمهيدي أو ختامي.
`;
};

/**
 * Build the final report prompt based on the analysis result.
 * The model should return a JSON object with a textual report in Arabic.
 */
export const buildReportPrompt = (analysis: Record<string, any>): string => {
  const analysisJson = JSON.stringify(analysis, null, 2);
  return `
${SYSTEM_PROMPT}

نتيجة التحليل التي تم الحصول عليها هي:
${analysisJson}

الرجاء توليد تقرير نصي كامل باللغة العربية وإرجاعه كـ JSON يحتوي على الحقول التالية:

executive_summary: string (فقرة واحدة احترافية),
key_findings: string[] (5 نقاط رئيسية),
recommendations: string[] (3-5 توصيات عملية),
conclusion: string

الرجاء إرجاع JSON فقط، ولا تضف أي مقدّمة أو خاتمة غير مطلوبة.
`;
};
