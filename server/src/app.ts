import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { rateLimiter } from "./middleware/rateLimiter";
import { errorHandler } from "./middleware/errorHandler";
import routes from "./routes";
import path from "path";
import { logger } from "./utils/logger";

const app = express();

// ——————————————————————————————————————————————
// Root & Health Routes
// ——————————————————————————————————————————————
app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'مرحبًا بك في واجهة برمجة تطبيقات دراسة الجدوى',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      api: '/api',
      auth: '/api/auth',
      users: '/api/users',
      projects: '/api/projects',
      reports: '/api/reports',
      feasibility: '/api/feasibility',
    },
  });
});

app.get('/health', (_req, res) => {
  res.status(200).json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
});

// ——————————————————————————————————————————————
// CORS — محدود للـ Frontend domain
// ——————————————————————————————————————————————
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ——————————————————————————————————————————————
// Body Parsing
// ——————————————————————————————————————————————
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ——————————————————————————————————————————————
// Logging
// ——————————————————————————————————————————————
app.use(
  morgan("combined", {
    stream: {
      write: (message: string) => logger.info(message.trim()),
    },
  })
);

// ——————————————————————————————————————————————
// Rate Limiting
// ——————————————————————————————————————————————
app.use(rateLimiter);

// ——————————————————————————————————————————————
// API Routes
// ——————————————————————————————————————————————
app.use("/api", routes);
// Serve static files (environment page)
app.use(express.static(path.join(__dirname, "public")));


// ——————————————————————————————————————————————
// 404 Handler
// ——————————————————————————————————————————————
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "RESOURCE_NOT_FOUND",
      message: "المسار المطلوب غير موجود.",
    },
  });
});

// ——————————————————————————————————————————————
// Global Error Handler
// ——————————————————————————————————————————————
app.use(errorHandler);

export default app;
