import { buildAnalysisPrompt, buildReportPrompt, SYSTEM_PROMPT } from './feasibility.prompts';

/** Helper to mimic model JSON response parsing */
const parseJSON = (text: string) => {
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error('Invalid JSON response');
  }
};

describe('Feasibility prompts', () => {
  test('buildAnalysisPrompt contains system prompt and is a string', () => {
    const data = {
      name: 'مشروع تجاري',
      description: 'مقهى صغير',
      revenue: 120000,
      costs: 80000,
    } as any;
    const prompt = buildAnalysisPrompt(data);
    expect(typeof prompt).toBe('string');
    expect(prompt).toContain(SYSTEM_PROMPT.trim());
    // Ensure the prompt ends with instruction for JSON only
    expect(prompt).toMatch(/JSON فقط/);
  });

  test('buildReportPrompt contains system prompt and is a string', () => {
    const analysis = {
      financial_analysis: { roi: 12.5, payback_period: 3, break_even_monthly: 4000, profit_margin: 0.25 },
      cost_analysis: { fixed_costs: 20000, variable_costs: 30000, recommendations: 'خفض التكاليف' },
      revenue_analysis: { monthly_revenue: 10000, annual_revenue: 120000, growth_potential: 'متوسط' },
      risk_assessment: [{ risk: 'سوق', level: 'متوسط', mitigation: 'تنويع المنتجات' }],
    } as any;
    const prompt = buildReportPrompt(analysis);
    expect(typeof prompt).toBe('string');
    expect(prompt).toContain(SYSTEM_PROMPT.trim());
    expect(prompt).toMatch(/executive_summary/);
  });

  test('parse valid JSON response succeeds', () => {
    const json = JSON.stringify({ success: true, data: [] });
    const result = parseJSON(json);
    expect(result).toHaveProperty('success', true);
  });

  test('parse invalid JSON response throws error', () => {
    const badJson = '{ not a valid json';
    expect(() => parseJSON(badJson)).toThrow('Invalid JSON response');
  });
});
