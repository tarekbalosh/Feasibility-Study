export const openAIConfig = {
  model: process.env.OPENAI_MODEL || 'gpt-4o-mini', // fallback to mini
  temperature: 0.3,
  maxTokens: 4000,
  timeout: 60000, // ms (60 seconds)
};
