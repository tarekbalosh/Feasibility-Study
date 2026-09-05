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
  corsOrigin: process.env.CORS_ORIGIN,

  // OpenAI
  openaiApiKey: process.env.OPENAI_API_KEY || "",

  // SMTP Email
  smtpHost: process.env.SMTP_HOST || "smtp.gmail.com",
  smtpPort: parseInt(process.env.SMTP_PORT || "587", 10),
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || "",

  // Frontend URL (for links)
  // النطاق الرسمي هو مشروع Vercel المربوط بالمستودع (feasibility-study-saas).
  // مشروع feasibility-study القديم لا يستقبل النشر، وكان يجعل روابط الدعوة
  // تصل إلى 404 لأن المسار /invite/accept غير موجود في نسخته المنشورة.
  frontendUrl:
    process.env.FRONTEND_URL || "https://feasibility-study-saas.vercel.app",

  // Brevo API (Sendinblue) - 300 free emails/day
  brevoApiKey: process.env.BREVO_API_KEY || "",

  // ——— عنوان المرسِل ———
  // مستقل عن SMTP_USER عمداً: الأخير بيانات اعتماد، وهذا هوية ظاهرة
  // للمستلم. فصلهما يسمح بالتحوّل إلى نطاق موثَّق (no-reply@yourdomain)
  // بتغيير متغيّر واحد، دون المساس بإعدادات الاتصال.
  // مهم: أي نطاق هنا يجب أن يكون موثَّقاً في Brevo (SPF + DKIM)، وإلا
  // فشل تحقّق DMARC وذهبت الرسائل إلى السبام.
  mailFrom: process.env.MAIL_FROM || process.env.SMTP_USER || "",
  mailFromName: process.env.MAIL_FROM_NAME || "Feasibility Suite",
  mailReplyTo: process.env.MAIL_REPLY_TO || "",
} as const;
