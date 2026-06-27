import { Request, Response, NextFunction } from 'express';

/**
 * Simple in‑memory rate limiter – 5 requests per hour per user.
 * The key can be a user ID, API‑key, or IP address. Adjust as needed.
 */
const LIMIT = 5; // requests
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

// Store timestamps per key
const requestMap: Map<string, number[]> = new Map();

export const rateLimiter = (keyGetter: (req: Request) => string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGetter(req);
    const now = Date.now();
    const timestamps = requestMap.get(key) ?? [];
    // Keep only timestamps within the window
    const recent = timestamps.filter((ts) => now - ts < WINDOW_MS);
    recent.push(now);
    requestMap.set(key, recent);

    if (recent.length > LIMIT) {
      res.status(429).json({
        message: 'تم تجاوز حد الطلبات المسموح به (5 طلبات/ساعة). يرجى المحاولة لاحقاً.',
      });
      return;
    }
    next();
  };
};

// Example usage for OpenAI routes (adjust import path as needed):
// import { rateLimiter } from '../middleware/rateLimiter';
// app.use('/api/openai', rateLimiter((req) => req.ip)); // or req.user.id if authenticated
