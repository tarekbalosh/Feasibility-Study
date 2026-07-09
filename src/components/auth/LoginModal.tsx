import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Eye, EyeOff, LogIn, X } from "lucide-react"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { useAuth } from "@/context/AuthContext"
import { loginSchema, type LoginFormData } from "@/lib/validations"

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { login } = useAuth()
  const router = useRouter()
  const [apiError, setApiError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  })

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
    } else {
      setTimeout(() => setIsVisible(false), 300) // Delay to allow exit animation
    }
  }, [isOpen])

  if (!isOpen && !isVisible) return null

  const onSubmit = async (data: LoginFormData) => {
    setApiError(null)
    try {
      // If user is on the home page or login page, redirect to dashboard.
      // Otherwise, keep them on their current page (e.g. tool, pricing).
      const returnTo = (router.pathname !== '/auth/login' && router.pathname !== '/') ? router.asPath : undefined
      await login(data.email, data.password, data.rememberMe, returnTo)
      onClose()
      reset()
    } catch (err: any) {
      const status = err.response?.status
      const serverMessage =
        err.response?.data?.error?.message ||
        err.response?.data?.message

      if (status === 400 || status === 401 || status === 404) {
        setApiError(serverMessage || "البريد الإلكتروني أو كلمة المرور غير صحيحة.")
      } else if (status === 429) {
        setApiError("تجاوزت الحد المسموح من المحاولات. يرجى الانتظار والمحاولة لاحقاً.")
      } else {
        setApiError(serverMessage || "حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.")
      }
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const registerHref = '/auth/register'

  return (
    <div 
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? 'opacity-100 backdrop-blur-sm bg-slate-900/40' : 'opacity-0 pointer-events-none'}`}
      onClick={handleBackdropClick}
      dir="rtl"
    >
      <div 
        className={`bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative transition-all duration-300 transform ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full p-2 transition-colors z-10"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <LogIn className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">مرحباً بعودتك</h2>
            <p className="text-sm text-slate-500">سجّل دخولك للوصول إلى لوحة التحكم ومشاريعك</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Error Message */}
            {apiError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                <span className="shrink-0 mt-0.5">⚠️</span>
                <span>{apiError}</span>
              </div>
            )}

            {/* Email */}
            <Input
              id="modal-login-email"
              type="email"
              label="البريد الإلكتروني"
              placeholder="example@email.com"
              dir="ltr"
              className="text-left"
              error={errors.email?.message}
              {...register("email")}
            />

            {/* Password */}
            <div className="relative">
              <Input
                id="modal-login-password"
                type={showPassword ? "text" : "password"}
                label="كلمة المرور"
                placeholder="أدخل كلمة المرور"
                dir="ltr"
                className="text-left pl-12"
                error={errors.password?.message}
                {...register("password")}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-[38px] text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Remember me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  {...register("rememberMe")}
                />
                <span className="text-sm text-slate-600">تذكّرني</span>
              </label>
              <Link
                href="/auth/forgot-password"
                onClick={onClose}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
              >
                نسيت كلمة المرور؟
              </Link>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="w-full py-3 text-base font-semibold shadow-sm hover:shadow-md transition-all"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  جارٍ تسجيل الدخول...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <LogIn className="w-5 h-5" />
                  تسجيل الدخول
                </span>
              )}
            </Button>

            {/* Register Link */}
            <p className="text-center text-sm text-slate-500 mt-6">
              ليس لديك حساب؟{" "}
              <Link
                href={registerHref}
                onClick={onClose}
                className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors"
              >
                إنشاء حساب مجاني
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
