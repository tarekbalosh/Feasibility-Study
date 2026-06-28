"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.financialInsightSchema = exports.breakEvenSchema = exports.rawFinancialResultSchema = void 0;
exports.validateConsistency = validateConsistency;
const zod_1 = require("zod");
/* ---- Raw Financial Result (source of truth) ---- */
exports.rawFinancialResultSchema = zod_1.z.object({
    revenue: zod_1.z.number(),
    expenses: zod_1.z.number(),
    profit: zod_1.z.number(),
    roi: zod_1.z.number(),
    cashFlow: zod_1.z.array(zod_1.z.number()),
    paybackPeriod: zod_1.z.number(), // months
    breakEvenMonths: zod_1.z.number(), // raw numeric estimate (may be huge)
});
/* ---- Simplified BreakEven ---- */
exports.breakEvenSchema = zod_1.z.object({
    months: zod_1.z.number().nullable(),
    status: zod_1.z.enum(['exact', 'range', 'not_achievable']),
    note: zod_1.z.string().optional(),
});
/* ---- Final API payload (FinancialInsight) ---- */
exports.financialInsightSchema = zod_1.z.object({
    rawFinancial: exports.rawFinancialResultSchema,
    // interpretation fields merged directly
    profitMargin: zod_1.z.number(),
    paybackPeriod: zod_1.z.number(),
    risk: zod_1.z.enum(['Strong', 'Moderate', 'High Risk', 'Unrealistic']),
    breakEven: exports.breakEvenSchema,
});
/* ---- Consistency validation layer ---- */
/**
 * Ensures that the interpretation fields inside FinancialInsight are
 * mathematically consistent with the raw financial numbers.
 * Throws a ZodError if any check fails.
 */
function validateConsistency(insight) {
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
    }
    else if (breakEven.status === 'not_achievable') {
        if (breakEven.months !== null) {
            throw new Error('BreakEven not_achievable should have null months');
        }
    }
    // range status can have months null; no strict check here.
    return insight; // valid
}
//# sourceMappingURL=types.js.map