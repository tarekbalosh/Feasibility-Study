import app from "./app";
import { config } from "./config";
import { prisma } from "./config/prisma";
import { logger } from "./utils/logger";

async function main() {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info("✅ Connected to PostgreSQL database");

    // Start server
    app.listen(config.port, () => {
      logger.info(`🚀 Server is running on http://localhost:${config.port}`);
      logger.info(`📌 Environment: ${config.nodeEnv}`);
      logger.info(`🔗 CORS Origin: ${config.corsOrigin}`);
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
