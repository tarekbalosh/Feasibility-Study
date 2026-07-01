import OpenAI from 'openai';
import { openAIConfig } from '../config/openai.config';
import { buildFeasibilityPrompt, parseAIResponse, estimateTokens } from '../utils/openaiHelpers';
import { logger } from '../utils/logger'; // assume a logger utility exists

// Types – adjust to your domain model
export interface ProjectData {
  name: string;
  description?: string;
  // add other fields used for feasibility study
  [key: string]: any;
}

export interface FeasibilityReport {
  // structure of the report you expect
  summary: string;
  details: any;
  tokensUsed: number;
}

export interface AnalysisData {
  // whatever analysis data you need for executive summary
  [key: string]: any;
}

export interface FinancialData {
  // financial numbers used for recommendation generation
  [key: string]: any;
}

export class OpenAIService {
  private client: any;
  private readonly maxRetries = 3;

  constructor() {
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: openAIConfig.timeout });
  }

  /** Generic method to call the OpenAI chat completion endpoint with retry */
  private async callAPI(messages: any[], attempt = 1): Promise<any> {
    try {
      const response = await this.client.chat.completions.create({
        model: openAIConfig.model,
        temperature: openAIConfig.temperature,
        max_tokens: openAIConfig.maxTokens,
        messages,
      });

      // Log token usage
      const tokens = response.usage?.total_tokens ?? 0;
      logger.info('OpenAI request', { model: openAIConfig.model, tokens, attempt });

      return response;
    } catch (err: any) {
      // Handle specific OpenAI errors
      if (err.name === 'RateLimitError' && attempt < this.maxRetries) {
        const backoff = 200 * Math.pow(2, attempt - 1);
        await new Promise((res) => setTimeout(res, backoff));
        return this.callAPI(messages, attempt + 1);
      }
      if (err.name === 'TimeoutError') {
        logger.warn('OpenAI request timed out', { attempt });
        if (attempt < this.maxRetries) {
          const backoff = 200 * Math.pow(2, attempt - 1);
          await new Promise((res) => setTimeout(res, backoff));
          return this.callAPI(messages, attempt + 1);
        }
      }
      // Propagate other errors
      logger.error('OpenAI request failed', { error: err, attempt });
      throw err;
    }
  }

  /** Generate feasibility study report */
  async generateFeasibilityStudy(data: ProjectData): Promise<FeasibilityReport> {
    const prompt = buildFeasibilityPrompt(data);
    const messages = [{ role: 'system', content: 'You are a professional business analyst.' }, { role: 'user', content: prompt }];
    try {
      const apiResp = await this.callAPI(messages);
      const parsed = parseAIResponse(apiResp);
      const tokens = apiResp.usage?.total_tokens ?? 0;
      return { ...parsed, tokensUsed: tokens } as FeasibilityReport;
    } catch (error) {
      // Fallback response
      logger.error('Feasibility study generation failed', { error });
      return { summary: 'فشل إنشاء التقرير بسبب مشكلة تقنية.', details: null, tokensUsed: 0 } as FeasibilityReport;
    }
  }

  /** Generate executive summary */
  async generateExecutiveSummary(analysis: AnalysisData): Promise<string> {
    const prompt = `اكتب ملخص تنفيذي بناءً على التحليل التالي:\n${JSON.stringify(analysis, null, 2)}`;
    const messages = [{ role: 'system', content: 'You are an executive summary writer.' }, { role: 'user', content: prompt }];
    try {
      const apiResp = await this.callAPI(messages);
      const text = apiResp.choices?.[0]?.message?.content?.trim() ?? '';
      return text;
    } catch (error) {
      logger.error('Executive summary generation failed', { error });
      return 'ملخص تنفيذي غير متاح في الوقت الحالي.';
    }
  }

  /** Generate recommendation list */
  async generateRecommendations(financial: FinancialData): Promise<string[]> {
    const prompt = `استنادًا إلى البيانات المالية التالية، قدم خمس توصيات استراتيجية واضحة:\n${JSON.stringify(financial, null, 2)}`;
    const messages = [{ role: 'system', content: 'You are a business consultant.' }, { role: 'user', content: prompt }];
    try {
      const apiResp = await this.callAPI(messages);
      const text = apiResp.choices?.[0]?.message?.content ?? '';
      // Assume each recommendation is on a new line or numbered
      const lines = text.split(/\r?\n/).filter((l: string) => l.trim().length > 0);
      return lines;
    } catch (error) {
      logger.error('Recommendations generation failed', { error });
      return [];
    }
  }
}
