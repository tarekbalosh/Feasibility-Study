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

export const feasibilitySchema = z.object({
  projectInfo: projectInfoSchema,
  financialData: financialDataSchema,
});

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
}

const FeasibilityContext = createContext<FeasibilityContextType | undefined>(undefined);

export const FeasibilityProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const { edit } = router.query;
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
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
          form.reset({
            projectInfo: {
              projectName: p.name,
              activityType: p.industry as any,
              description: p.description,
            },
            financialData: {
              initialCapital: p.targetCapital,
              monthlyOperatingCosts: p.financialInputs?.monthlyOperatingCosts || 0,
              expectedMonthlyRevenue: p.financialInputs?.expectedMonthlyRevenue || 0,
            }
          });
        }).catch(err => console.error(err));
      });
    }
  }, [edit, form]);


  // Load from sessionStorage
  useEffect(() => {
    const savedData = sessionStorage.getItem('feasibilityToolData');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        form.reset(parsed);
      } catch (e) {
        console.error('Failed to parse saved data', e);
      }
    }
    const savedStep = sessionStorage.getItem('feasibilityToolStep');
    if (savedStep) {
      // Don't restore beyond step 2 since analysis results aren't persisted
      const step = parseInt(savedStep, 10);
      setCurrentStep(Math.min(step, 2));
    }
  }, [form]);

  // Save to sessionStorage on change
  useEffect(() => {
    const subscription = form.watch((value) => {
      sessionStorage.setItem('feasibilityToolData', JSON.stringify(value));
    });
    return () => subscription.unsubscribe();
  }, [form]);

  useEffect(() => {
    sessionStorage.setItem('feasibilityToolStep', currentStep.toString());
  }, [currentStep]);

  const nextStep = async () => {
    let isValid = false;
    if (currentStep === 1) {
      isValid = await form.trigger('projectInfo');
    } else if (currentStep === 2) {
      isValid = await form.trigger('financialData');
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
      }}
    >
      {children}
    </FeasibilityContext.Provider>
  );
};

export const useFeasibilityTool = () => {
  const context = useContext(FeasibilityContext);
  if (context === undefined) {
    throw new Error('useFeasibilityTool must be used within a FeasibilityProvider');
  }
  return context;
};
