import React from "react";
import Link from "next/link";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Shield, TrendingUp, Cpu } from "lucide-react";

export default function Home() {
  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32 bg-gradient-to-b from-indigo-50/50 via-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <div className="flex flex-col items-start gap-6 text-right">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                🚀 إعداد دراسات الجدوى بالذكاء الاصطناعي
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-tight">
                أنشئ دراسة جدوى احترافية لمشروعك في{" "}
                <span className="text-indigo-600">دقائق!</span>
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed max-w-xl">
                منصة رقمية ذكية تمكن رواد الأعمال وأصحاب المشاريع من إعداد خطط عمل ودراسات مالية تفصيلية متوافقة مع متطلبات البنوك وجهات التمويل خلال دقائق معدودة.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Link href="/auth/register" passHref>
                  <Button variant="primary" className="w-full sm:w-auto text-base px-8 py-3">
                    ابدأ دراستك مجاناً
                  </Button>
                </Link>
                <Link href="/features" passHref>
                  <Button variant="ghost" className="w-full sm:w-auto text-base border border-slate-200 bg-white hover:bg-slate-50 px-8 py-3">
                    اكتشف الميزات
                  </Button>
                </Link>
              </div>
            </div>

            {/* Visual Panel */}
            <div className="relative flex justify-center">
              <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-100/50 p-6 flex flex-col gap-6 relative">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-400"></span>
                    <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                    <span className="w-3 h-3 rounded-full bg-green-400"></span>
                  </div>
                  <span className="text-xs font-semibold text-slate-400">
                    لوحة المؤشرات المالية التقديرية
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-xs text-slate-400">صافي الأرباح السنوية</span>
                    <h3 className="text-lg font-bold text-slate-900 mt-1">150,000 SAR</h3>
                  </div>
                  <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                    <span className="text-xs text-emerald-800">معدل العائد الداخلي (IRR)</span>
                    <h3 className="text-lg font-bold text-emerald-600 mt-1">32.4%</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Overview */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 flex flex-col gap-4">
            <h2 className="text-3xl font-bold text-slate-900">
              لماذا تعتمد على Feasibility Suite؟
            </h2>
            <p className="text-slate-600">
              نحن نجمع أحدث تقنيات الذكاء الاصطناعي مع القواعد المالية والرياضية الصلبة لنوفر لك أدق النتائج.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="hover:shadow-md transition-shadow duration-200">
              <CardContent className="flex flex-col gap-4 p-6">
                <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                  <Cpu className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">ذكاء اصطناعي متطور</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  يحلل فكرة مشروعك ويصوغ لك تحليلات كاملة للسوق والمنافسين ونقاط القوة والضعف (SWOT) بأسلوب مهني مقنع.
                </p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow duration-200">
              <CardContent className="flex flex-col gap-4 p-6">
                <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">حسابات مالية دقيقة</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  حساب تلقائي للتدفق النقدي التقديري، قائمة الدخل، فترة استرداد رأس المال، ونقطة التعادل لتجنب الحسابات الخاطئة.
                </p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow duration-200">
              <CardContent className="flex flex-col gap-4 p-6">
                <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">تقارير جاهزة للبنوك</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  احصل على ملفات PDF احترافية ومشاريع جاهزة لتقديمها للجهات التمويلية المختلفة أو المستثمرين للبدء الفوري.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-indigo-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-800 via-indigo-950 to-slate-950 opacity-90"></div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 flex flex-col items-center gap-6">
          <h2 className="text-3xl sm:text-4xl font-bold">
            جاهز لإطلاق فكرة مشروعك القادم؟
          </h2>
          <p className="text-indigo-200 max-w-xl text-base leading-relaxed">
            اشترك الآن واصنع دراسة الجدوى الأولى الخاصة بك بالكامل مجاناً وخلال دقائق معدودة بمساعدة خبيرنا الذكي.
          </p>
          <Link href="/auth/register" passHref>
            <Button variant="secondary" className="px-8 py-3 text-base font-bold shadow-lg shadow-emerald-950/20">
              ابدأ الآن مجاناً
            </Button>
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
