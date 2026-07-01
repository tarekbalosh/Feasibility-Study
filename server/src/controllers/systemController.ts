import { Request, Response } from 'express';
import { env } from '../config/env';
import { getEnvironmentInfo } from '../config/environment';

// GET /api/system/environment
export const getEnvironment = (req: Request, res: Response) => {
  const allowed = env.NODE_ENV === 'development' || env.ADMIN_DEBUG === 'true';
  if (!allowed) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const data = getEnvironmentInfo();
  return res.json(data);
};
