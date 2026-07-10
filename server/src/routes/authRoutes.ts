import { Router } from "express";
import { body } from "express-validator";
import * as authController from "../controllers/authController";
import { validateRequest } from "../middleware/validateRequest";
import { authRateLimiter } from "../middleware/rateLimiter";

const router = Router();

// Apply stricter rate limiting to auth routes
router.use(authRateLimiter);

// ——— POST /api/auth/register ———
router.post(
  "/register",
  validateRequest([
    body("name")
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage("الاسم يجب أن يكون بين 3 و 100 حرف."),
    body("email")
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage("صيغة البريد الإلكتروني غير صحيحة."),
    body("password")
      .isLength({ min: 8 })
      .withMessage("كلمة المرور يجب أن تكون 8 أحرف على الأقل.")
      .matches(/[A-Z]/)
      .withMessage("يجب أن تحتوي على حرف كبير واحد على الأقل.")
      .matches(/[0-9]/)
      .withMessage("يجب أن تحتوي على رقم واحد على الأقل."),
  ]),
  authController.register
);

// ——— POST /api/auth/login ———
router.post(
  "/login",
  validateRequest([
    body("email")
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage("صيغة البريد الإلكتروني غير صحيحة."),
    body("password")
      .notEmpty()
      .withMessage("كلمة المرور مطلوبة."),
  ]),
  authController.login
);

// ——— POST /api/auth/forgot-password ———
router.post(
  "/forgot-password",
  validateRequest([
    body("email")
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage("صيغة البريد الإلكتروني غير صحيحة."),
  ]),
  authController.forgotPassword
);

// ——— POST /api/auth/reset-password ———
router.post(
  "/reset-password",
  validateRequest([
    body("email")
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage("البريد الإلكتروني مطلوب."),
    body("token")
      .notEmpty()
      .withMessage("رمز إعادة التعيين مطلوب."),
    body("newPassword")
      .isLength({ min: 8 })
      .withMessage("كلمة المرور يجب أن تكون 8 أحرف على الأقل.")
      .matches(/[A-Z]/)
      .withMessage("يجب أن تحتوي على حرف كبير واحد على الأقل.")
      .matches(/[0-9]/)
      .withMessage("يجب أن تحتوي على رقم واحد على الأقل."),
  ]),
  authController.resetPassword
);

// ——— POST /api/auth/refresh-token ———
router.post(
  "/refresh-token",
  validateRequest([
    body("refreshToken")
      .notEmpty()
      .withMessage("رمز التحديث مطلوب."),
  ]),
  authController.refreshToken
);

// ——— GET /api/auth/verify-email ———
router.get("/verify-email", authController.verifyEmail);

// ——— POST /api/auth/resend-verification ———
router.post(
  "/resend-verification",
  validateRequest([
    body("email")
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage("صيغة البريد الإلكتروني غير صحيحة."),
  ]),
  authController.resendVerification
);

export default router;
