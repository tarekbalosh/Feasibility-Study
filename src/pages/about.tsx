import React from "react"
import Link from "next/link"
import { PublicLayout } from "@/layouts/PublicLayout"
import { Button } from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import { Shield, Lightbulb, Users2, Target } from "lucide-react"

export default function About() {
  const values = [
    {
      icon: <Lightbulb className="w-6 h-6 text-indigo-600" />,
      title: "الابتكار المستمر",
      description: "نبحث باستمرار عن أحدث تقنيات الذكاء الاصطناعي ومعالجة البيانات لتبسيط دراسات الجدوى لعملائنا.",
    },
    {
      icon: <Shield className="w-6 h-6 text-indigo-600" />,
      title: "البساطة والدقة",
      description: "نلغي التعقيد المحاسبي في الواجهات، لكننا نحتفظ بأدق المعادلات الرياضية لحساب مؤشرات الأرباح.",
    },
    {
      icon: <Users2 className="w-6 h-6 text-indigo-600" />,
      title: "تمكين رواد الأعمال",
      description: "رسالتنا هي إتاحة الأدوات الاستشارية عالية التكلفة لجميع المبتدئين والشركات الصغيرة مجاناً أو برمز بسيط.",
    },
  ]

  return (
    <PublicLayout>
      {/* Header Section */}
      <section className="bg-slate-50 border-b border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center gap-4">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">من نحن</h1>
          <p className="text-lg text-slate-600 max-w-2xl leading-relaxed">
            تعرف على القصة وراء تأسيس Feasibility Suite ورسالتنا لخدمة منظومة ريادة الأعمال العربية.
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Story Text */}
            <div className="flex flex-col items-start gap-6 text-right">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
                قصتنا: تبسيط التخطيط المالي للمشاريع الناشئة
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                بدأت فكرة المنصة عندما واجه مؤسسونا صعوبة بالغة في حساب التدفقات النقدية وفترة الاسترداد لتأسيس مشروع صغير، ووجدا أن الذهاب للمكاتب الاستشارية يتطلب ميزانيات ضخمة وأسابيع من الانتظار.
              </p>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                من هنا انطلقت الرؤية: لماذا لا نستخدم قوة الذكاء الاصطناعي والرياضيات المبرمجة لتوليد تقارير مالية وسوقية احترافية فورية وبأسعار رمزية؟ اليوم، يساعد Feasibility Suite آلاف المبتدئين شهرياً في فهم وتصميم دراسات مشاريعهم بثقة وأمان.
              </p>
            </div>

            {/* Visual Block */}
            <div className="p-8 bg-indigo-900 text-indigo-100 rounded-2xl shadow-lg flex flex-col justify-center gap-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-800 via-indigo-950 to-slate-950 opacity-90"></div>
              <div className="relative z-10 flex flex-col gap-4">
                <div className="w-12 h-12 bg-indigo-800 rounded-xl flex items-center justify-center text-indigo-400">
                  <Target className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white">رؤيتنا ورسالتنا</h3>
                <p className="text-xs sm:text-sm leading-relaxed text-indigo-200">
                  أن نصبح المنصة الاستشارية الذكية الأولى والأكثر استخداماً في الوطن العربي لدعم أصحاب المشاريع الصغيرة والمتوسطة، ومساعدتهم في كتابة تقارير جاذبة وموثوقة تسهل عملية جذب التمويل البنكي والاستثماري.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values Grid */}
      <section className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 flex flex-col gap-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">المبادئ والقيم التي تقودنا</h2>
            <p className="text-slate-600">نحن نؤمن بالشفافية والابتكار المستمر لمساعدة عملائنا.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((val, i) => (
              <Card key={i} className="hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-6 flex flex-col gap-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center">
                    {val.icon}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{val.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{val.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 text-center flex flex-col items-center gap-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">انضم إلينا واصنع مستقبلك الاستثماري</h2>
          <Link href="/signup" passHref>
            <Button variant="primary" className="px-8 py-3">
              أنشئ حسابك الآن مجاناً
            </Button>
          </Link>
        </div>
      </section>
    </PublicLayout>
  )
}
