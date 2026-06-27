import { RawFinancialResult } from './types';

/**
 * Pure deterministic calculators for each sector.
 * Each returns a RawFinancialResult containing ONLY the core numeric fields.
 */
function calculateCommercial(data: Record<string, number>): RawFinancialResult {
  const revenue = (data.expectedCustomersPerDay ?? 0) * (data.averageInvoiceValue ?? 0) * (data.workingDaysPerMonth ?? 0);
  const expenses = (data.employees ?? 0) * (data.avgSalary ?? 0) + (data.rent ?? 0) + (data.utilities ?? 0) + (data.otherExpenses ?? 0);
  const profit = revenue - expenses;
  const roi = expenses !== 0 ? profit / expenses : 0;
  const cashFlow = [profit];
  const paybackPeriod = profit > 0 ? expenses / profit : 0;
  const breakEvenMonths = profit > 0 ? Math.ceil(expenses / profit) : 0;
  return { revenue, expenses, profit, roi, cashFlow, paybackPeriod, breakEvenMonths };
}

function calculateIndustrial(data: Record<string, number>): RawFinancialResult {
  const revenue = (data.unitsProduced ?? 0) * (data.unitSellingPrice ?? 0);
  const unitCost = (data.rawMaterialCost ?? 0) + (data.laborCost ?? 0) + (data.operatingCost ?? 0);
  const expenses = unitCost * (data.unitsProduced ?? 0) + (data.wasteRatio ?? 0) * (data.rawMaterialCost ?? 0);
  const profit = revenue - expenses;
  const roi = expenses !== 0 ? profit / expenses : 0;
  const cashFlow = [profit];
  const paybackPeriod = profit > 0 ? expenses / profit : 0;
  const breakEvenMonths = profit > 0 ? Math.ceil(expenses / profit) : 0;
  return { revenue, expenses, profit, roi, cashFlow, paybackPeriod, breakEvenMonths };
}

function calculateService(data: Record<string, number>): RawFinancialResult {
  const revenue = (data.monthlyCustomers ?? 0) * (data.servicePrice ?? 0);
  const expenses = (data.operatingCosts ?? 0) + (data.employees ?? 0) * (data.avgSalary ?? 0);
  const profit = revenue - expenses;
  const roi = expenses !== 0 ? profit / expenses : 0;
  const cashFlow = [profit];
  const paybackPeriod = profit > 0 ? expenses / profit : 0;
  const breakEvenMonths = profit > 0 ? Math.ceil(expenses / profit) : 0;
  return { revenue, expenses, profit, roi, cashFlow, paybackPeriod, breakEvenMonths };
}

function calculateTech(data: Record<string, number>): RawFinancialResult {
  const mrr = (data.paidSubscribers ?? 0) * (data.subscriptionPrice ?? 0);
  const revenue = mrr * 12; // ARR as revenue proxy
  const expenses = (data.devCosts ?? 0) + (data.infraCosts ?? 0);
  const profit = revenue - expenses;
  const roi = expenses !== 0 ? profit / expenses : 0;
  const cashFlow = [profit];
  const paybackPeriod = profit > 0 ? expenses / profit : 0;
  const breakEvenMonths = profit > 0 ? Math.ceil(expenses / profit) : 0;
  return { revenue, expenses, profit, roi, cashFlow, paybackPeriod, breakEvenMonths };
}

/** Registry of sector calculators */
const calculators: Record<string, (data: Record<string, number>) => RawFinancialResult> = {
  commercial: calculateCommercial,
  industrial: calculateIndustrial,
  service: calculateService,
  tech: calculateTech,
};

/**
 * Financial Engine – pure math, no business rules.
 * Returns a RawFinancialResult for known sectors or a deterministic generic fallback.
 */
export function computeRawFinancials(sector: string, data: Record<string, number>): RawFinancialResult {
  const fn = calculators[sector];
  if (fn) return fn(data);
  // Generic deterministic fallback – uses same core formula as commercial as a safe default
  const revenue = (data.monthlyCustomers ?? 0) * (data.pricePerCustomer ?? 0);
  const expenses = (data.employees ?? 0) * (data.avgSalary ?? 0) + (data.rent ?? 0);
  const profit = revenue - expenses;
  const roi = expenses !== 0 ? profit / expenses : 0;
  const cashFlow = [profit];
  const paybackPeriod = profit > 0 ? expenses / profit : 0;
  const breakEvenMonths = profit > 0 ? Math.ceil(expenses / profit) : 0;
  return { revenue, expenses, profit, roi, cashFlow, paybackPeriod, breakEvenMonths };
}
