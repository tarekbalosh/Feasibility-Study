import { Request, Response, NextFunction } from "express";
import { validationResult, ValidationChain } from "express-validator";

/**
 * Middleware للتحقق من صحة البيانات
 * يشغّل express-validator checks ويعيد INVALID_INPUT_DATA عند الفشل
 */
export const validateRequest = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Run all validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);

    if (errors.isEmpty()) {
      return next();
    }

    const details = errors.array().map((err) => ({
      field: (err as any).path || (err as any).param || "unknown",
      issue: err.msg,
    }));

    res.status(400).json({
      success: false,
      error: {
        code: "INVALID_INPUT_DATA",
        message: "البيانات المدخلة غير صحيحة، يرجى التحقق من القيم وإعادة المحاولة.",
        details,
      },
    });
  };
};
