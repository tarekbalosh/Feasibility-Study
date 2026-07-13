import { config } from "./index";

export const env = {
  PORT: config.port,
  NODE_ENV: config.nodeEnv,
  DATABASE_URL: config.databaseUrl,
  JWT_SECRET: config.jwtSecret,
  JWT_REFRESH_SECRET: config.jwtRefreshSecret,
  JWT_EXPIRES_IN: config.jwtExpiresIn,
  JWT_REFRESH_EXPIRES_IN: config.jwtRefreshExpiresIn,
  CORS_ORIGIN: config.corsOrigin,
  ADMIN_DEBUG: process.env.ADMIN_DEBUG,
  OPENAI_API_KEY: config.openaiApiKey,
  SMTP_HOST: config.smtpHost,
  SMTP_PORT: config.smtpPort,
  SMTP_USER: config.smtpUser,
  SMTP_PASS: config.smtpPass,
  FRONTEND_URL: config.frontendUrl,
  BREVO_API_KEY: config.brevoApiKey,
} as const;

