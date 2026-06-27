import winston from "winston";

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true })
  ),
  transports: [
    // Console transport — colored for dev
    new winston.transports.Console({
      format: combine(colorize(), logFormat),
    }),
    // File transport — errors only
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      format: combine(winston.format.json()),
      maxsize: 5 * 1024 * 1024, // 5 MB
      maxFiles: 5,
    }),
    // File transport — all logs
    new winston.transports.File({
      filename: "logs/combined.log",
      format: combine(winston.format.json()),
      maxsize: 10 * 1024 * 1024, // 10 MB
      maxFiles: 5,
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: "logs/exceptions.log" }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: "logs/rejections.log" }),
  ],
});
