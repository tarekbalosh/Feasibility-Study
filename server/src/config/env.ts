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
} as const;

