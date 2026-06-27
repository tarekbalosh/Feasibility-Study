import React from "react"
import Link from "next/link"

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen flex font-cairo" dir="rtl">
      {/* الجانب الأيسر — البراندينق */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900">
        {/* أشكال زخرفية */}
        <div className="absolute inset-0">
          <div className="absolute top-20 -left-20 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-32 right-10 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-white/[0.07] rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] border border-white/[0.05] rounded-full" />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12 text-center text-white">
          {/* اللوجو */}
          <Link href="/" className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center text-white font-bold text-xl border border-white/20">
              FS
            </div>
            <span className="text-2xl font-bold tracking-wide">Feasibility Suite</span>
          </Link>

          <h2 className="text-3xl font-bold leading-tight mb-4">
            أنشئ دراسة جدوى<br />احترافية في دقائق
          </h2>
          <p className="text-indigo-200 text-base leading-relaxed max-w-md">
            منصة ذكية تعتمد على الذكاء الاصطناعي لمساعدتك في تحويل أفكارك إلى خطط عمل ممولة وقابلة للتنفيذ.
          </p>

          {/* مؤشرات الثقة */}
          <div className="mt-12 grid grid-cols-3 gap-6 text-center">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black">+5,000</span>
              <span className="text-xs text-indigo-300 mt-1">دراسة مُنجزة</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black">98%</span>
              <span className="text-xs text-indigo-300 mt-1">نسبة الرضا</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black">3 دقائق</span>
              <span className="text-xs text-indigo-300 mt-1">متوسط الإنجاز</span>
            </div>
          </div>
        </div>
      </div>

      {/* الجانب الأيمن — النموذج */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-slate-50 relative">
        {/* لوجو الموبايل */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              FS
            </div>
            <span className="text-xl font-bold text-slate-900">Feasibility Suite</span>
          </Link>
        </div>

        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
            {subtitle && (
              <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
            )}
          </div>

          {children}
        </div>

        {/* فوتر صغير */}
        <p className="absolute bottom-6 text-xs text-slate-400">
          &copy; {new Date().getFullYear()} Feasibility Suite. جميع الحقوق محفوظة.
        </p>
      </div>
    </div>
  )
}

export default AuthLayout
