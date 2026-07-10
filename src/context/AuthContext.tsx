import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useRouter } from "next/router"
import apiClient from "@/lib/axios"

// ——— Types ———
export interface User {
  id: string
  name: string
  email: string
  avatarUrl?: string
  plan?: "free" | "pro" | "enterprise"
  createdAt?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string, rememberMe?: boolean, redirectUrl?: string) => Promise<void>
  register: (fullName: string, email: string, password: string, redirectUrl?: string) => Promise<any>
  logout: () => void
  forgotPassword: (email: string) => Promise<void>
  resetPassword: (token: string, password: string) => Promise<void>
  updateUser: (data: Partial<User>) => void
  resendVerification: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ——— Provider ———
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter()
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  })

  // تحميل بيانات المستخدم من localStorage عند التهيئة ومزامنة التبويبات
  useEffect(() => {
    const loadAuthFromStorage = () => {
      try {
        const storedToken = localStorage.getItem("accessToken")
        const storedUser = localStorage.getItem("user")
        if (storedToken && storedUser) {
          setState({
            user: JSON.parse(storedUser),
            token: storedToken,
            isAuthenticated: true,
            isLoading: false,
          })
        } else {
          setState({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          })
        }
      } catch {
        localStorage.removeItem("accessToken")
        localStorage.removeItem("user")
        setState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        })
      }
    }

    // Load initially
    loadAuthFromStorage()

    // Sync across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'accessToken' || e.key === 'user') {
        loadAuthFromStorage()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // ——— تسجيل الدخول ———
  const login = useCallback(
    async (email: string, password: string, rememberMe?: boolean, redirectUrl?: string) => {
      const { data: res } = await apiClient.post("/auth/login", { email, password })
      const { token, data: user } = res

      localStorage.setItem("accessToken", token)
      localStorage.setItem("user", JSON.stringify(user))

      setState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      })

      if (redirectUrl) {
        router.push(redirectUrl)
      } else {
        router.push("/dashboard")
      }
    },
    [router]
  )

  // ——— إنشاء حساب ———
  const register = useCallback(
    async (fullName: string, email: string, password: string, redirectUrl?: string) => {
      const { data: res } = await apiClient.post("/auth/register", {
        name: fullName,
        email,
        password,
      })
      
      if (res.needsVerification) {
        return res; // Return early, don't set tokens or redirect
      }

      const { token, data: user } = res

      localStorage.setItem("accessToken", token)
      localStorage.setItem("user", JSON.stringify(user))

      setState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      })

      if (redirectUrl) {
        router.push(redirectUrl)
      } else {
        router.push("/dashboard")
      }
      return res;
    },
    [router]
  )

  // ——— تسجيل الخروج ———
  const logout = useCallback(() => {
    localStorage.removeItem("accessToken")
    localStorage.removeItem("user")
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    })
    router.push("/")
  }, [router])

  // ——— نسيت كلمة المرور ———
  const forgotPassword = useCallback(async (email: string) => {
    await apiClient.post("/auth/forgot-password", { email })
  }, [])

  // ——— إعادة تعيين كلمة المرور ———
  const resetPassword = useCallback(async (resetToken: string, password: string) => {
    await apiClient.post("/auth/reset-password", { token: resetToken, password })
  }, [])

  // ——— تحديث بيانات المستخدم محلياً ———
  const updateUser = useCallback((data: Partial<User>) => {
    setState((prev) => {
      if (!prev.user) return prev
      const updatedUser = { ...prev.user, ...data }
      localStorage.setItem("user", JSON.stringify(updatedUser))
      return { ...prev, user: updatedUser }
    })
  }, [])

  // ——— إعادة إرسال رابط التوثيق ———
  const resendVerification = useCallback(async (email: string) => {
    await apiClient.post("/auth/resend-verification", { email })
  }, [])

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        forgotPassword,
        resetPassword,
        updateUser,
        resendVerification,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// ——— Hook ———
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export default AuthContext
