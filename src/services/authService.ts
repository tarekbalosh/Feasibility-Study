import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { Request, Response } from 'express';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../utils/jwt';
import nodemailer from 'nodemailer';

// Placeholder User type and DB operations – replace with your actual ORM/ODM
interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  refreshTokenHash?: string;
  resetPasswordTokenHash?: string;
  resetPasswordExpires?: Date;
  lastLoginAt?: Date;
}

// Simulated in‑memory store for demonstration (replace with real DB calls)
const users: Map<string, User> = new Map();

/** Utility to find a user by email (case‑insensitive) */
const findUserByEmail = async (email: string): Promise<User | undefined> => {
  const lower = email.toLowerCase();
  return Array.from(users.values()).find(u => u.email.toLowerCase() === lower);
};

/** Utility to store a user */
const createUser = async (user: User): Promise<User> => {
  users.set(user.id, user);
  return user;
};

/** Utility to update a user */
const updateUser = async (user: User): Promise<User> => {
  users.set(user.id, user);
  return user;
};

/** Generate a secure random identifier */
const generateId = () => crypto.randomBytes(16).toString('hex');

/** Generic error to avoid leaking whether an e‑mail exists */
class AuthError extends Error {
  constructor(message = 'Invalid credentials') {
    super(message);
    this.name = 'AuthError';
  }
}

/** Register a new user */
export const register = async (
  name: string,
  email: string,
  password: string,
  res: Response
) => {
  // Ensure the e‑mail is not already taken – generic error on conflict
  const existing = await findUserByEmail(email);
  if (existing) {
    throw new AuthError('Invalid credentials');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user: User = {
    id: generateId(),
    name,
    email,
    passwordHash,
  };
  await createUser(user);

  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  // Store hashed refresh token for later verification (optional security layer)
  user.refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  await updateUser(user);

  // Set httpOnly cookie for refresh token
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return {
    accessToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  };
};

/** Login existing user */
export const login = async (
  email: string,
  password: string,
  res: Response
) => {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new AuthError();
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new AuthError();
  }

  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  // Update hashed refresh token and last login timestamp
  user.refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  user.lastLoginAt = new Date();
  await updateUser(user);

  // HttpOnly cookie for refresh token
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return {
    accessToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  };
};

/** Refresh access token using a valid refresh token */
export const refreshToken = async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    throw new AuthError();
  }

  const payload = verifyToken(token);
  if (!payload || typeof payload !== 'object' || !('userId' in payload)) {
    throw new AuthError();
  }

  // Verify stored hash matches the presented token (optional extra check)
  const user = users.get(String(payload.userId));
  if (!user || !user.refreshTokenHash) {
    throw new AuthError();
  }
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  if (tokenHash !== user.refreshTokenHash) {
    throw new AuthError();
  }

  // Issue new access token (do NOT rotate refresh token here)
  const newAccess = generateAccessToken(user.id);

  return { accessToken: newAccess };
};

/** Send password‑reset e‑mail */
export const forgotPassword = async (email: string) => {
  const user = await findUserByEmail(email);
  // Always respond as if the e‑mail was sent to avoid enumeration
  if (!user) {
    return;
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  user.resetPasswordTokenHash = tokenHash;
  user.resetPasswordExpires = expires;
  await updateUser(user);

  // Configure a simple transporter – replace with real credentials
  const transporter = nodemailer.createTransport({
    // Example using Gmail – configure per your environment
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: 'Password Reset Request',
    text: `You requested a password reset. Click the link to reset your password (valid for 1 hour): ${resetUrl}`,
  };

  await transporter.sendMail(mailOptions);
};

/** Reset password using a valid token */
export const resetPassword = async (token: string, newPassword: string) => {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const user = Array.from(users.values()).find(
    u => u.resetPasswordTokenHash === tokenHash && u.resetPasswordExpires && u.resetPasswordExpires > new Date()
  );
  if (!user) {
    throw new AuthError('Invalid or expired reset token');
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  user.passwordHash = passwordHash;
  // Invalidate the reset token
  delete user.resetPasswordTokenHash;
  delete user.resetPasswordExpires;
  await updateUser(user);
};
