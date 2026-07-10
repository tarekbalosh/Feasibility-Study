import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import * as authService from "../services/authService";

// ——— POST /api/auth/register ———
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  const result = await authService.register({ name, email, password });

  res.status(201).json({
    success: true,
    message: "تم تسجيل الحساب بنجاح.",
    token: result.token,
    refreshToken: result.refreshToken,
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
