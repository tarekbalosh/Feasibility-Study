import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import * as authService from "../services/authService";
import * as otpService from "../services/otpService";
import { validateEmailQuick } from "../utils/emailValidator";

// ——— POST /api/auth/register ———
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  const result = await authService.register({ name, email, password });

  res.status(201).json({
    success: true,
    needsVerification: result.needsVerification,
    message: result.message,
    data: result.data,
  });
});

// ——— POST /api/auth/login ———
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const result = await authService.login({ email, password });

  res.status(200).json({
    success: true,
    token: result.token,
    refreshToken: result.refreshToken,
    // الواجهة تعتمد عليه لتوجيه من لا يملك مساحة عمل إلى إنشائها
    hasWorkspace: result.hasWorkspace,
    data: result.data,
  });
});

// ——— POST /api/auth/forgot-password ———
export const forgotPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = req.body;

    const result = await authService.forgotPassword(email);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  }
);

// ——— POST /api/auth/reset-password ———
export const resetPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, token, newPassword } = req.body;

    const result = await authService.resetPassword({ email, token, newPassword });

    res.status(200).json({
      success: true,
      message: result.message,
    });
  }
);

// ——— POST /api/auth/refresh-token ———
export const refreshToken = asyncHandler(
  async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    const result = await authService.refreshToken(refreshToken);

    res.status(200).json({
      success: true,
      token: result.token,
      refreshToken: result.refreshToken,
    });
  }
);

// ——— GET /api/auth/verify-email ———
export const verifyEmail = asyncHandler(
  async (req: Request, res: Response) => {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      res.status(400).json({ success: false, message: "رمز التوثيق مفقود." });
      return;
    }

    const result = await authService.verifyEmail(token);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  }
);

// ——— POST /api/auth/resend-verification ———
export const resendVerification = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = req.body;

    const result = await authService.resendVerification(email);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  }
);

// ——— POST /api/auth/validate-email ———
// Real-time email validation for client-side feedback
export const validateEmail = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = req.body;

    const result = await validateEmailQuick(email);

    // Also check if the email is already registered
    if (result.valid) {
      const isRegistered = await authService.isEmailRegistered(email);
      if (isRegistered) {
        res.status(200).json({
          success: true,
          valid: false,
          message: "هذا البريد الإلكتروني مسجّل مسبقاً.",
        });
        return;
      }
    }

    res.status(200).json({
      success: true,
      valid: result.valid,
      message: result.message,
    });
  }
);

// ——— POST /api/auth/cleanup-unverified ———
// Clean up expired unverified accounts (can be called by cron job)
export const cleanupUnverified = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await authService.cleanupUnverifiedAccounts();

    res.status(200).json({
      success: true,
      message: result.message,
      deletedCount: result.deletedCount,
    });
  }
);

// ——— POST /api/auth/request-code ———
// الدخول بالبريد فقط: إصدار رمز من 6 أرقام وإرساله.
export const requestCode = asyncHandler(async (req: Request, res: Response) => {
  const { email, name } = req.body;

  const result = await otpService.requestLoginCode({ email, name });

  res.status(200).json({
    success: true,
    message: result.message,
    email: result.email,
    expiresInSeconds: result.expiresInSeconds,
  });
});

// ——— POST /api/auth/verify-code ———
// التحقق من الرمز، وإنشاء الحساب إن لزم، ثم إصدار رموز الجلسة.
export const verifyCode = asyncHandler(async (req: Request, res: Response) => {
  const { email, code, name } = req.body;

  const result = await otpService.verifyLoginCode({ email, code, name });

  // بريد جديد بلا اسم: الرمز ما زال صالحاً، ننتظر الاسم فقط
  if (result.needsName) {
    res.status(200).json({
      success: true,
      needsName: true,
      email: result.email,
      message: "أدخل اسمك لإكمال إنشاء مساحة عملك.",
    });
    return;
  }

  const { token, refreshToken } = authService.issueSessionTokens(
    result.userId,
    result.email
  );

  res.status(200).json({
    success: true,
    needsName: false,
    token,
    refreshToken,
    hasWorkspace: result.hasWorkspace,
    data: {
      userId: result.userId,
      name: result.name,
      email: result.email,
      subscriptionTier: result.subscriptionTier,
      subscriptionStatus: result.subscriptionStatus,
    },
  });
});
