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

export const SECTORS: Record<string, SectorConfig> = {
  commercial: {
    fields: [
      { key: 'expectedCustomersPerDay', label: 'عدد العملاء المتوقع يومياً', type: 'number' },
      { key: 'averageInvoiceValue', label: 'متوسط قيمة الفاتورة', type: 'number' },
      { key: 'workingDaysPerMonth', label: 'عدد أيام العمل شهرياً', type: 'number' },
      { key: 'monthlyGrowthRate', label: 'نسبة النمو الشهرية', type: 'number' },
      { key: 'competitorsCount', label: 'عدد المنافسين', type: 'number' },
      { key: 'geographicLocation', label: 'الموقع الجغرافي', type: 'text' },
    ],
    computeKPI: (res) => {
      const averageRevenuePerCustomer = Number(res.monthlyRevenue) / (Number(res.avgInvoiceValue) || 1);
      return {
        averageRevenuePerCustomer,
        salesGrowthRate: Number(res.roi) || 0,
        operationalEfficiency: Number(res.profitMargin) || 0,
        expectedMarketShare: 0.05,
      };
    },
  },
  industrial: {
    fields: [
      { key: 'monthlyProductionCapacity', label: 'الطاقة الإنتاجية الشهرية', type: 'number' },
      { key: 'unitsProduced', label: 'عدد الوحدات المنتجة', type: 'number' },
      { key: 'rawMaterialCost', label: 'تكلفة المواد الخام', type: 'number' },
      { key: 'laborCost', label: 'تكلفة العمالة', type: 'number' },
      { key: 'operatingCost', label: 'تكلفة التشغيل', type: 'number' },
      { key: 'wasteRatio', label: 'نسبة الهدر', type: 'number' },
      { key: 'unitSellingPrice', label: 'سعر بيع الوحدة', type: 'number' },
    ],
    // calculation logic moved to financial domain
    computeKPI: (res) => {
      return {
        productionEfficiency: Number(res.industrialProfitMargin) || 0,
        unitCost: Number(res.unitCost) || 0,
        wasteRatio: Number(res.wasteCost) || 0,
        capacityUtilization: 0.8,
      };
    },
  },
  service: {
    fields: [
      { key: 'monthlyCustomers', label: 'عدد العملاء شهرياً', type: 'number' },
      { key: 'servicePrice', label: 'سعر الخدمة', type: 'number' },
      { key: 'employeeCount', label: 'عدد الموظفين', type: 'number' },
      { key: 'workingHours', label: 'ساعات العمل', type: 'number' },
      { key: 'serviceOccupancyRate', label: 'معدل إشغال الخدمة', type: 'number' },
      { key: 'operatingCosts', label: 'تكاليف التشغيل', type: 'number' },
    ],
    // calculation logic moved to financial domain
    computeKPI: (res) => {
      return {
        revenuePerEmployee: Number(res.monthlyRevenue) / (Number(res.employeeCount) || 1),
        serviceOccupancy: Number(res.profitMargin) || 0,
        serviceCostPerUnit: Number(res.operationalProfit) / (Number(res.monthlyRevenue) || 1),
        expectedCustomerSatisfaction: 0.9,
      };
    },
  },
  tech: {
    fields: [
      { key: 'expectedUsers', label: 'عدد المستخدمين المتوقع', type: 'number' },
      { key: 'paidSubscribers', label: 'عدد المشتركين المدفوعين', type: 'number' },
      { key: 'subscriptionPrice', label: 'سعر الاشتراك', type: 'number' },
      { key: 'cac', label: 'تكلفة اكتساب العميل', type: 'number' },
      { key: 'ltv', label: 'قيمة العميل', type: 'number' },
      { key: 'churnRate', label: 'معدل الإلغاء', type: 'number' },
      { key: 'devCosts', label: 'تكاليف التطوير', type: 'number' },
      { key: 'infraCosts', label: 'تكاليف البنية التحتية', type: 'number' },
    ],
    // calculation logic moved to financial domain
    computeKPI: (res) => {
      return {
        conversionRate: 0.1,
        retentionRate: 1 - (Number(res.churnRate) || 0),
        userGrowth: 0.05,
        profitabilityPerUser: Number(res.roi) || 0,
      };
    },
  },
  other: {
    fields: [],

    computeKPI: () => ({}),
  },
};
