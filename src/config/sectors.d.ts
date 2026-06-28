export interface SectorField {
    key: string;
    label: string;
    type: 'number' | 'text';
    placeholder?: string;
}
export interface FinancialResult {
    [key: string]: number | number[];
}
export interface KPIResult {
    [key: string]: number | string | number[];
}
export interface SectorConfig {
    fields: SectorField[];
    computeKPI: (result: FinancialResult) => KPIResult;
}
export declare const SECTORS: Record<string, SectorConfig>;
//# sourceMappingURL=sectors.d.ts.map