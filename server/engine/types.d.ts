import { z } from 'zod';
export declare const rawFinancialResultSchema: z.ZodObject<{
    revenue: z.ZodNumber;
    expenses: z.ZodNumber;
    profit: z.ZodNumber;
    roi: z.ZodNumber;
    cashFlow: z.ZodArray<z.ZodNumber, "many">;
    paybackPeriod: z.ZodNumber;
    breakEvenMonths: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    roi: number;
    revenue: number;
    expenses: number;
    profit: number;
    cashFlow: number[];
    paybackPeriod: number;
    breakEvenMonths: number;
}, {
    roi: number;
    revenue: number;
    expenses: number;
    profit: number;
    cashFlow: number[];
    paybackPeriod: number;
    breakEvenMonths: number;
}>;
export type RawFinancialResult = z.infer<typeof rawFinancialResultSchema>;
export declare const breakEvenSchema: z.ZodObject<{
    months: z.ZodNullable<z.ZodNumber>;
    status: z.ZodEnum<["exact", "range", "not_achievable"]>;
    note: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "exact" | "range" | "not_achievable";
    months: number | null;
    note?: string | undefined;
}, {
    status: "exact" | "range" | "not_achievable";
    months: number | null;
    note?: string | undefined;
}>;
export type BreakEven = z.infer<typeof breakEvenSchema>;
export declare const financialInsightSchema: z.ZodObject<{
    rawFinancial: z.ZodObject<{
        revenue: z.ZodNumber;
        expenses: z.ZodNumber;
        profit: z.ZodNumber;
        roi: z.ZodNumber;
        cashFlow: z.ZodArray<z.ZodNumber, "many">;
        paybackPeriod: z.ZodNumber;
        breakEvenMonths: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        roi: number;
        revenue: number;
        expenses: number;
        profit: number;
        cashFlow: number[];
        paybackPeriod: number;
        breakEvenMonths: number;
    }, {
        roi: number;
        revenue: number;
        expenses: number;
        profit: number;
        cashFlow: number[];
        paybackPeriod: number;
        breakEvenMonths: number;
    }>;
    profitMargin: z.ZodNumber;
    paybackPeriod: z.ZodNumber;
    risk: z.ZodEnum<["Strong", "Moderate", "High Risk", "Unrealistic"]>;
    breakEven: z.ZodObject<{
        months: z.ZodNullable<z.ZodNumber>;
        status: z.ZodEnum<["exact", "range", "not_achievable"]>;
        note: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        status: "exact" | "range" | "not_achievable";
        months: number | null;
        note?: string | undefined;
    }, {
        status: "exact" | "range" | "not_achievable";
        months: number | null;
        note?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    profitMargin: number;
    paybackPeriod: number;
    rawFinancial: {
        roi: number;
        revenue: number;
        expenses: number;
        profit: number;
        cashFlow: number[];
        paybackPeriod: number;
        breakEvenMonths: number;
    };
    risk: "Strong" | "Moderate" | "High Risk" | "Unrealistic";
    breakEven: {
        status: "exact" | "range" | "not_achievable";
        months: number | null;
        note?: string | undefined;
    };
}, {
    profitMargin: number;
    paybackPeriod: number;
    rawFinancial: {
        roi: number;
        revenue: number;
        expenses: number;
        profit: number;
        cashFlow: number[];
        paybackPeriod: number;
        breakEvenMonths: number;
    };
    risk: "Strong" | "Moderate" | "High Risk" | "Unrealistic";
    breakEven: {
        status: "exact" | "range" | "not_achievable";
        months: number | null;
        note?: string | undefined;
    };
}>;
export type FinancialInsight = z.infer<typeof financialInsightSchema>;
/**
 * Ensures that the interpretation fields inside FinancialInsight are
 * mathematically consistent with the raw financial numbers.
 * Throws a ZodError if any check fails.
 */
export declare function validateConsistency(insight: FinancialInsight): FinancialInsight;
//# sourceMappingURL=types.d.ts.map