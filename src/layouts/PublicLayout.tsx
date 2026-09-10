import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/router"
import {
  Menu,
  X,
  ArrowLeftRight,
  ArrowLeft,
  ChevronLeft,
  Mail,
  MapPin,
  Heart,
  Twitter,
  Linkedin,
  Facebook,
} from "lucide-react"
import { useWorkspace } from "@/context/WorkspaceContext"
import { StartWorkspaceButton } from "@/components/workspace/StartWorkspaceButton"
import { AddTeamButton } from "@/components/workspace/AddTeamButton"

const footerSections = [
  {
    title: "الروابط السريعة",
    links: [
      { name: "الرئيسية", path: "/" },
      { name: "كتالوج الأدوات", path: "/tools" },
      { name: "المميزات", path: "/features" },
    ],
  },
  {
    title: "الدعم والخصوصية",
    links: [
      { name: "من نحن", path: "/about" },
      { name: "اتصل بنا", path: "/contact" },
      { name: "شروط الخدمة", path: "/terms" },
    ],
  },
]

const socialLinks = [
  { name: "تويتر", href: "#", Icon: Twitter },
  { name: "لينكد إن", href: "#", Icon: Linkedin },
  { name: "فيسبوك", href: "#", Icon: Facebook },
]

interface PublicLayoutProps {
  children: React.ReactNode
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const { workspace } = useWorkspace()

  const navLinks = [
    { name: "الرئيسية", path: "/" },
    { name: "الأدوات", path: "/tools" },
    { name: "المميزات", path: "/features" },
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
            <Link href="/" className="flex items-center gap-2 min-w-0">
              <div className="w-10 h-10 shrink-0 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-sm">
                FS
              </div>
              <span className="text-base sm:text-xl font-bold text-slate-900 tracking-wide shrink-0">Feasibility Suite</span>
              {/* اسم مساحة العمل الحالية — يظهر لعضو مساحة قائمة.
                  يظهر على الجوال أيضاً (كان مخفياً تحت sm فيغيب عن أكثر
                  الشاشات استخداماً)، والقصّ يمنع تكسير الترويسة: العرض
                  الأقصى ضيّق على الجوال ويتّسع على الشاشات الأكبر. */}
              {workspace && (
                <span className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <span className="w-px h-5 bg-slate-300 shrink-0" aria-hidden="true" />
                  <span
                    title={workspace.name}
                    className="text-xs sm:text-sm font-semibold text-indigo-600 truncate max-w-[4.5rem] sm:max-w-[10rem]"
                  >
                    {workspace.name}
                  </span>
                </span>
              )}
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
                    isActive(link.path)
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-slate-600 hover:text-indigo-600 hover:bg-slate-50"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center gap-4">
              <AddTeamButton className="text-sm font-medium text-indigo-600 hover:text-indigo-700 px-3 py-2 transition-colors duration-150" />
              <StartWorkspaceButton className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow-sm transition-all duration-150 whitespace-nowrap" />
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
            {workspace && (
              <div className="px-3 pb-2 mb-1 border-b border-slate-100 text-sm">
                <span className="text-slate-400">مساحة العمل: </span>
                <span className="font-semibold text-indigo-600">{workspace.name}</span>
              </div>
            )}
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
              <AddTeamButton
                onNavigate={() => setIsOpen(false)}
                className="w-full text-center text-indigo-600 hover:bg-indigo-50 px-3 py-2.5 rounded-md text-base font-medium transition-colors"
              />
              <StartWorkspaceButton
                onNavigate={() => setIsOpen(false)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2.5 rounded-md text-base font-semibold"
              />
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className="relative bg-slate-900 text-slate-400 overflow-hidden">
        {/* شريط تدرّج علوي */}
        <div className="h-px w-full bg-gradient-to-l from-transparent via-indigo-500/60 to-transparent" />
        {/* توهّج خلفي خفيف */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 right-1/4 h-64 w-64 rounded-full bg-indigo-600/10 blur-3xl"
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
            {/* العلامة التجارية */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              <Link href="/" className="flex items-center gap-2 w-fit group">
                <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-base shadow-lg shadow-indigo-600/25 group-hover:scale-105 transition-transform duration-200">
                  FS
                </div>
                <span className="text-lg font-bold text-white tracking-wide">Feasibility Suite</span>
              </Link>
              <p className="text-sm leading-relaxed text-slate-400 max-w-xs">
                المنصة الذكية الأولى في الوطن العربي لمساعدة رواد الأعمال على إعداد دراسات الجدوى والخطط المالية بالذكاء الاصطناعي.
              </p>

              {/* شبكات التواصل */}
              <div className="flex items-center gap-3 pt-1">
                {socialLinks.map(({ name, href, Icon }) => (
                  <a
                    key={name}
                    href={href}
                    aria-label={name}
                    title={name}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400 hover:text-white hover:bg-indigo-600 hover:border-indigo-500 transition-colors duration-200"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* روابط */}
            {footerSections.map((section) => (
              <div key={section.title} className="lg:col-span-2">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-white mb-4">
                  <span className="w-1 h-4 rounded-full bg-indigo-500" />
                  {section.title}
                </h3>
                <ul className="space-y-3 text-sm">
                  {section.links.map((link) => (
                    <li key={link.path}>
                      <Link
                        href={link.path}
                        className="group inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors duration-150"
                      >
                        <ChevronLeft className="w-3.5 h-3.5 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 text-indigo-400 transition-all duration-200" />
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* تواصل معنا */}
            <div className="lg:col-span-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-white mb-4">
                <span className="w-1 h-4 rounded-full bg-indigo-500" />
                تواصل معنا
              </h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <a
                    href="mailto:support@feasibilitysuite.com"
                    className="flex items-start gap-2.5 text-slate-400 hover:text-white transition-colors duration-150"
                  >
                    <Mail className="w-4 h-4 mt-0.5 shrink-0 text-indigo-400" />
                    <span dir="ltr" className="text-right">support@feasibilitysuite.com</span>
                  </a>
                </li>
                <li className="flex items-start gap-2.5 text-slate-400">
                  <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-indigo-400" />
                  <span>Taman Putra Sulaiman, Selangor, 68000 Ampang.</span>
                </li>
              </ul>

              <StartWorkspaceButton
                icon={<ArrowLeft className="w-4 h-4" />}
                className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow-lg shadow-indigo-600/20 transition-all duration-150"
              />
            </div>
          </div>

          {/* الشريط السفلي */}
          <div className="mt-12 border-t border-slate-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
            <p className="text-slate-500 text-center md:text-right">
              &copy; {new Date().getFullYear()} Feasibility Suite. جميع الحقوق محفوظة.
            </p>
            <p className="flex items-center gap-1.5 text-slate-500">
              صُنع بشغف لرواد الأعمال العرب
              <Heart className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400" />
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default PublicLayout
