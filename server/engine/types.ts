import { z } from 'zod';

/* ---- Raw Financial Result (source of truth) ---- */
export const rawFinancialResultSchema = z.object({
  revenue: z.number(),
  expenses: z.number(),
  profit: z.number(),
  roi: z.number(),
  cashFlow: z.array(z.number()),
  paybackPeriod: z.number(), // months
  breakEvenMonths: z.number(), // raw numeric estimate (may be huge)
});
export type RawFinancialResult = z.infer<typeof rawFinancialResultSchema>;

/* ---- Simplified BreakEven ---- */
export const breakEvenSchema = z.object({
  months: z.number().nullable(),
  status: z.enum(['exact', 'range', 'not_achievable']),
  note: z.string().optional(),
});
export type BreakEven = z.infer<typeof breakEvenSchema>;

/* ---- Final API payload (FinancialInsight) ---- */
export const financialInsightSchema = z.object({
  rawFinancial: rawFinancialResultSchema,
  // interpretation fields merged directly
  profitMargin: z.number(),
  paybackPeriod: z.number(),
  risk: z.enum(['Strong', 'Moderate', 'High Risk', 'Unrealistic']),
  breakEven: breakEvenSchema,
});
export type FinancialInsight = z.infer<typeof financialInsightSchema>;

/* ---- Consistency validation layer ---- */
/**
 * Ensures that the interpretation fields inside FinancialInsight are
 * mathematically consistent with the raw financial numbers.
 * Throws a ZodError if any check fails.
 */
export function validateConsistency(insight: FinancialInsight): FinancialInsight {
  const { rawFinancial, profitMargin, paybackPeriod, breakEven } = insight;

  // Profit margin must equal profit / revenue (allow tiny floating errors)
  const expectedMargin = rawFinancial.revenue !== 0 ? rawFinancial.profit / rawFinancial.revenue : 0;
  if (Math.abs(expectedMargin - profitMargin) > 1e-6) {
    throw new Error('Profit margin mismatch with raw financial data');
  }

  // Payback period must equal expenses / profit when profit > 0, else 0
  const expectedPayback = rawFinancial.profit > 0 ? rawFinancial.expenses / rawFinancial.profit : 0;
  if (Math.abs(expectedPayback - paybackPeriod) > 1e-6) {
    throw new Error('Payback period mismatch with raw financial data');
  }

  // BreakEven consistency: months should reflect raw breakEvenMonths (or null if not achievable)
  if (breakEven.status === 'exact') {
    if (breakEven.months === null || breakEven.months !== rawFinancial.breakEvenMonths) {
      throw new Error('BreakEven exact months do not match raw calculation');
    }
  } else if (breakEven.status === 'not_achievable') {
    if (breakEven.months !== null) {
      throw new Error('BreakEven not_achievable should have null months');
    }
  }
  // range status can have months null; no strict check here.

  return insight; // valid
}
