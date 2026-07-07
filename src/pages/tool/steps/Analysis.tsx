import React, { useEffect, useRef } from 'react';
import { useFeasibilityTool } from '@/hooks/useFeasibilityTool';
import { useAuth } from '@/context/AuthContext';
import GuestAuthOverlay from './GuestAuthOverlay';
import { Loader2, PieChart as PieChartIcon, Activity, TrendingUp, Target } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function Analysis() {
  const { form, isAnalyzing, setIsAnalyzing, analysisResult, setAnalysisResult } = useFeasibilityTool();
  const { isAuthenticated } = useAuth();
  const { watch, getValues } = form;

  const data = watch();

  // Use a ref to track if analysis has already been triggered,
  // preventing re-runs when React re-renders or deps change references.
  const analysisTriggered = useRef(false);

  useEffect(() => {
    // Only run analysis once: when there's no result yet AND we haven't already triggered it
    if (!analysisResult && !analysisTriggered.current) {
      analysisTriggered.current = true;
      setIsAnalyzing(true);

      const timer = setTimeout(() => {
        try {
          // Read form values at execution time (not from a stale closure)
          const currentData = getValues();
          const rev = currentData.financialData.expectedMonthlyRevenue;
          const cost = currentData.financialData.monthlyOperatingCosts;
          const capital = currentData.financialData.initialCapital;
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
        } catch (err) {
          console.error('Analysis computation failed:', err);
        } finally {
          setIsAnalyzing(false);
        }
      }, 3000);

      return () => {
        clearTimeout(timer);
        // Reset the trigger so it can restart if Strict Mode unmounts/remounts us
        analysisTriggered.current = false;
      };
    }
  }, [analysisResult, getValues, setIsAnalyzing, setAnalysisResult]);

  if (isAnalyzing || !analysisResult) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500" dir="rtl">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 rounded-full animate-pulse" />
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin relative z-10" />
        </div>
        <h3 className="mt-6 text-xl font-bold text-gray-900">جاري تحليل البيانات باستخدام الذكاء الاصطناعي...</h3>
        <p className="mt-2 text-gray-500">نقوم بدراسة السوق ومقارنة مؤشرات مشروعك "{data.projectInfo.projectName || 'بدون اسم'}"</p>
      </div>
    );
  }

  const COLORS = ['#3b82f6', '#93c5fd', '#1d4ed8', '#bfdbfe'];

  return (
    <div className="relative" dir="rtl">
      <div className={isAuthenticated ? "" : "filter blur-[8px]"}>
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500" dir="rtl">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">نتائج التحليل المبدئي</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-start gap-4">
              <div className="bg-blue-100 p-3 rounded-lg text-blue-600"><Target size={24} /></div>
              <div>
                <p className="text-sm text-gray-500">حالة المشروع</p>
                <p className="text-lg font-bold text-gray-900">{analysisResult.status}</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-start gap-4">
              <div className="bg-green-100 p-3 rounded-lg text-green-600"><TrendingUp size={24} /></div>
              <div>
                <p className="text-sm text-gray-500">العائد على الاستثمار (ROI)</p>
                <p className="text-lg font-bold text-gray-900">{analysisResult.roi}% سنوي</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-start gap-4">
              <div className="bg-purple-100 p-3 rounded-lg text-purple-600"><Activity size={24} /></div>
              <div>
                <p className="text-sm text-gray-500">هامش الربح</p>
                <p className="text-lg font-bold text-gray-900">{analysisResult.profitMargin}%</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-start gap-4">
              <div className="bg-orange-100 p-3 rounded-lg text-orange-600"><PieChartIcon size={24} /></div>
              <div>
                <p className="text-sm text-gray-500">فترة الاسترداد</p>
                <p className="text-lg font-bold text-gray-900">
                   {data.financialData.expectedMonthlyRevenue - data.financialData.monthlyOperatingCosts > 0 
                    ? (data.financialData.initialCapital / (data.financialData.expectedMonthlyRevenue - data.financialData.monthlyOperatingCosts)).toFixed(1) 
                    : 'N/A'} أشهر
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-6">توقعات الإيرادات (السنة الأولى)</h3>
              <div className="h-64 w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analysisResult.revenueProjection}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} tickFormatter={(value) => `${value/1000}k`} />
                    <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-6">توزيع التكاليف</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analysisResult.costBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {analysisResult.costBreakdown.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-4">
                {analysisResult.costBreakdown.map((entry: any, index: number) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-sm text-gray-600">{entry.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      {!isAuthenticated && <GuestAuthOverlay />}
    </div>
  );
}
