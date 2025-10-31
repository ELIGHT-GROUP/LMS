/**
 * Application Entry Point
 * =======================
 * Server startup and initialization
 */

import dotenv from "dotenv";
import app from "./app";
import logger from "./utils/logger";
import { initializeDatabase } from "./config/database";
import { initializeModels } from "./models";
import { initializeUploadProvider } from "./config/bucket.config";
import { validateEnv } from "./config/env";

/**
 * Load environment variables from .env file
 */
dotenv.config();

/**
 * Start the server
 */
const startServer = async (): Promise<void> => {
  try {
    logger.info("Starting LMS Backend Server...");

    // Validate environment variables
    logger.info("1. Validating environment variables...");
    validateEnv();

    // Initialize database connection
    logger.info("2. Initializing database connection...");
    await initializeDatabase();

    // Initialize models
    logger.info("3. Initializing database models...");
    await initializeModels();

    // Configure storage provider
    logger.info("4. Configuring storage provider...");
    initializeUploadProvider();

    // Start Express server
    const PORT = process.env.PORT || 8080;
    const server = app.listen(PORT, () => {
      logger.info(`Server is running in ${process.env.NODE_ENV || "development"} mode`);
      logger.info(`Server URL: http://localhost:${PORT}`);
      logger.info(`API Documentation: http://localhost:${PORT}/api`);
      logger.info(`Health Check: http://localhost:${PORT}/health-check`);
    });

    /**
     * Handle graceful shutdown
     */
    process.on("SIGTERM", () => {
      logger.info("SIGTERM signal received: closing HTTP server");
      server.close(() => {
        logger.info("HTTP server closed");
        process.exit(0);
      });
    });

    process.on("SIGINT", () => {
      logger.info("SIGINT signal received: closing HTTP server");
      server.close(() => {
        logger.info("HTTP server closed");
        process.exit(0);
      });
    });

    /**
     * Handle uncaught exceptions
     */
    process.on("uncaughtException", (error: Error) => {
      logger.error("Uncaught Exception:", error);
      process.exit(1);
    });

    /**
     * Handle unhandled promise rejections
     */
    process.on("unhandledRejection", (reason: unknown) => {
      logger.error("Unhandled Rejection:", reason);
      process.exit(1);
    });
  } catch (error) {
    logger.error("Server failed to start:", error);
    process.exit(1);
  }
};

// Execute server startup
startServer();
