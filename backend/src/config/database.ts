/**
 * Database Configuration Factory
 * =============================
 * Initializes Prisma database connection
 * Supports PostgreSQL (primary) and MongoDB (optional)
 */

import { PrismaClient } from "@prisma/client";
import { initializePostgres } from "./postgres";
import logger from "../utils/logger";

let prisma: PrismaClient | null = null;

/**
 * Get or create Prisma client instance (Singleton)
 */
export const getPrisma = (): PrismaClient => {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
  }
  return prisma;
};

/**
 * Initialize the database connection
 * Sets up Prisma client and performs health check
 */
export const initializeDatabase = async (): Promise<PrismaClient> => {
  try {
    const client = getPrisma();

    // Test connection
    await client.$queryRaw`SELECT 1`;

    // Initialize PostgreSQL configuration
    await initializePostgres();

    logger.info("Database (Prisma) connected successfully");

    return client;
  } catch (error) {
    logger.error("Database initialization failed:", error);
    process.exit(1);
  }
};

/**
 * Disconnect Prisma client
 * Call this during server shutdown
 */
export const disconnectDatabase = async (): Promise<void> => {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
};
