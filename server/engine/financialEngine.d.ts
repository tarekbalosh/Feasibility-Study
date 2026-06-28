import { RawFinancialResult } from './types';
/**
 * Financial Engine – pure math, no business rules.
 * Returns a RawFinancialResult for known sectors or a deterministic generic fallback.
 */
export declare function computeRawFinancials(sector: string, data: Record<string, number>): RawFinancialResult;
export declare function calculateFinancials(sectorConfig: any, data: Record<string, any>): any;
//# sourceMappingURL=financialEngine.d.ts.map