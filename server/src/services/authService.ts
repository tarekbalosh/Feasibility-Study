import * as bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import { prisma } from "../config/prisma";
import { config } from "../config";
import { ApiError } from "../utils/ApiError";

const SALT_ROUNDS = 12;

// ——————————————————————————————————————————————
// Generate JWT Tokens
// ——————————————————————————————————————————————
function generateAccessToken(userId: string, email: string): string {
  const options: SignOptions = {
    expiresIn: config.jwtExpiresIn as string & SignOptions["expiresIn"],
  };
  return jwt.sign({ userId, email }, config.jwtSecret, options);
}

function generateRefreshToken(userId: string, email: string): string {
  const options: SignOptions = {
    expiresIn: config.jwtRefreshExpiresIn as string & SignOptions["expiresIn"],
  };
  return jwt.sign({ userId, email }, config.jwtRefreshSecret, options);
}

// ——————————————————————————————————————————————
// Register
// ——————————————————————————————————————————————
export async function register(data: {
  name: string;
  email: string;
  password: string;
}) {
  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw ApiError.invalidInput("هذا البريد الإلكتروني مسجّل مسبقاً.", [
      { field: "email", issue: "البريد الإلكتروني مستخدم بالفعل." },
    ]);
  }

  // Hash password
  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

  // Create user + user limits in a transaction
  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
      },
    });

    // Create default user limits (free tier: 1 generation)
    await tx.userLimit.create({
      data: {
        userId: newUser.id,
        generationsLimit: 1,
        resetAt: getNextMonthDate(),
      },
    });

    return newUser;
  }, { timeout: 15000 });

  const token = generateAccessToken(user.id, user.email);
  const refreshToken = generateRefreshToken(user.id, user.email);

  return {
    token,
    refreshToken,
    data: {
      userId: user.id,
      name: user.name,
      email: user.email,
      subscriptionTier: user.subscriptionTier,
      subscriptionStatus: user.subscriptionStatus,
    },
  };
}

// ——————————————————————————————————————————————
// Login
// ——————————————————————————————————————————————
export async function login(data: { email: string; password: string }) {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    throw ApiError.authRequired("البريد الإلكتروني أو كلمة المرور غير صحيحة.");
  }

  const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);

  if (!isPasswordValid) {
    throw ApiError.authRequired("البريد الإلكتروني أو كلمة المرور غير صحيحة.");
  }

  const token = generateAccessToken(user.id, user.email);
  const refreshToken = generateRefreshToken(user.id, user.email);

  return {
    token,
    refreshToken,
    data: {
      userId: user.id,
      name: user.name,
      email: user.email,
      subscriptionTier: user.subscriptionTier,
      subscriptionStatus: user.subscriptionStatus,
    },
  };
}

// ——————————————————————————————————————————————
// Forgot Password
// ——————————————————————————————————————————————
export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    // Don't reveal whether the email exists — return success anyway
    return {
      message: "إذا كان البريد مسجلاً، سيتم إرسال رابط إعادة تعيين كلمة المرور.",
    };
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken: await bcrypt.hash(resetToken, SALT_ROUNDS),
      resetTokenExpiry,
    },
  });

  // TODO: Send email with reset link containing resetToken
  // For now, log the token in development
  if (config.nodeEnv === "development") {
    console.log(`[DEV] Reset token for ${email}: ${resetToken}`);
  }

  return {
    message: "إذا كان البريد مسجلاً، سيتم إرسال رابط إعادة تعيين كلمة المرور.",
  };
}

// ——————————————————————————————————————————————
// Reset Password
// ——————————————————————————————————————————————
export async function resetPassword(data: {
  email: string;
  token: string;
  newPassword: string;
}) {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user || !user.resetToken || !user.resetTokenExpiry) {
    throw ApiError.badRequest("رابط إعادة تعيين كلمة المرور غير صالح أو منتهي.");
  }

  // Check if token is expired
  if (new Date() > user.resetTokenExpiry) {
    throw ApiError.badRequest("انتهت صلاحية رابط إعادة التعيين. اطلب رابطاً جديداً.");
  }

  // Verify token
  const isTokenValid = await bcrypt.compare(data.token, user.resetToken);

  if (!isTokenValid) {
    throw ApiError.badRequest("رابط إعادة تعيين كلمة المرور غير صالح.");
  }

  // Update password and clear reset token
  const newPasswordHash = await bcrypt.hash(data.newPassword, SALT_ROUNDS);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: newPasswordHash,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });

  return { message: "تم تغيير كلمة المرور بنجاح." };
}

// ——————————————————————————————————————————————
// Refresh Token
// ——————————————————————————————————————————————
export async function refreshToken(token: string) {
  try {
    const decoded = jwt.verify(token, config.jwtRefreshSecret) as {
      userId: string;
      email: string;
    };

    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      throw ApiError.authRequired("المستخدم غير موجود.");
    }

    const newAccessToken = generateAccessToken(user.id, user.email);
    const newRefreshToken = generateRefreshToken(user.id, user.email);

    return {
      token: newAccessToken,
      refreshToken: newRefreshToken,
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.authExpired("رمز التحديث غير صالح أو منتهي الصلاحية.");
  }
}

// ——————————————————————————————————————————————
// Helper
// ——————————————————————————————————————————————
function getNextMonthDate(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1);
}
