import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const projectInfoSchema = z.object({
  projectName: z.string().min(1, 'اسم المشروع مطلوب').max(100, 'الحد الأقصى 100 حرف'),
  activityType: z.enum(['تجاري', 'صناعي', 'خدمي', 'تقني', 'آخر'], {
    errorMap: () => ({ message: 'يرجى اختيار نوع النشاط' }),
  }),
  description: z.string().min(50, 'الحد الأدنى 50 حرف').max(500, 'الحد الأقصى 500 حرف'),
});

const financialDataSchema = z.object({
  initialCapital: z.number({ invalid_type_error: 'مطلوب إدخال رقم' }).min(1, 'رأس المال مطلوب'),
  monthlyOperatingCosts: z.number({ invalid_type_error: 'مطلوب إدخال رقم' }).min(0, 'يجب أن يكون رقماً صحيحاً'),

  expectedMonthlyRevenue: z.number({ invalid_type_error: 'مطلوب إدخال رقم' }).min(0, 'يجب أن يكون رقماً صحيحاً'),
});

const sectorSchema = z.string().min(1, 'يرجى اختيار القطاع').optional();

const projectDetailsSchema = z.object({
  projectName: z.string().min(1, 'اسم المشروع مطلوب').max(100, 'الحد الأقصى 100 حرف').optional(),
  purpose: z.string().optional(),
});

const investmentDataSchema = z.object({
  amount: z.number({ invalid_type_error: 'مطلوب إدخال رقم' }).min(0, 'المبلغ مطلوب').optional(),
  currency: z.string().default('SAR'),
});

const partnerSchema = z.object({
  name: z.string().min(1, 'اسم الشريك مطلوب'),
  percentage: z.number().min(0).max(100),
});
const partnersDataSchema = z.array(partnerSchema).max(4, 'الحد الأقصى 4 شركاء').optional();

const setupItemSchema = z.object({
  name: z.string().min(1, 'الاسم مطلوب'),
  value: z.number().min(0, 'القيمة مطلوبة'),
});
const setupDataSchema = z.object({
  equipments: z.array(setupItemSchema).max(15, 'الحد الأقصى 15 عنصراً'),
  establishmentExpenses: z.array(setupItemSchema).max(15, 'الحد الأقصى 15 عنصراً'),
}).optional();

const salesDataSchema = z.object({
  firstYearAverage: z.number().min(0).default(0),
  monthlyGrid: z.array(z.number().min(0)).optional(),
  growthRateYear2: z.number().min(0).default(0),
  growthRateYear3: z.number().min(0).default(0),
}).optional();

const itemSchema = z.object({
  name: z.string().min(1, 'الاسم مطلوب'),
  cost: z.number().min(0),
  price: z.number().min(0),
});
const itemsDataSchema = z.object({
  items: z.array(itemSchema).max(20, 'الحد الأقصى 20 صنفاً'),
  suppliesPercentage: z.number().min(0).max(100).default(0),
}).optional();

const commissionTaxDataSchema = z.object({
  commissionRate: z.number().min(0).max(100).default(0),
  taxRate: z.number().min(0).max(100).default(0),
}).optional();

const monthlyExpenseItemSchema = z.object({
  name: z.string().min(1, 'الاسم مطلوب'),
  value: z.number().min(0, 'القيمة مطلوبة'),
});
const monthlyExpensesDataSchema = z.object({
  expenses: z.array(monthlyExpenseItemSchema).max(19, 'الحد الأقصى 19 مصنوفاً'),
  year2Expected: z.number().optional(),
  year3Expected: z.number().optional(),
}).optional();

export const feasibilitySchema = z.object({
  projectInfo: projectInfoSchema,
  financialData: financialDataSchema,
  sector: sectorSchema,
  projectDetails: projectDetailsSchema,
  investmentData: investmentDataSchema,
  partnersData: partnersDataSchema,
  setupData: setupDataSchema,
  salesData: salesDataSchema,
  itemsData: itemsDataSchema,
  commissionTaxData: commissionTaxDataSchema,
  monthlyExpensesData: monthlyExpensesDataSchema,
});
export type FinancialData = z.infer<typeof financialDataSchema>;
export type UseFeasibilityToolReturn = FeasibilityContextType;
export type ProjectInfoData = z.infer<typeof projectInfoSchema>;

export type FeasibilityData = z.infer<typeof feasibilitySchema>;

const defaultValues: FeasibilityData = {
  projectInfo: {
    projectName: '',
    activityType: 'تجاري',
    description: '',
  },
  financialData: {
    initialCapital: 0,
    monthlyOperatingCosts: 0,
    expectedMonthlyRevenue: 0,
  },
  sector: '',
  projectDetails: {
    projectName: '',
    purpose: '',
  },
  investmentData: {
    amount: 0,
    currency: 'SAR',
  },
  partnersData: [],
  setupData: {
    equipments: [],
    establishmentExpenses: [],
  },
  salesData: {
    firstYearAverage: 0,
    growthRateYear2: 0,
    growthRateYear3: 0,
  },
  itemsData: {
    items: [],
    suppliesPercentage: 0,
  },
  commissionTaxData: {
    commissionRate: 0,
    taxRate: 0,
  },
  monthlyExpensesData: {
    expenses: [],
  },
};

interface FeasibilityContextType {
  currentStep: number;
  totalSteps: number;
  nextStep: () => Promise<void>;
  prevStep: () => void;
  form: UseFormReturn<FeasibilityData>;
  isAnalyzing: boolean;
  setIsAnalyzing: (val: boolean) => void;
  analysisResult: any;
  setAnalysisResult: (val: any) => void;
  projectId?: string;
  setProjectId: (id: string) => void;
  projectInfo: any;
  financialData: any;
  updateProjectInfo: (data: any) => void;
  updateFinancialData: (data: any) => void;
  clearDraft: (resetState?: boolean) => void;
  recalculateFinancialData: () => void;
}

const FeasibilityContext = createContext<FeasibilityContextType | undefined>(undefined);

export const FeasibilityProvider = ({ children }: { children: ReactNode }) => {

  const router = useRouter();
  const { edit } = router.query;
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 14;
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const form = useForm<FeasibilityData>({
    resolver: zodResolver(feasibilitySchema),
    defaultValues,
    mode: 'onChange',
  });

  useEffect(() => {
    if (edit && typeof edit === 'string') {
      setProjectId(edit);
      import('@/lib/axios').then(({ default: axios }) => {
        axios.get('/projects/' + edit).then(res => {
          const p = res.data.data;

          // financialInputs contains the full form data saved during project creation
          const fi = p.financialInputs || {};

          // Build the full form state, preferring saved financialInputs over derived fields
          const restoredFormData: Partial<FeasibilityData> = {
            projectInfo: {
              projectName: p.name,
              activityType: (fi.projectInfo?.activityType || p.industry || 'تجاري') as any,
              description: fi.projectInfo?.description || p.description || '',
            },
            financialData: {
              initialCapital: fi.financialData?.initialCapital ?? p.targetCapital ?? 0,
              monthlyOperatingCosts: fi.financialData?.monthlyOperatingCosts ?? 0,
              expectedMonthlyRevenue: fi.financialData?.expectedMonthlyRevenue ?? 0,
            },
            sector: fi.sector || p.industry || '',
            projectDetails: fi.projectDetails || { projectName: p.name, purpose: '' },
            investmentData: fi.investmentData || { amount: p.targetCapital || 0, currency: 'SAR' },
            partnersData: fi.partnersData || [],
            setupData: fi.setupData || { equipments: [], establishmentExpenses: [] },
            salesData: fi.salesData || { firstYearAverage: 0, growthRateYear2: 0, growthRateYear3: 0 },
            itemsData: fi.itemsData || { items: [], suppliesPercentage: 0 },
            commissionTaxData: fi.commissionTaxData || { commissionRate: 0, taxRate: 0 },
            monthlyExpensesData: fi.monthlyExpensesData || { expenses: [] },
          };

          form.reset(restoredFormData as FeasibilityData);

          // Compute analysis result from actual data
          const rev = fi.financialData?.expectedMonthlyRevenue || 0;
          const cost = fi.financialData?.monthlyOperatingCosts || 0;
          const capital = fi.financialData?.initialCapital || p.targetCapital || 0;
          const profit = rev - cost;
          const roi = capital > 0 ? (profit * 12 / capital) * 100 : 0;

          setAnalysisResult({
            roi: roi.toFixed(1),
            profitMargin: rev > 0 ? ((profit / rev) * 100).toFixed(1) : 0,
            status: profit > 0 ? (roi > 20 ? 'ممتاز' : 'جيد') : 'مخاطرة عالية',
            costBreakdown: [
              { name: 'التشغيل', value: cost },
              { name: 'أخرى', value: cost * 0.1 },
            ],
            revenueProjection: [
              { month: 'الشهر 1', value: rev * 0.8 },
              { month: 'الشهر 3', value: rev },
              { month: 'الشهر 6', value: rev * 1.2 },
              { month: 'الشهر 12', value: rev * 1.5 },
            ]
          });

          setCurrentStep(13); // Jump directly to the Report step
        }).catch(err => console.error(err));
      });
    }
  }, [edit, form]);


  const clearDraft = (resetState = true) => {
    localStorage.removeItem('entrplan_guest_draft');
    if (resetState) {
      form.reset(defaultValues);
      setCurrentStep(1);
      setAnalysisResult(null);
      setProjectId(undefined);
    }
  };

  // Load from localStorage
  useEffect(() => {
    const savedDraft = localStorage.getItem('entrplan_guest_draft');
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed.data) {
          form.reset(parsed.data);
        }
        if (parsed.step) {
          setCurrentStep(parseInt(parsed.step, 10));
        }
        if (parsed.analysisResult) {
          setAnalysisResult(parsed.analysisResult);
        }
      } catch (e) {
        console.error('Failed to parse saved draft', e);
      }
    }
  }, [form]);

  // Save to localStorage on change
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      const currentDraftStr = localStorage.getItem('entrplan_guest_draft');
      let currentDraft = {};
      if (currentDraftStr) {
        try { currentDraft = JSON.parse(currentDraftStr); } catch (e) {}
      }
      
      if (type) {
        // Clear analysis result when user actively changes data so it recalculates
        setAnalysisResult(null);
        
        localStorage.setItem('entrplan_guest_draft', JSON.stringify({
          ...currentDraft,
          data: value,
          analysisResult: null, // Clear in local storage too
        }));
      } else {
        localStorage.setItem('entrplan_guest_draft', JSON.stringify({
          ...currentDraft,
          data: value,
        }));
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  useEffect(() => {
    const currentDraftStr = localStorage.getItem('entrplan_guest_draft');
    let currentDraft = {};
    if (currentDraftStr) {
      try { currentDraft = JSON.parse(currentDraftStr); } catch (e) {}
    }
    localStorage.setItem('entrplan_guest_draft', JSON.stringify({
      ...currentDraft,
      step: currentStep,
    }));
  }, [currentStep]);

  useEffect(() => {
    if (analysisResult) {
      const currentDraftStr = localStorage.getItem('entrplan_guest_draft');
      let currentDraft = {};
      if (currentDraftStr) {
        try { currentDraft = JSON.parse(currentDraftStr); } catch (e) {}
      }
      localStorage.setItem('entrplan_guest_draft', JSON.stringify({
        ...currentDraft,
        analysisResult,
      }));
    }
  }, [analysisResult]);

  const nextStep = async () => {
    let isValid = false;
    if (currentStep === 1) {
      isValid = !!form.getValues('sector');
    } else if (currentStep === 2) {
      isValid = await form.trigger('projectDetails.projectName');
    } else if (currentStep === 3) {
      isValid = await form.trigger('investmentData.amount');
    } else if (currentStep === 4) {
      const isFieldsValid = await form.trigger('partnersData');
      const partners = form.getValues('partnersData') || [];
      const total = partners.reduce((sum, p) => sum + (Number(p.percentage) || 0), 0);
      isValid = isFieldsValid && total === 100;
    } else if (currentStep === 5) {
      isValid = await form.trigger('setupData');
    } else if (currentStep === 6) {
      // Trigger individual fields to avoid zodResolver issues with optional monthlyGrid
      const avgValid = await form.trigger('salesData.firstYearAverage');
      const g2Valid = await form.trigger('salesData.growthRateYear2');
      const g3Valid = await form.trigger('salesData.growthRateYear3');
      const isFieldsValid = avgValid && g2Valid && g3Valid;
      const sales = form.getValues('salesData');
      const hasSales = (sales?.firstYearAverage || 0) > 0 || !!(sales?.monthlyGrid && sales.monthlyGrid.some(v => v > 0));
      isValid = isFieldsValid && hasSales;
      if (!hasSales && isFieldsValid) {
        form.setError('salesData.firstYearAverage', { message: 'أدخل متوسطاً تقريبياً — من دونه لا مبيعات نبني عليها الدراسة.' });
      }
    } else if (currentStep === 7) {
      const isFieldsValid = await form.trigger('itemsData');
      const items = form.getValues('itemsData.items') || [];
      const hasValidItem = items.some(item => !!item.name && (Number(item.price) || 0) > 0);
      isValid = isFieldsValid && hasValidItem;
      if (!hasValidItem) {
        alert('أدخل صنفاً واحداً على الأقل بتكلفته وسعره — عليه تُبنى دراسة تكاليفك.');
      }
    } else if (currentStep === 8) {
      isValid = await form.trigger('commissionTaxData');
    } else if (currentStep === 9) {
      isValid = await form.trigger('monthlyExpensesData');
      if (isValid) {
        // Data Aggregation
        const data = form.getValues();
        
        let rev = data.salesData?.firstYearAverage || 0;
        if (data.salesData?.monthlyGrid && data.salesData.monthlyGrid.some(v => v > 0)) {
          const sum = data.salesData.monthlyGrid.reduce((a, b) => a + (b || 0), 0);
          rev = sum / 12;
        }

        const fixedExpenses = (data.monthlyExpensesData?.expenses || []).reduce((sum, e) => sum + (Number(e.value) || 0), 0);
        
        const commRate = data.commissionTaxData?.commissionRate || 0;
        const taxRate = data.commissionTaxData?.taxRate || 0;
        
        const items = data.itemsData?.items || [];
        const totalCost = items.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
        const totalPrice = items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
        const costMargin = totalPrice > 0 ? (totalCost / totalPrice) : 0;
        const suppliesMargin = (data.itemsData?.suppliesPercentage || 0) / 100;
        
        const cogs = rev * (costMargin + suppliesMargin);
        const variableCosts = rev * ((commRate + taxRate) / 100);
        
        const equipTotal = (data.setupData?.equipments || []).reduce((sum, item) => sum + (Number(item.value) || 0), 0);
        const expTotal = (data.setupData?.establishmentExpenses || []).reduce((sum, item) => sum + (Number(item.value) || 0), 0);
        const grandTotalSetup = equipTotal + expTotal;
        // Use investmentData.amount as fallback when no equipment/establishment items exist
        const initialCapital = grandTotalSetup || Number(data.investmentData?.amount) || 0;
        const depreciation = Math.round(initialCapital / 36);

        const monthlyOperatingCosts = fixedExpenses + variableCosts + cogs + depreciation;

        form.setValue('financialData.expectedMonthlyRevenue', Math.round(rev));
        form.setValue('financialData.monthlyOperatingCosts', Math.round(monthlyOperatingCosts));
        form.setValue('financialData.initialCapital', Math.round(initialCapital));
      }
    } else {
      isValid = true;
    }

    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  /**
   * Recalculate derived financialData from all form inputs.
   * Same aggregation logic used in step 9 (MonthlyExpenses → Generation).
   */
  const recalculateFinancialData = () => {
    const data = form.getValues();

    let rev = data.salesData?.firstYearAverage || 0;
    if (data.salesData?.monthlyGrid && data.salesData.monthlyGrid.some(v => v > 0)) {
      const sum = data.salesData.monthlyGrid.reduce((a, b) => a + (b || 0), 0);
      rev = sum / 12;
    }

    const fixedExpenses = (data.monthlyExpensesData?.expenses || []).reduce((sum, e) => sum + (Number(e.value) || 0), 0);

    const commRate = data.commissionTaxData?.commissionRate || 0;
    const taxRate = data.commissionTaxData?.taxRate || 0;

    const items = data.itemsData?.items || [];
    const totalCost = items.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
    const totalPrice = items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
    const costMargin = totalPrice > 0 ? (totalCost / totalPrice) : 0;
    const suppliesMargin = (data.itemsData?.suppliesPercentage || 0) / 100;

    const cogs = rev * (costMargin + suppliesMargin);
    const variableCosts = rev * ((commRate + taxRate) / 100);

    const equipTotal = (data.setupData?.equipments || []).reduce((sum, item) => sum + (Number(item.value) || 0), 0);
    const expTotal = (data.setupData?.establishmentExpenses || []).reduce((sum, item) => sum + (Number(item.value) || 0), 0);
    const grandTotalSetup = equipTotal + expTotal;
    // Use investmentData.amount as fallback when no equipment/establishment items exist
    const initialCapital = grandTotalSetup || Number(data.investmentData?.amount) || 0;
    const depreciation = Math.round(initialCapital / 36);

    const monthlyOperatingCosts = fixedExpenses + variableCosts + cogs + depreciation;

    form.setValue('financialData.expectedMonthlyRevenue', Math.round(rev));
    form.setValue('financialData.monthlyOperatingCosts', Math.round(monthlyOperatingCosts));
    form.setValue('financialData.initialCapital', Math.round(initialCapital));
  };

  return (
    <FeasibilityContext.Provider
      value={{
          currentStep,
          totalSteps,
          nextStep,
          prevStep,
          form,
          isAnalyzing,
          setIsAnalyzing,
          analysisResult,
          setAnalysisResult,
          projectId,
          setProjectId,
          projectInfo: form.watch('projectInfo'),
          financialData: form.watch('financialData'),
          updateProjectInfo: (data: any) => form.setValue('projectInfo', data),
          updateFinancialData: (data: any) => form.setValue('financialData', data),
          clearDraft,
          recalculateFinancialData,
        }}
    >
      {children}
    </FeasibilityContext.Provider>
  );
};

export const useFeasibilityTool = () => {
  const context = useContext(FeasibilityContext);
    if (context === undefined) {
      // Return a safe fallback for static rendering (no provider)
      return {
      currentStep: 1,
      totalSteps: 14,
      nextStep: async () => {},
      prevStep: () => {},
      form: {
        // Minimal mock of useForm return (shape may be needed by components)
        register: () => {},
        watch: () => ({ projectInfo: { projectName: '' }, financialData: {} }),
        getValues: () => ({ projectInfo: { projectName: '' }, financialData: {} }),
        setValue: () => {},
        trigger: async () => true,
        reset: () => {},
        formState: { errors: {} },
      } as any,
      isAnalyzing: false,
      setIsAnalyzing: () => {},
      analysisResult: null,
      setAnalysisResult: () => {},
      projectId: undefined,
      setProjectId: () => {},
      projectInfo: {},
      financialData: {},
      updateProjectInfo: () => {},
      updateFinancialData: () => {},
      clearDraft: () => {},
      recalculateFinancialData: () => {},
    } as any;
  }
  return context;
};
