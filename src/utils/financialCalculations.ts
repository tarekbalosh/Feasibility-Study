/**
 * financialCalculations.ts
 * ========================
 * Central financial engine for the feasibility study report.
 * All numbers derived here so every section stays consistent.
 */

import type { FeasibilityData } from '@/hooks/useFeasibilityTool';

/* ───── Formatting helpers ───── */

export const fmt = (n: number) =>
  new Intl.NumberFormat('ar-SA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

export const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

export const fmtPct = (n: number) =>
  new Intl.NumberFormat('ar-SA', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(n) + '%';

export const MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

/* ───── Computed data types ───── */

export interface MonthlyRow {
  month: string;
  grossSales: number;
  commissionValue: number;
  taxValue: number;
  netSales: number;
}

export interface YearSalesData {
  year: number;
  months: MonthlyRow[];
  totalGross: number;
  totalCommission: number;
  totalTax: number;
  totalNet: number;
}

export interface DirectCostRow {
  month: string;
  rawMaterials: number;
  supplies: number;
  total: number;
}

export interface YearDirectCosts {
  year: number;
  rawMaterialRate: number;
  suppliesRate: number;
  months: DirectCostRow[];
  totalRaw: number;
  totalSupplies: number;
  totalAll: number;
}

export interface ExpenseItem {
  name: string;
  monthlyValues: number[];  // 12 values
  annualTotal: number;
}

export interface YearExpenses {
  year: number;
  items: ExpenseItem[];
  monthlyTotals: number[];  // 12 values
  grandTotal: number;
}

export interface PLRow {
  month: string;
  netSales: number;
  rawMaterials: number;
  supplies: number;
  totalDirectCosts: number;
  grossProfit: number;
  adminExpenses: number;
  netProfit: number;
}

export interface YearPL {
  year: number;
  months: PLRow[];
  totals: PLRow;
}

export interface CashFlowRow {
  monthIndex: number;       // 1–36
  yearMonth: string;        // "السنة 1 - يناير"
  openingBalance: number;
  capitalExpenditure: number;
  netSalesInflow: number;
  directCostsOutflow: number;
  expensesOutflow: number;
  netCashFlow: number;
  closingBalance: number;
  cumulativeRecovery: number;  // %
}

export interface BreakEvenData {
  year: number;
  fixedCosts: number;
  variableCostRatio: number;
  breakEvenMonthly: number;
  breakEvenDaily: number;
}

export interface PartnerShare {
  name: string;
  percentage: number;
  contributionValue: number;
  profitShare: number;
}

export interface FinancialReport {
  /* Section 1: Cover/Summary */
  projectName: string;
  initialInvestment: number;
  yearlyProfits: [number, number, number];
  totalProfit: number;
  roi: number;
  paybackMonths: number;

  /* Section 2: Investment Structure */
  partners: PartnerShare[];
  totalPartnerPercentage: number;
  equipments: { name: string; value: number }[];
  establishmentExpenses: { name: string; value: number }[];
  equipmentsTotal: number;
  establishmentTotal: number;
  assetsGrandTotal: number;

  /* Section 3: Sales Study */
  salesByYear: YearSalesData[];
  commissionRate: number;
  taxRate: number;

  /* Section 4: Direct Costs Table (items) */
  items: { name: string; cost: number; price: number; costRatio: number }[];
  avgCostRatio: number;

  /* Section 5: Direct Costs Study */
  directCostsByYear: YearDirectCosts[];

  /* Section 6: Expenses Study */
  expensesByYear: YearExpenses[];

  /* Section 7: Profit & Loss */
  plByYear: YearPL[];

  /* Section 8: Cash Flow */
  cashFlow: CashFlowRow[];
  yearEndCash: [number, number, number];

  /* Section 9: Break Even */
  breakEven: BreakEvenData[];

  /* Section 10: KPIs */
  profitMargins: [number, number, number];

  /* Depreciation */
  monthlyDepreciation: number;
}

/* ───── Main computation ───── */

export function computeFinancialReport(data: FeasibilityData): FinancialReport {
  const projectName = data.projectDetails?.projectName || data.projectInfo?.projectName || '';

  /* — Investment Basics — */
  const equipments = (data.setupData?.equipments || []).filter(e => e.name);
  const estExpenses = (data.setupData?.establishmentExpenses || []).filter(e => e.name);
  const equipmentsTotal = equipments.reduce((s, e) => s + (Number(e.value) || 0), 0);
  const establishmentTotal = estExpenses.reduce((s, e) => s + (Number(e.value) || 0), 0);
  const assetsGrandTotal = equipmentsTotal + establishmentTotal;
  const initialInvestment = assetsGrandTotal || data.financialData?.initialCapital || Number(data.investmentData?.amount) || 0;
  const monthlyDepreciation = Math.round((assetsGrandTotal || initialInvestment) / 36);

  /* — Partners — */
  const partnersRaw = data.partnersData || [];
  const totalPartnerPercentage = partnersRaw.reduce((s, p) => s + (Number(p.percentage) || 0), 0);

  /* — Rates — */
  const commissionRate = data.commissionTaxData?.commissionRate || 0;
  const taxRate = data.commissionTaxData?.taxRate || 0;

  /* — Items — */
  const items = (data.itemsData?.items || []).filter(i => i.name);
  const totalItemCost = items.reduce((s, i) => s + (Number(i.cost) || 0), 0);
  const totalItemPrice = items.reduce((s, i) => s + (Number(i.price) || 0), 0);
  const avgCostRatio = totalItemPrice > 0 ? (totalItemCost / totalItemPrice) * 100 : 0;
  const suppliesRate = data.itemsData?.suppliesPercentage || 0;

  /* — Monthly base sales (Year 1) — */
  const grid = data.salesData?.monthlyGrid;
  const hasGrid = grid && grid.some(v => v > 0);
  const avgSales = data.salesData?.firstYearAverage || 0;
  const baseMonthly: number[] = hasGrid
    ? grid!.map(v => Number(v) || 0)
    : Array(12).fill(avgSales);

  const growthY2 = (data.salesData?.growthRateYear2 || 0) / 100;
  const growthY3 = (data.salesData?.growthRateYear3 || 0) / 100;

  /* — Build 3-year sales — */
  const growthFactors = [1, 1 + growthY2, 1 + growthY3];
  const salesByYear: YearSalesData[] = growthFactors.map((gf, yi) => {
    const months: MonthlyRow[] = baseMonthly.map((base, mi) => {
      const gross = Math.round(base * gf * 100) / 100;
      const comm = Math.round(gross * (commissionRate / 100) * 100) / 100;
      const tax = Math.round(gross * (taxRate / 100) * 100) / 100;
      const net = Math.round((gross - comm - tax) * 100) / 100;
      return { month: MONTHS[mi], grossSales: gross, commissionValue: comm, taxValue: tax, netSales: net };
    });
    return {
      year: yi + 1,
      months,
      totalGross: months.reduce((s, m) => s + m.grossSales, 0),
      totalCommission: months.reduce((s, m) => s + m.commissionValue, 0),
      totalTax: months.reduce((s, m) => s + m.taxValue, 0),
      totalNet: months.reduce((s, m) => s + m.netSales, 0),
    };
  });

  /* — Direct Costs — */
  const rawMaterialRate = avgCostRatio;
  const directCostsByYear: YearDirectCosts[] = salesByYear.map(sy => {
    const months: DirectCostRow[] = sy.months.map(m => {
      const raw = Math.round(m.netSales * (rawMaterialRate / 100) * 100) / 100;
      const sup = Math.round(m.netSales * (suppliesRate / 100) * 100) / 100;
      return { month: m.month, rawMaterials: raw, supplies: sup, total: raw + sup };
    });
    return {
      year: sy.year,
      rawMaterialRate,
      suppliesRate,
      months,
      totalRaw: months.reduce((s, m) => s + m.rawMaterials, 0),
      totalSupplies: months.reduce((s, m) => s + m.supplies, 0),
      totalAll: months.reduce((s, m) => s + m.total, 0),
    };
  });

  /* — Expenses — */
  const userExpenses = (data.monthlyExpensesData?.expenses || []).filter(e => e.name);
  const expensesByYear: YearExpenses[] = [1, 2, 3].map(yr => {
    const allItems: ExpenseItem[] = [];

    // Depreciation (auto-computed)
    allItems.push({
      name: 'الإهلاك المحتسب',
      monthlyValues: Array(12).fill(monthlyDepreciation),
      annualTotal: monthlyDepreciation * 12,
    });

    // User expenses (same for all years as entered, since we don't have per-year variation in the form)
    userExpenses.forEach(exp => {
      const val = Number(exp.value) || 0;
      allItems.push({
        name: exp.name,
        monthlyValues: Array(12).fill(val),
        annualTotal: val * 12,
      });
    });

    const monthlyTotals = Array(12).fill(0).map((_, mi) =>
      allItems.reduce((s, item) => s + item.monthlyValues[mi], 0)
    );

    return {
      year: yr,
      items: allItems,
      monthlyTotals,
      grandTotal: monthlyTotals.reduce((s, v) => s + v, 0),
    };
  });

  /* — Profit & Loss — */
  const plByYear: YearPL[] = salesByYear.map((sy, yi) => {
    const dc = directCostsByYear[yi];
    const ex = expensesByYear[yi];

    const months: PLRow[] = sy.months.map((m, mi) => {
      const raw = dc.months[mi].rawMaterials;
      const sup = dc.months[mi].supplies;
      const totalDirect = raw + sup;
      const gross = m.netSales - totalDirect;
      const admin = ex.monthlyTotals[mi];
      const net = gross - admin;
      return {
        month: m.month,
        netSales: m.netSales,
        rawMaterials: raw,
        supplies: sup,
        totalDirectCosts: totalDirect,
        grossProfit: gross,
        adminExpenses: admin,
        netProfit: net,
      };
    });

    const totals: PLRow = {
      month: 'الإجمالي',
      netSales: months.reduce((s, m) => s + m.netSales, 0),
      rawMaterials: months.reduce((s, m) => s + m.rawMaterials, 0),
      supplies: months.reduce((s, m) => s + m.supplies, 0),
      totalDirectCosts: months.reduce((s, m) => s + m.totalDirectCosts, 0),
      grossProfit: months.reduce((s, m) => s + m.grossProfit, 0),
      adminExpenses: months.reduce((s, m) => s + m.adminExpenses, 0),
      netProfit: months.reduce((s, m) => s + m.netProfit, 0),
    };

    return { year: yi + 1, months, totals };
  });

  const yearlyProfits: [number, number, number] = [
    plByYear[0].totals.netProfit,
    plByYear[1].totals.netProfit,
    plByYear[2].totals.netProfit,
  ];
  const totalProfit = yearlyProfits[0] + yearlyProfits[1] + yearlyProfits[2];

  /* — Cash Flow (36 months) — */
  const cashFlow: CashFlowRow[] = [];
  let runningBalance = initialInvestment;

  for (let i = 0; i < 36; i++) {
    const yi = Math.floor(i / 12);
    const mi = i % 12;
    const opening = i === 0 ? initialInvestment : cashFlow[i - 1].closingBalance;
    const capEx = i === 0 ? initialInvestment : 0;
    const netSalesIn = salesByYear[yi].months[mi].netSales;
    const directOut = directCostsByYear[yi].months[mi].total;
    const expOut = expensesByYear[yi].monthlyTotals[mi];
    const netFlow = netSalesIn - directOut - expOut - capEx;
    const closing = opening + netFlow;
    const cumRecovery = initialInvestment > 0 ? ((closing / initialInvestment) * 100) : 0;

    cashFlow.push({
      monthIndex: i + 1,
      yearMonth: `السنة ${yi + 1} - ${MONTHS[mi]}`,
      openingBalance: opening,
      capitalExpenditure: capEx,
      netSalesInflow: netSalesIn,
      directCostsOutflow: directOut,
      expensesOutflow: expOut,
      netCashFlow: netFlow,
      closingBalance: closing,
      cumulativeRecovery: Math.round(cumRecovery * 10) / 10,
    });
  }

  const yearEndCash: [number, number, number] = [
    cashFlow[11].closingBalance,
    cashFlow[23].closingBalance,
    cashFlow[35].closingBalance,
  ];

  /* — Break Even — */
  const breakEven: BreakEvenData[] = expensesByYear.map((ex, yi) => {
    const fixedCosts = ex.grandTotal / 12;
    const variableCostRatio = ((avgCostRatio + suppliesRate + commissionRate + taxRate) / 100);
    const contributionMargin = 1 - variableCostRatio;
    const beMonthly = contributionMargin > 0 ? fixedCosts / contributionMargin : 0;
    const beDaily = beMonthly / 30;
    return {
      year: yi + 1,
      fixedCosts,
      variableCostRatio: variableCostRatio * 100,
      breakEvenMonthly: Math.round(beMonthly * 100) / 100,
      breakEvenDaily: Math.round(beDaily * 100) / 100,
    };
  });

  /* — ROI & Payback — */
  const roi = initialInvestment > 0 ? (totalProfit / initialInvestment) * 100 : 0;
  const avgMonthlyProfit = totalProfit / 36;
  const paybackMonths = avgMonthlyProfit > 0 ? initialInvestment / avgMonthlyProfit : Infinity;

  /* — Profit Margins — */
  const profitMargins: [number, number, number] = salesByYear.map((sy, yi) =>
    sy.totalNet > 0 ? (yearlyProfits[yi] / sy.totalNet) * 100 : 0
  ) as [number, number, number];

  /* — Partners with shares — */
  const partners: PartnerShare[] = partnersRaw.map(p => ({
    name: p.name,
    percentage: Number(p.percentage) || 0,
    contributionValue: Math.round(initialInvestment * ((Number(p.percentage) || 0) / 100) * 100) / 100,
    profitShare: Math.round(totalProfit * ((Number(p.percentage) || 0) / 100) * 100) / 100,
  }));

  return {
    projectName,
    initialInvestment,
    yearlyProfits,
    totalProfit,
    roi: Math.round(roi * 100) / 100,
    paybackMonths: Math.round(paybackMonths * 10) / 10,
    partners,
    totalPartnerPercentage,
    equipments: equipments.map(e => ({ name: e.name, value: Number(e.value) || 0 })),
    establishmentExpenses: estExpenses.map(e => ({ name: e.name, value: Number(e.value) || 0 })),
    equipmentsTotal,
    establishmentTotal,
    assetsGrandTotal,
    salesByYear,
    commissionRate,
    taxRate,
    items: items.map(i => ({
      name: i.name,
      cost: Number(i.cost) || 0,
      price: Number(i.price) || 0,
      costRatio: (Number(i.price) || 0) > 0 ? ((Number(i.cost) || 0) / (Number(i.price) || 0)) * 100 : 0,
    })),
    avgCostRatio: Math.round(avgCostRatio * 100) / 100,
    directCostsByYear,
    expensesByYear,
    plByYear,
    cashFlow,
    yearEndCash,
    breakEven,
    profitMargins,
    monthlyDepreciation,
  };
}
