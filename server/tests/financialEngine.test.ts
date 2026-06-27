import { calculateFinancials } from '../../engine/financialEngine';
import { SECTORS } from '../../src/config/sectors';

describe('Financial Engine', () => {
  it('calculates commercial sector financials correctly', () => {
    const sectorConfig = SECTORS['commercial'];
    const data = {
      expectedCustomersPerDay: 100,
      averageInvoiceValue: 50,
      workingDaysPerMonth: 20,
      monthlyGrowthRate: 0.1,
      competitorsCount: 5,
      geographicLocation: 'Riyadh',
    };
    const result = calculateFinancials(sectorConfig, data);
    // basic sanity checks
    expect(result.monthlyRevenue).toBe(100 * 50 * 20);
    expect(result.annualRevenue).toBe(result.monthlyRevenue * 12);
    expect(result.profitMargin).toBeCloseTo(0.2);
    expect(result.cashFlow).toBeCloseTo(result.monthlyRevenue - result.profitMargin * result.monthlyRevenue);
  });

  it('falls back to raw data when sector has no calculate', () => {
    const sectorConfig = {} as any;
    const data = { a: 1, b: 2 };
    const result = calculateFinancials(sectorConfig, data);
    expect(result).toEqual(data);
  });
});
