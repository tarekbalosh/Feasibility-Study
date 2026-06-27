import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { ApiError } from "../utils/ApiError";

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
      };
    }
  }
}

interface JwtPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

/**
 * Middleware للتحقق من JWT Token
 * يستخرج الـ token من Authorization header ويرفقه بالـ request
 */
export const authMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw ApiError.authRequired("لم يتم تمرير رمز الدخول في الترويسة.");
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      throw ApiError.authRequired("رمز الدخول غير صالح.");
    }

    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    };

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
      return;
    }

    if (error instanceof jwt.TokenExpiredError) {
      next(ApiError.authExpired());
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      next(ApiError.authRequired("رمز الدخول غير صالح أو تالف."));
      return;
    }

    next(ApiError.internal());
  }
};
