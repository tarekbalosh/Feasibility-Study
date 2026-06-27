import dotenv from "dotenv";
dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || "5000", 10),
  nodeEnv: process.env.NODE_ENV || "development",

  // Database
  databaseUrl: process.env.DATABASE_URL || "",

  // JWT
  jwtSecret: process.env.JWT_SECRET || "default_jwt_secret",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "default_refresh_secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1h",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:4000",

  // OpenAI
  openaiApiKey: process.env.OPENAI_API_KEY || "",
} as const;
