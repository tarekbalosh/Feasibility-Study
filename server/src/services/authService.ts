import * as bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import { prisma } from "../config/prisma";
import { env } from "../config/env";
import { ApiError } from "../utils/ApiError";
import { validateEmail } from "../utils/emailValidator";
import { sendVerificationEmail, sendWelcomeEmail } from "./emailService";

const SALT_ROUNDS = 12;

// ——————————————————————————————————————————————
// Generate JWT Tokens
// ——————————————————————————————————————————————
function generateAccessToken(userId: string, email: string): string {
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as string & SignOptions["expiresIn"],
  };
  return jwt.sign({ userId, email }, env.JWT_SECRET, options);
}

function generateRefreshToken(userId: string, email: string): string {
  const options: SignOptions = {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as string & SignOptions["expiresIn"],
  };
  return jwt.sign({ userId, email }, env.JWT_REFRESH_SECRET, options);
}

// ——————————————————————————————————————————————
// Register
// ——————————————————————————————————————————————
export async function register(data: {
  name: string;
  email: string;
  password: string;
}) {
  // Validate email (disposable + MX)
  const normalizedEmail = await validateEmail(data.email);

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    if (!existingUser.isVerified) {
      // If the existing account is unverified, we can delete it and let them re-register
      // This handles old unverified accounts in the DB.
      await prisma.$transaction([
        prisma.userLimit.deleteMany({ where: { userId: existingUser.id } }),
        prisma.user.delete({ where: { id: existingUser.id } }),
      ]);
    } else {
      throw ApiError.invalidInput("هذا البريد الإلكتروني مسجّل مسبقاً.", [
        { field: "email", issue: "البريد الإلكتروني مستخدم بالفعل." },
      ]);
    }
  }

  // Hash password
  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

  // Create verification payload
  const verificationPayload = {
    name: data.name,
    email: normalizedEmail,
    passwordHash,
    isVerificationToken: true
  };

  // Generate verification token (JWT)
  const verificationToken = jwt.sign(verificationPayload, env.JWT_SECRET, { expiresIn: "24h" });

  // Do NOT save the user to the database here!
  // Send verification email asynchronously
  sendVerificationEmail(normalizedEmail, data.name, verificationToken).catch((err) => {
    console.error("Failed to send verification email:", err);
  });

  return {
    needsVerification: true,
    message: "تم إنشاء حسابك بنجاح! تحقق من بريدك الإلكتروني لتفعيل الحساب",
    data: {
      userId: "", // No user ID until verified
      name: data.name,
      email: normalizedEmail,
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

  if (!user.isVerified) {
    throw ApiError.authRequired("يرجى توثيق بريدك الإلكتروني أولاً لتسجيل الدخول.");
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
  if (env.NODE_ENV === "development") {
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
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as {
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
// Email Verification
// ——————————————————————————————————————————————
export async function verifyEmail(token: string) {
  try {
    // Attempt to decode as JWT (new flow)
    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      name: string;
      email: string;
      passwordHash: string;
      isVerificationToken?: boolean;
    };

    if (!decoded.isVerificationToken || !decoded.email || !decoded.passwordHash) {
      throw ApiError.badRequest("رابط التوثيق غير صالح.");
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: decoded.email }
    });

    if (existingUser && existingUser.isVerified) {
      throw ApiError.badRequest("هذا الحساب موثق مسبقاً.");
    }

    let matchedUser = existingUser;

    if (!matchedUser) {
      // Create user + user limits in a transaction since it wasn't created yet
      matchedUser = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            name: decoded.name,
            email: decoded.email,
            passwordHash: decoded.passwordHash,
            isVerified: true,
          },
        });

        await tx.userLimit.create({
          data: {
            userId: newUser.id,
            generationsLimit: 1,
            resetAt: getNextMonthDate(),
          },
        });

        return newUser;
      }, { timeout: 15000 });
    } else {
      // For legacy unverified users in DB
      matchedUser = await prisma.user.update({
        where: { id: matchedUser.id },
        data: {
          isVerified: true,
          verificationToken: null,
          verificationTokenExpiry: null,
        }
      });
    }

    // Send welcome email asynchronously
    sendWelcomeEmail(matchedUser.email, matchedUser.name).catch((err) => {
      console.error("Failed to send welcome email:", err);
    });

    return { message: "تم توثيق الحساب بنجاح." };

  } catch (error) {
    if (error instanceof ApiError) throw error;
    
    // Fallback: check if it's an old hashed token
    const unverifiedUsers = await prisma.user.findMany({
      where: {
        isVerified: false,
        verificationToken: { not: null },
        verificationTokenExpiry: { gt: new Date() },
      },
    });

    let matchedUser = null;
    for (const user of unverifiedUsers) {
      if (user.verificationToken) {
        const isValid = await bcrypt.compare(token, user.verificationToken);
        if (isValid) {
          matchedUser = user;
          break;
        }
      }
    }

    if (!matchedUser) {
      throw ApiError.badRequest("رابط التوثيق غير صالح أو منتهي الصلاحية.");
    }

    // Update user as verified
    await prisma.user.update({
      where: { id: matchedUser.id },
      data: {
        isVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
      },
    });

    // Send welcome email asynchronously
    sendWelcomeEmail(matchedUser.email, matchedUser.name).catch((err) => {
      console.error("Failed to send welcome email:", err);
    });

    return { message: "تم توثيق الحساب بنجاح." };
  }
}

export async function resendVerification(email: string) {
  const normalizedEmail = await validateEmail(email);

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (user && user.isVerified) {
    throw ApiError.badRequest("هذا الحساب موثق مسبقاً.");
  }

  // Because new users are not saved until verified, they won't be in the DB.
  if (!user) {
    throw ApiError.badRequest("الحساب غير موجود أو غير مسجل. يرجى إنشاء حساب جديد ليتم إرسال رابط التوثيق.");
  }

  // Legacy flow for old unverified accounts
  const verificationPayload = {
    name: user.name,
    email: user.email,
    passwordHash: user.passwordHash,
    isVerificationToken: true
  };

  const verificationToken = jwt.sign(verificationPayload, env.JWT_SECRET, { expiresIn: "24h" });

  // Send verification email
  sendVerificationEmail(user.email, user.name, verificationToken).catch((err) => {
    console.error("Failed to resend verification email:", err);
  });

  return { message: "تم إرسال رابط التوثيق بنجاح." };
}

// ——————————————————————————————————————————————
// Check if Email is Already Registered
// ——————————————————————————————————————————————
export async function isEmailRegistered(email: string): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, isVerified: true, verificationTokenExpiry: true },
  });

  if (!user) return false;

  // If the account is unverified and the token has expired, treat as not registered
  // (the register function will clean it up)
  if (
    !user.isVerified &&
    user.verificationTokenExpiry &&
    new Date() > user.verificationTokenExpiry
  ) {
    return false;
  }

  return true;
}

// ——————————————————————————————————————————————
// Cleanup Unverified Accounts
// ——————————————————————————————————————————————
export async function cleanupUnverifiedAccounts() {
  // Delete unverified accounts where the verification token has expired
  const expiredUsers = await prisma.user.findMany({
    where: {
      isVerified: false,
      verificationTokenExpiry: {
        lt: new Date(), // Token has expired
      },
    },
    select: { id: true, email: true },
  });

  if (expiredUsers.length === 0) {
    return {
      message: "لا توجد حسابات غير مفعلة منتهية الصلاحية.",
      deletedCount: 0,
    };
  }

  const userIds = expiredUsers.map((u) => u.id);

  // Delete user limits first, then users (in a transaction)
  await prisma.$transaction([
    prisma.userLimit.deleteMany({
      where: { userId: { in: userIds } },
    }),
    prisma.user.deleteMany({
      where: { id: { in: userIds } },
    }),
  ]);

  console.log(
    `[Cleanup] Deleted ${expiredUsers.length} unverified accounts: ${expiredUsers.map((u) => u.email).join(", ")}`
  );

  return {
    message: `تم حذف ${expiredUsers.length} حساب غير مفعل.`,
    deletedCount: expiredUsers.length,
  };
}

// ——————————————————————————————————————————————
// Helper
// ——————————————————————————————————————————————
function getNextMonthDate(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1);
}
