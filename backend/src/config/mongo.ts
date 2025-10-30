/**
 * MongoDB Database Configuration
 * ==============================
 * MongoDB initialization and connection setup
 * Note: This is a placeholder for MongoDB support - currently using Sequelize ORM
 */

import mongoose from "mongoose";
import { log } from "../utils/logger";

/**
 * Initialize MongoDB connection
 * This is optional and currently not being used with Sequelize
 */
export const initializeMongo = async (): Promise<mongoose.Connection> => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/lms";

    log.info("🔃 Connecting to MongoDB...");

    await mongoose.connect(mongoUri);

    log.info("✅ MongoDB connected successfully");

    return mongoose.connection;
  } catch (error) {
    log.error("❌ MongoDB connection failed", error as Error);
    process.exit(1);
  }
};

/**
 * Disconnect from MongoDB
 */
export const disconnectMongo = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    log.info("✅ MongoDB disconnected");
  } catch (error) {
    log.error("❌ Failed to disconnect MongoDB", error as Error);
  }
};
