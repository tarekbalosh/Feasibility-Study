import app from "./app";
import { env } from "./config/env";
import { prisma } from "./config/prisma";
import { logger } from "./utils/logger";

async function main() {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info("✅ Connected to PostgreSQL database");

    // Start server
    app.listen(env.PORT, () => {
      logger.info(`🚀 Server is running on port ${env.PORT}`);
      logger.info(`📌 Environment: ${env.NODE_ENV}`);
      logger.info(`🔗 CORS Origin: ${env.CORS_ORIGIN}`);
    });
  } catch (error) {
    logger.error("❌ Failed to start server:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  logger.info("🛑 SIGINT received. Shutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  logger.info("🛑 SIGTERM received. Shutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});

main();
