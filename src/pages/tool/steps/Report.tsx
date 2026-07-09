import React, { useState, useMemo, useEffect } from 'react';
import { useFeasibilityTool } from '@/hooks/useFeasibilityTool';
import { useAuth } from '@/context/AuthContext';
import apiClient from '@/lib/axios';
import { computeFinancialReport } from '@/utils/financialCalculations';
import { FileText, Printer, AlertTriangle } from 'lucide-react';
import GuestAuthOverlay from './GuestAuthOverlay';
import ProjectEditDrawer from '@/components/tool/report/ProjectEditDrawer';

// Report sub-components
import ReportCover from '@/components/tool/report/ReportCover';
import KPIs from '@/components/tool/report/KPIs';
import InvestmentStructure from '@/components/tool/report/InvestmentStructure';
import SalesStudy from '@/components/tool/report/SalesStudy';
import DirectCosts from '@/components/tool/report/DirectCosts';
import CostsStudy from '@/components/tool/report/CostsStudy';
import ExpensesStudy from '@/components/tool/report/ExpensesStudy';
import ProfitAndLoss from '@/components/tool/report/ProfitAndLoss';
import CashFlow from '@/components/tool/report/CashFlow';
import BreakEven from '@/components/tool/report/BreakEven';
import InvestorResults from '@/components/tool/report/InvestorResults';

interface ReportProps {
  forPrint?: boolean;
}

export const getServerSideProps = async () => ({ props: {} });

export default function Report({ forPrint = false }: ReportProps) {
  const { form, analysisResult, projectId, setProjectId, clearDraft } = useFeasibilityTool();
  const { isAuthenticated } = useAuth();
  const data = form.getValues();

  const [showAuthOverlay, setShowAuthOverlay] = useState(false);
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const [isLinking, setIsLinking] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      setShowAuthOverlay(false);
    }
    
    if (isAuthenticated && !projectId && !isLinking) {
      const linkDraftToAccount = async () => {
        setIsLinking(true);
        try {
          const formValues = form.getValues();
          const desc = formValues.projectInfo?.description || formValues.projectDetails?.purpose || '';
          const validDesc = desc.length >= 10 ? desc : (desc + ' (تم إنشاء هذا المشروع من خلال الأداة).');

          const payload = {
            name: formValues.projectInfo?.projectName || formValues.projectDetails?.projectName || 'مشروع جديد',
            industry: formValues.sector || 'غير محدد',
            location: 'غير محدد',
            targetCapital: formValues.financialData?.initialCapital || 1000,
            description: validDesc,
            financialInputs: formValues, // Send all tool data
          };

          const { data: res } = await apiClient.post('/projects', payload);
          const newProjectId = res.data?.id;
          
          if (newProjectId) {
            setProjectId(newProjectId);
            clearDraft(false);
          }
        } catch (err: any) {
          console.error('Failed to link project:', err);
        } finally {
          setIsLinking(false);
        }
      };
      linkDraftToAccount();
    }
  }, [isAuthenticated, projectId]);

  // Compute all financial data from form inputs
  const report = useMemo(() => computeFinancialReport(data), [data]);

  // Table of contents navigation
  const sections = [
    { id: 'cover', label: 'الملخص التنفيذي' },
    { id: 'kpis', label: 'المؤشرات المالية' },
    { id: 'investment', label: 'هيكل الاستثمار' },
    { id: 'sales', label: 'دراسة المبيعات' },
    { id: 'items', label: 'تكاليف المنتجات' },
    { id: 'costs', label: 'التكاليف المباشرة' },
    { id: 'expenses', label: 'المصاريف التشغيلية' },
    { id: 'pl', label: 'الأرباح والخسائر' },
    { id: 'cashflow', label: 'التدفقات النقدية' },
    { id: 'breakeven', label: 'نقطة التعادل' },
    { id: 'investor', label: 'رسالة المستثمرين' },
  ];

  const [activeSection, setActiveSection] = useState('cover');

  const handlePrint = () => {
    if (!isAuthenticated) {
      setShowAuthOverlay(true);
      return;
    }
    window.print();
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" dir="rtl">
      {/* Unauthenticated Alert Banner */}
      {!forPrint && !isAuthenticated && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-xl mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden shadow-sm">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <AlertTriangle className="w-6 h-6 text-yellow-600 shrink-0" />
            <p className="text-sm font-medium leading-relaxed">
              لن يتم حفظ هذا التقرير في حسابك وسيتم إزالته بعد عدة دقائق إذا لم تقم بإنشاء حساب أو تسجيل الدخول.
            </p>
          </div>
          <button
            onClick={() => setShowAuthOverlay(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap transition-colors w-full sm:w-auto text-center"
          >
            إنشاء حساب أو تسجيل الدخول
          </button>
        </div>
      )}

      {/* Top Bar */}
      {!forPrint && (
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4 print:hidden">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2.5 rounded-xl">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900">تقرير دراسة الجدوى الشاملة</h1>
              <p className="text-sm text-gray-500">{report.projectName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowEditDrawer(true)}
              className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2.5 rounded-xl hover:bg-indigo-100 transition-colors text-sm font-bold shadow-sm border border-indigo-100"
            >
              تعديل معلومات المشروع
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm font-bold shadow-sm"
            >
              <Printer className="w-4 h-4" />
              طباعة التقرير
            </button>
          </div>
        </div>
      )}

      {/* Quick Nav (Desktop sidebar / Mobile horizontal scroll) */}
      {!forPrint && (
        <div className="mb-6 overflow-x-auto print:hidden">
          <div className="flex gap-2 pb-2 min-w-max">
            {sections.map(s => (
              <a
                key={s.id}
                href={`#section-${s.id}`}
                onClick={() => setActiveSection(s.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors
                  ${activeSection === s.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Report Sections */}
      <div className="space-y-2">
        <div id="section-cover">
          <ReportCover report={report} />
        </div>

        <div id="section-kpis">
          <KPIs report={report} />
        </div>

        <div id="section-investment">
          <InvestmentStructure report={report} />
        </div>

        <div id="section-sales">
          <SalesStudy report={report} />
        </div>

        <div id="section-items">
          <DirectCosts report={report} />
        </div>

        <div id="section-costs">
          <CostsStudy report={report} />
        </div>

        <div id="section-expenses">
          <ExpensesStudy report={report} />
        </div>

        <div id="section-pl">
          <ProfitAndLoss report={report} />
        </div>

        <div id="section-cashflow">
          <CashFlow report={report} />
        </div>

        <div id="section-breakeven">
          <BreakEven report={report} />
        </div>

        <div id="section-investor">
          <InvestorResults report={report} />
        </div>
      </div>

      <ProjectEditDrawer 
        isOpen={showEditDrawer}
        onClose={() => setShowEditDrawer(false)}
        onSave={() => setShowEditDrawer(false)}
      />

      {showAuthOverlay && (
        <GuestAuthOverlay onClose={() => setShowAuthOverlay(false)} />
      )}
    </div>
  );
}
