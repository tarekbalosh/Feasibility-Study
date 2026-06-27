import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { ApiError } from "../utils/ApiError";
import { logger } from "../utils/logger";

/**
 * Global Error Handler Middleware
 * معالجة موحّدة لجميع الأخطاء — يتوافق مع هيكل الخطأ في api-design.md
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // ——— ApiError (operational errors) ———
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details && { details: err.details }),
      },
    });
    return;
  }

  // ——— Prisma Known Request Errors ———
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    logger.error(`Prisma Error [${err.code}]: ${err.message}`);

    switch (err.code) {
      case "P2002": {
        // Unique constraint violation
        const target = (err.meta?.target as string[]) || [];
        res.status(400).json({
          success: false,
          error: {
            code: "INVALID_INPUT_DATA",
            message: "هذه القيمة مستخدمة بالفعل.",
            details: target.map((field) => ({
              field,
              issue: `قيمة الحقل '${field}' مكررة وغير مسموح بها.`,
            })),
          },
        });
        return;
      }
      case "P2025": {
        // Record not found
        res.status(404).json({
          success: false,
          error: {
            code: "RESOURCE_NOT_FOUND",
            message: "المورد المطلوب غير موجود.",
          },
        });
        return;
      }
      default: {
        res.status(500).json({
          success: false,
          error: {
            code: "DATABASE_ERROR",
            message: "حدث خطأ في قاعدة البيانات.",
          },
        });
        return;
      }
    }
  }

  // ——— Prisma Validation Errors ———
  if (err instanceof Prisma.PrismaClientValidationError) {
    logger.error(`Prisma Validation Error: ${err.message}`);
    res.status(400).json({
      success: false,
      error: {
        code: "INVALID_INPUT_DATA",
        message: "البيانات المدخلة غير متوافقة مع هيكل قاعدة البيانات.",
      },
    });
    return;
  }

  // ——— Unknown / Unexpected Errors ———
  logger.error(`Unhandled Error: ${err.message}`, { stack: err.stack });

  res.status(500).json({
    success: false,
    error: {
      code: "SERVER_ERROR",
      message:
        process.env.NODE_ENV === "production"
          ? "حدث خطأ داخلي غير متوقع."
          : err.message,
    },
  });
};
