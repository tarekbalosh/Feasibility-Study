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

export function interpretFinancial(raw: RawFinancialResult): InterpretationResult {
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
function buildBreakEven(monthsRaw: number, profit: number) {
  if (profit <= 0) {
    return { months: null, status: 'not_achievable' as const, note: 'Break‑even cannot be achieved with non‑positive profit' };
  }
  if (monthsRaw <= 36) {
    return { months: monthsRaw, status: 'exact' as const };
  }
  return { months: null, status: 'range' as const, note: `Break‑even expected between 36 and ${monthsRaw} months` };
}

/** Multi‑factor risk classification */
function classifyRisk(params: { roi: number; profitMargin: number; paybackPeriod: number }) {
  const { roi, profitMargin, paybackPeriod } = params;
  // Deterministic thresholds (adjustable if needed)
  if (roi > 5 || profitMargin > 1 || paybackPeriod < 1) return 'Unrealistic' as const;
  if (roi >= 1.5 && profitMargin >= 0.25 && paybackPeriod <= 12) return 'Strong' as const;
  if (roi >= 1.0 && profitMargin >= 0.1 && paybackPeriod <= 24) return 'Moderate' as const;
  if (roi < 0.5 || profitMargin < 0 || paybackPeriod > 48) return 'High Risk' as const;
  return 'Moderate' as const;
}
