import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { asyncHandler } from "../utils/asyncHandler";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/ApiError";

// ——— GET /api/users/me ———
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: {
      id: true,
      name: true,
      email: true,
      subscriptionTier: true,
      subscriptionStatus: true,
      isVerified: true,
      createdAt: true,
      updatedAt: true,
      userLimit: {
        select: {
          generationsUsed: true,
          generationsLimit: true,
          resetAt: true,
        },
      },
    },
  });

  if (!user) {
    throw ApiError.notFound("المستخدم غير موجود.");
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

// ——— PUT /api/users/me ———
export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  const { name, email } = req.body;

  const updateData: Record<string, any> = {};
  if (name) updateData.name = name;
  if (email) updateData.email = email;

  const user = await prisma.user.update({
    where: { id: req.user!.userId },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      subscriptionTier: true,
      subscriptionStatus: true,
      isVerified: true,
      updatedAt: true,
    },
  });

  res.status(200).json({
    success: true,
    message: "تم تحديث البيانات بنجاح.",
    data: user,
  });
});

// ——— PUT /api/users/change-password ———
export const changePassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
    });

    if (!user) {
      throw ApiError.notFound("المستخدم غير موجود.");
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw ApiError.invalidInput("كلمة المرور الحالية غير صحيحة.", [
        { field: "currentPassword", issue: "كلمة المرور غير مطابقة." },
      ]);
    }

    const newHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: req.user!.userId },
      data: { passwordHash: newHash },
    });

    res.status(200).json({
      success: true,
      message: "تم تغيير كلمة المرور بنجاح.",
    });
  }
);

// ——— DELETE /api/users/me ———
export const deleteMe = asyncHandler(async (req: Request, res: Response) => {
  await prisma.user.delete({
    where: { id: req.user!.userId },
  });

  res.status(200).json({
    success: true,
    message: "تم حذف الحساب بنجاح.",
  });
});
