/**
 * Classify a project (name & description) into a sector.
 * Returns sector, confidence (0-100) and suggestion list.
 */
export declare function classifyProject(name: string, description: string): Promise<any>;
/**
 * Generate a professional feasibility report (HTML & optional PDF URL).
 */
export declare function generateReport({ sector, data, financialResult, kpiResult }: any): Promise<any>;
//# sourceMappingURL=aiAnalysisEngine.d.ts.map