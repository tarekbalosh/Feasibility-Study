import React, { useState } from 'react';
import { useFeasibilityTool } from '@/hooks/useFeasibilityTool';
import { ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';

export default function Report() {
  const { form, analysisResult } = useFeasibilityTool();
  const data = form.getValues();
  
  const [openSections, setOpenSections] = useState({
    executive: true,
    financial: true,
    recommendations: true,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500" dir="rtl">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-blue-50 px-6 py-8 border-b border-blue-100 text-center">
          <FileText className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 mb-2">تقرير دراسة الجدوى المبدئية</h2>
          <p className="text-blue-600 font-medium text-lg">{data.projectInfo.projectName}</p>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          {/* Executive Summary */}
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <button 
              onClick={() => toggleSection('executive')}
              className="w-full flex items-center justify-between p-5 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <h3 className="text-lg font-bold text-gray-900">الملخص التنفيذي</h3>
              {openSections.executive ? <ChevronUp className="text-gray-500" /> : <ChevronDown className="text-gray-500" />}
            </button>
            {openSections.executive && (
              <div className="p-5 bg-white border-t border-gray-100">
                <p className="text-gray-600 leading-relaxed">
                  يصنف مشروع <strong>{data.projectInfo.projectName}</strong> كنشاط <strong>{data.projectInfo.activityType}</strong>. 
                  يهدف المشروع إلى: {data.projectInfo.description}
                </p>
                <div className="mt-4 flex items-start gap-3 bg-blue-50 p-4 rounded-lg">
                  <CheckCircle2 className="text-blue-600 mt-0.5 shrink-0" size={20} />
                  <p className="text-sm text-blue-800">
                    بناءً على المعطيات المدخلة، يعتبر المشروع <strong>{analysisResult?.status}</strong> كمؤشر أولي.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Financial Results */}
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <button 
              onClick={() => toggleSection('financial')}
              className="w-full flex items-center justify-between p-5 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <h3 className="text-lg font-bold text-gray-900">النتائج المالية والمؤشرات</h3>
              {openSections.financial ? <ChevronUp className="text-gray-500" /> : <ChevronDown className="text-gray-500" />}
            </button>
            {openSections.financial && (
              <div className="p-5 bg-white border-t border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-gray-50">
                    <span className="block text-sm text-gray-500 mb-1">رأس المال المستثمر</span>
                    <span className="font-bold text-gray-900">{formatCurrency(data.financialData.initialCapital)}</span>
                  </div>
                  <div className="p-4 rounded-lg bg-gray-50">
                    <span className="block text-sm text-gray-500 mb-1">صافي الربح الشهري (المتوقع)</span>
                    <span className="font-bold text-green-600">{formatCurrency(data.financialData.expectedMonthlyRevenue - data.financialData.monthlyOperatingCosts)}</span>
                  </div>
                  <div className="p-4 rounded-lg bg-gray-50">
                    <span className="block text-sm text-gray-500 mb-1">العائد على الاستثمار (ROI)</span>
                    <span className="font-bold text-gray-900">{analysisResult?.roi}% سنوياً</span>
                  </div>
                  <div className="p-4 rounded-lg bg-gray-50">
                    <span className="block text-sm text-gray-500 mb-1">هامش الربح</span>
                    <span className="font-bold text-gray-900">{analysisResult?.profitMargin}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Recommendations */}
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <button 
              onClick={() => toggleSection('recommendations')}
              className="w-full flex items-center justify-between p-5 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <h3 className="text-lg font-bold text-gray-900">التوصيات</h3>
              {openSections.recommendations ? <ChevronUp className="text-gray-500" /> : <ChevronDown className="text-gray-500" />}
            </button>
            {openSections.recommendations && (
              <div className="p-5 bg-white border-t border-gray-100">
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 text-sm font-bold">1</div>
                    <p className="text-gray-600">إجراء دراسة سوقية تفصيلية للتحقق من واقعية الإيرادات المتوقعة ({formatCurrency(data.financialData.expectedMonthlyRevenue)} شهرياً).</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 text-sm font-bold">2</div>
                    <p className="text-gray-600">تخصيص ميزانية طوارئ تعادل 20% من التكاليف التشغيلية لتغطية الأشهر الأولى.</p>
                  </li>
                  {Number(analysisResult?.roi) < 15 && (
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 mt-0.5"><AlertTriangle size={14} /></div>
                      <p className="text-amber-700 font-medium">العائد على الاستثمار منخفض نسبياً. يُنصح بمراجعة التكاليف أو إيجاد مصادر إيرادات إضافية.</p>
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
