import React from "react"
import Link from "next/link"
import { ArrowLeft, Lightbulb, Shield, Target, Users2 } from "lucide-react"

/** القيم — نفس قيم صفحة /about */
const VALUES = [
  {
    icon: Lightbulb,
    title: "الابتكار المستمر",
    description:
      "نبحث باستمرار عن أحدث تقنيات الذكاء الاصطناعي ومعالجة البيانات لتبسيط أدوات التخطيط لعملائنا.",
  },
  {
    icon: Shield,
    title: "البساطة والدقة",
    description:
      "نلغي التعقيد المحاسبي في الواجهات، لكننا نحتفظ بأدق المعادلات الرياضية لحساب مؤشرات الأرباح.",
  },
  {
    icon: Users2,
    title: "تمكين رواد الأعمال",
    description:
      "رسالتنا هي إتاحة الأدوات الاستشارية عالية التكلفة لجميع المبتدئين والشركات الصغيرة مجاناً أو برمز بسيط.",
  },
]

export const AboutSection: React.FC = () => (
  <section
    id="about"
    className="py-20 bg-slate-50 border-t border-slate-200 scroll-mt-16"
  >
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* النص */}
        <div className="flex flex-col items-start gap-6 text-right">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
            من نحن
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
            من أداة واحدة إلى منصة أدوات لتخطيط المشاريع
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            بدأت فكرة المنصة عندما واجه مؤسسونا صعوبة بالغة في حساب التدفقات
            النقدية وفترة الاسترداد لتأسيس مشروع صغير، ووجدا أن الذهاب للمكاتب
            الاستشارية يتطلب ميزانيات ضخمة وأسابيع من الانتظار.
          </p>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            انطلقنا بأداة دراسة الجدوى، ثم اتّضح أن صاحب المشروع يحتاج أكثر من
            ذلك: تحليلاً استراتيجياً، وحاسبات سريعة تجيب عن سؤال واحد في دقيقة.
            لذلك تحوّلنا إلى منصة أدوات متكاملة، تُضاف إليها أداة جديدة كلما ثبت
            أنها تحلّ مشكلة حقيقية لرائد الأعمال.
          </p>
          <Link
            href="/about"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors duration-150"
          >
            اقرأ قصتنا كاملةً
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>

        {/* الرؤية */}
        <div className="p-8 bg-indigo-900 text-indigo-100 rounded-2xl shadow-lg flex flex-col justify-center gap-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-800 via-indigo-950 to-slate-950 opacity-90" />
          <div className="relative z-10 flex flex-col gap-4">
            <div className="w-12 h-12 bg-indigo-800 rounded-xl flex items-center justify-center text-indigo-400">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">رؤيتنا ورسالتنا</h3>
            <p className="text-xs sm:text-sm leading-relaxed text-indigo-200">
              أن نصبح المنصة الاستشارية الذكية الأولى والأكثر استخداماً في الوطن
              العربي لدعم أصحاب المشاريع الصغيرة والمتوسطة، ومساعدتهم في كتابة
              تقارير جاذبة وموثوقة تسهل عملية جذب التمويل البنكي والاستثماري.
            </p>
          </div>
        </div>
      </div>

      {/* القيم */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {VALUES.map((value) => {
          const Icon = value.icon
          return (
            <div
              key={value.title}
              className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col gap-3"
            >
              <div className="w-11 h-11 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                {value.title}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {value.description}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  </section>
)

export default AboutSection
