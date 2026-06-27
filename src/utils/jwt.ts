import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_EXPIRES_IN = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRES_IN = '7d'; // 7 days

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_to_a_strong_secret';

/** Generate a JWT access token containing the user ID */
export const generateAccessToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
};

/** Generate a JWT refresh token containing the user ID */
export const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
};

/** Verify a JWT and return its payload or null if invalid/expired */
export const verifyToken = (token: string): any | null => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
};
