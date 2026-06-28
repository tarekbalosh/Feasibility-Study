"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.interpretFinancial = interpretFinancial;
function interpretFinancial(raw) {
    // ---- Profit Margin ----
    const profitMargin = raw.revenue !== 0 ? raw.profit / raw.revenue : 0;
    // ---- Payback Period (already present in raw, expose for consistency) ----
    const paybackPeriod = raw.paybackPeriod;
    // ---- BreakEven conversion to simplified object ----
    const breakEven = buildBreakEven(raw.breakEvenMonths, raw.profit);
    // ---- Risk classification (multi‑factor) ----
    const risk = classifyRisk({ roi: raw.roi, profitMargin, paybackPeriod });
    return { profitMargin, paybackPeriod, risk, breakEven };
}
/** Build the simplified BreakEven object */
function buildBreakEven(monthsRaw, profit) {
    if (profit <= 0) {
        return { months: null, status: 'not_achievable', note: 'Break‑even cannot be achieved with non‑positive profit' };
    }
    if (monthsRaw <= 36) {
        return { months: monthsRaw, status: 'exact' };
    }
    return { months: null, status: 'range', note: `Break‑even expected between 36 and ${monthsRaw} months` };
}
/** Multi‑factor risk classification */
function classifyRisk(params) {
    const { roi, profitMargin, paybackPeriod } = params;
    // Deterministic thresholds (adjustable if needed)
    if (roi > 5 || profitMargin > 1 || paybackPeriod < 1)
        return 'Unrealistic';
    if (roi >= 1.5 && profitMargin >= 0.25 && paybackPeriod <= 12)
        return 'Strong';
    if (roi >= 1.0 && profitMargin >= 0.1 && paybackPeriod <= 24)
        return 'Moderate';
    if (roi < 0.5 || profitMargin < 0 || paybackPeriod > 48)
        return 'High Risk';
    return 'Moderate';
}
//# sourceMappingURL=interpretationEngine.js.map