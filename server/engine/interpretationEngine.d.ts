import { RawFinancialResult } from './types';
/**
 * Interpretation Engine – Applies business rules to a RawFinancialResult.
 * Returns deterministic interpretation fields.
 */
export type InterpretationResult = {
    profitMargin: number;
    paybackPeriod: number;
    risk: 'Strong' | 'Moderate' | 'High Risk' | 'Unrealistic';
    breakEven: {
        months: number | null;
        status: 'exact' | 'range' | 'not_achievable';
        note?: string;
    };
};
export declare function interpretFinancial(raw: RawFinancialResult): InterpretationResult;
//# sourceMappingURL=interpretationEngine.d.ts.map