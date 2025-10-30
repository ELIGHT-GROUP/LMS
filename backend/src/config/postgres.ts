/**
 * PostgreSQL Database Configuration for Prisma
 * ============================================
 * Prisma handles connection pooling automatically
 * Connection string is read from DATABASE_URL env variable
 */

import logger from "../utils/logger";

/**
 * Initialize PostgreSQL connection via Prisma
 * Prisma client initialization happens in database.ts
 */
export const initializePostgres = async (): Promise<void> => {
  try {
    logger.info("PostgreSQL configured for Prisma ORM");
  } catch (error) {
    logger.error("PostgreSQL configuration error:", error);
    throw error;
  }
};
