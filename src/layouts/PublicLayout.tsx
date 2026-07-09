import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/router"
import { Menu, X, ArrowLeftRight } from "lucide-react"
import { LoginModal } from "@/components/auth/LoginModal"

interface PublicLayoutProps {
  children: React.ReactNode
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const router = useRouter()

  const navLinks = [
    { name: "الرئيسية", path: "/" },
    { name: "المميزات", path: "/features" },
    { name: "الأسعار", path: "/pricing" },
    { name: "من نحن", path: "/about" },
    { name: "تواصل معنا", path: "/contact" },
  ]

  const isActive = (path: string) => router.pathname === path

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-cairo" dir="rtl">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-sm">
                FS
              </div>
              <span className="text-xl font-bold text-slate-900 tracking-wide">Feasibility Suite</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8 space-x-reverse">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`text-sm font-medium transition-colors duration-150 hover:text-indigo-600 ${
                    isActive(link.path) ? "text-indigo-600 border-b-2 border-indigo-600 pb-1" : "text-slate-600"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center gap-4">
              <button 
                onClick={() => setIsLoginModalOpen(true)}
                className="text-sm font-medium text-slate-600 hover:text-indigo-600 px-3 py-2 cursor-pointer transition-colors duration-150"
              >
                تسجيل الدخول
              </button>
              <Link
                href="/tool/FeasibilityTool"
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow-sm transition-all duration-150"
              >
                ابدأ مجاناً
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
              >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive(link.path) ? "bg-indigo-50 text-indigo-600" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
              <button
                onClick={() => {
                  setIsOpen(false)
                  setIsLoginModalOpen(true)
                }}
                className="block w-full text-center text-slate-600 hover:bg-slate-50 px-3 py-2 rounded-md text-base font-medium transition-colors"
              >
                تسجيل الدخول
              </button>
              <Link
                href="/tool/FeasibilityTool"
                onClick={() => setIsOpen(false)}
                className="block text-center bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2.5 rounded-md text-base font-semibold"
              >
                ابدأ مجاناً
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-base shadow-sm">
                  FS
                </div>
                <span className="text-lg font-bold text-white tracking-wide">Feasibility Suite</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-400">
                المنصة الذكية الأولى في الوطن العربي لمساعدة رواد الأعمال على إعداد دراسات الجدوى والخطط المالية بالذكاء الاصطناعي.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">الروابط السريعة</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/" className="hover:text-white transition-colors duration-150">الرئيسية</Link></li>
                <li><Link href="/features" className="hover:text-white transition-colors duration-150">المميزات</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors duration-150">الأسعار</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">الدعم والخصوصية</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="hover:text-white transition-colors duration-150">من نحن</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors duration-150">اتصل بنا</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors duration-150">شروط الخدمة</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">تواصل معنا</h3>
              <p className="text-sm text-slate-400">الدعم الفني: support@feasibilitysuite.com</p>
              <p className="text-sm text-slate-400 mt-2">Taman Putra Sulaiman, Selangor, 68000 Ampang.</p>
            </div>
          </div>
          <div className="mt-8 border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
            <p className="text-slate-500">
              &copy; {new Date().getFullYear()} Feasibility Suite. جميع الحقوق محفوظة.
            </p>
            <div className="flex space-x-6 space-x-reverse text-slate-500">
              <a href="#" className="hover:text-white">تويتر</a>
              <a href="#" className="hover:text-white">لينكد إن</a>
              <a href="#" className="hover:text-white">فيسبوك</a>
            </div>
          </div>
        </div>
      </footer>

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </div>
  )
}

export default PublicLayout
