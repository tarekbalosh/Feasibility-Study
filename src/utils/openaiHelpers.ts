/**
 * Build the prompt for a feasibility study based on the provided project data.
 */
export const buildFeasibilityPrompt = (projectData: Record<string, any>): string => {
  const { name, description, ...rest } = projectData;
  let prompt = `أنت محلل دراسات جدوى. قم بإعداد دراسة جدوى شاملة للمشروع التالي:\n\n`;
  prompt += `اسم المشروع: ${name}\n`;
  if (description) prompt += `وصف المشروع: ${description}\n`;
  // Append any additional fields in a readable way
  for (const [key, value] of Object.entries(rest)) {
    prompt += `${key}: ${JSON.stringify(value, null, 2)}\n`;
  }
  prompt += `\nالنتيجة يجب أن تكون بنية JSON واضحة تحتوي على ملخص، تفاصيل، وتقدير للتكلفة.`;
  return prompt;
};

/**
 * Parse the OpenAI response into a structured report.
 * The function expects the AI to return a JSON string that matches the `FeasibilityReport` shape.
 */
export const parseAIResponse = (response: any): any => {
  try {
    const raw = response.choices?.[0]?.message?.content?.trim();
    if (!raw) throw new Error('Empty response');
    // Try to parse as JSON – the prompt forces JSON output
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (err) {
    // Fallback – return raw text in a generic shape
    return { summary: response.choices?.[0]?.message?.content || '', details: null };
  }
};

/**
 * Rough estimate of token usage based on character count.
 * Approximation: 1 token ≈ 4 characters in English; Arabic characters are similar.
 */
export const estimateTokens = (text: string): number => {
  const chars = text.length;
  return Math.ceil(chars / 4);
};
