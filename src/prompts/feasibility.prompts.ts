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

/**
 * بناء البروميبت الاستراتيجي لتوليد الأهداف الذكية (SMART)
 * من تحليل SWOT الكامل.
 * @param projectContext - وصف موجز للمشروع أو الشركة
 * @param strengths     - قائمة نقاط القوة مع معرّفاتها
 * @param weaknesses    - قائمة نقاط الضعف مع معرّفاتها
 * @param opportunities - قائمة الفرص مع معرّفاتها
 * @param threats       - قائمة المخاطر مع معرّفاتها
 */
export const buildSmartGoalsPrompt = (
  projectContext: string,
  strengths:     { id: string; text: string }[],
  weaknesses:    { id: string; text: string }[],
  opportunities: { id: string; text: string }[],
  threats:       { id: string; text: string }[],
): string => {
  const fmt = (items: { id: string; text: string }[]) =>
    items.map((i) => `  - id: "${i.id}", text: "${i.text}"`).join("\n")

  return `أنت خبير استراتيجي متخصص في التخطيط المؤسسي وصياغة الأهداف الذكية (SMART)، وتعمل ضمن أداة تحوّل تحليل SWOT إلى خطة أهداف قابلة للتنفيذ.

سياق المشروع:
${projectContext}

بيانات تحليل SWOT الكاملة:

نقاط القوة (Strengths):
${fmt(strengths)}

نقاط الضعف (Weaknesses):
${fmt(weaknesses)}

الفرص (Opportunities):
${fmt(opportunities)}

المخاطر (Threats):
${fmt(threats)}

القواعد الإرشادية لكل نوع عنصر (طبّقها بدقة):
- نقاط القوة: "لكل نقطة قوة، حافظ عليها أو عزّزها."
- نقاط الضعف: "لكل نقطة ضعف، عالجها أو خفف من أثرها."
- الفرص: "لكل نقطة فرصة، استغلها بالاستفادة منها."
- المخاطر: "لكل نقطة مخاطر، تجنبها أو قلل من أثرها."

منهجية بناء كل هدف:
١. حدد بوضوح "ماذا" سيتم تنفيذه (فعل إجرائي مباشر).
٢. اجعل الهدف قابلاً للقياس (رقم أو نسبة أو مؤشر واضح).
٣. اجعله قابلاً للتحقيق ضمن قدرات الفريق الموصوف في السياق.
٤. اسمح بوجود تحدٍّ حقيقي دون أن يكون مستحيلاً.
٥. حدد إطاراً زمنياً صريحاً لإنجاز كل هدف.

استراتيجيات التقاطع:
- SO (قوة + فرصة): هجومية — استخدام نقاط القوة لاستغلال الفرص.
- WO (ضعف + فرصة): تحسينية — معالجة الضعف عبر الاستفادة من الفرص.
- ST (قوة + خطر): دفاعية — استخدام نقاط القوة لمواجهة المخاطر.
- WT (ضعف + خطر): وقائية — تقليل الضعف وتجنب أثر المخاطر.

المطلوب: لكل عنصر من عناصر SWOT ولّد هدفاً ذكياً (SMART) واحداً فريداً مرتبطاً به مباشرة.
- اربط كل هدف بـ source_id الخاص بالعنصر.
- اكتب الهدف بجملة واحدة تبدأ بفعل إجرائي وتتضمن الرقم/النسبة والإطار الزمني.
- عدد الأهداف يساوي بالضبط: ${strengths.length + weaknesses.length + opportunities.length + threats.length} هدفاً.

أعد الناتج بصيغة JSON فقط دون أي نص إضافي:
{
  "goals": [
    {
      "goal_number": 1,
      "source_type": "قوة",
      "source_id": "معرّف العنصر",
      "source_text": "نص عنصر SWOT المصدر",
      "strategy_type": "SO",
      "goal": "نص الهدف الذكي الكامل بجملة واحدة",
      "metric": "المؤشر القابل للقياس",
      "deadline": "الإطار الزمني المحدد"
    }
  ]
}`;
};

