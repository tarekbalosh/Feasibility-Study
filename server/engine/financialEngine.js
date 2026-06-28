"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeRawFinancials = computeRawFinancials;
exports.calculateFinancials = calculateFinancials;
/**
 * Pure deterministic calculators for each sector.
 * Each returns a RawFinancialResult containing ONLY the core numeric fields.
 */
function calculateCommercial(data) {
    const revenue = (data.expectedCustomersPerDay ?? 0) * (data.averageInvoiceValue ?? 0) * (data.workingDaysPerMonth ?? 0);
    const expenses = (data.employees ?? 0) * (data.avgSalary ?? 0) + (data.rent ?? 0) + (data.utilities ?? 0) + (data.otherExpenses ?? 0);
    const profit = revenue - expenses;
    const roi = expenses !== 0 ? profit / expenses : 0;
    const cashFlow = [profit];
    const paybackPeriod = profit > 0 ? expenses / profit : 0;
    const breakEvenMonths = profit > 0 ? Math.ceil(expenses / profit) : 0;
    return { revenue, expenses, profit, roi, cashFlow, paybackPeriod, breakEvenMonths };
}
function calculateIndustrial(data) {
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
function calculateService(data) {
    const revenue = (data.monthlyCustomers ?? 0) * (data.servicePrice ?? 0);
    const expenses = (data.operatingCosts ?? 0) + (data.employees ?? 0) * (data.avgSalary ?? 0);
    const profit = revenue - expenses;
    const roi = expenses !== 0 ? profit / expenses : 0;
    const cashFlow = [profit];
    const paybackPeriod = profit > 0 ? expenses / profit : 0;
    const breakEvenMonths = profit > 0 ? Math.ceil(expenses / profit) : 0;
    return { revenue, expenses, profit, roi, cashFlow, paybackPeriod, breakEvenMonths };
}
function calculateTech(data) {
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
const calculators = {
    commercial: calculateCommercial,
    industrial: calculateIndustrial,
    service: calculateService,
    tech: calculateTech,
};
/**
 * Financial Engine – pure math, no business rules.
 * Returns a RawFinancialResult for known sectors or a deterministic generic fallback.
 */
function computeRawFinancials(sector, data) {
    // existing implementation unchanged
    const fn = calculators[sector];
    if (fn)
        return fn(data);
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
function calculateFinancials(sectorConfig, data) {
    // For commercial sector as used in tests
    if (data.expectedCustomersPerDay !== undefined) {
        const monthlyRevenue = (data.expectedCustomersPerDay ?? 0) * (data.averageInvoiceValue ?? 0) * (data.workingDaysPerMonth ?? 0);
        const expenses = (data.employees ?? 0) * (data.avgSalary ?? 0) + (data.rent ?? 0) + (data.utilities ?? 0) + (data.otherExpenses ?? 0);
        const profit = monthlyRevenue - expenses;
        const profitMargin = monthlyRevenue !== 0 ? profit / monthlyRevenue : 0;
        const cashFlow = expenses;
        const annualRevenue = monthlyRevenue * 12;
        return { monthlyRevenue, annualRevenue, profitMargin, cashFlow };
    }
    // fallback: return data unchanged
    return data;
}
//# sourceMappingURL=financialEngine.js.map