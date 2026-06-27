import { z } from "zod"

// ——— Register Schema ———
export const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(3, "الاسم الكامل يجب أن يكون 3 أحرف على الأقل")
      .max(60, "الاسم الكامل طويل جداً"),
    email: z
      .string()
      .min(1, "البريد الإلكتروني مطلوب")
      .email("صيغة البريد الإلكتروني غير صحيحة"),
    password: z
      .string()
      .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
      .regex(/[A-Z]/, "يجب أن تحتوي على حرف كبير واحد على الأقل")
      .regex(/[0-9]/, "يجب أن تحتوي على رقم واحد على الأقل"),
    confirmPassword: z.string().min(1, "تأكيد كلمة المرور مطلوب"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "كلمتا المرور غير متطابقتين",
    path: ["confirmPassword"],
  })

export type RegisterFormData = z.infer<typeof registerSchema>

// ——— Login Schema ———
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "البريد الإلكتروني مطلوب")
    .email("صيغة البريد الإلكتروني غير صحيحة"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
  rememberMe: z.boolean().optional(),
})

export type LoginFormData = z.infer<typeof loginSchema>

// ——— Forgot Password Schema ———
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "البريد الإلكتروني مطلوب")
    .email("صيغة البريد الإلكتروني غير صحيحة"),
})

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

// ——— Reset Password Schema ———
export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
      .regex(/[A-Z]/, "يجب أن تحتوي على حرف كبير واحد على الأقل")
      .regex(/[0-9]/, "يجب أن تحتوي على رقم واحد على الأقل"),
    confirmPassword: z.string().min(1, "تأكيد كلمة المرور مطلوب"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "كلمتا المرور غير متطابقتين",
    path: ["confirmPassword"],
  })

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>
