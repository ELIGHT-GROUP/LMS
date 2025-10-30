/**
 * Environment Configuration
 * ==========================
 * Environment variable validation and loading
 */

import fs from "fs";
import { log } from "../utils/logger";

/**
 * Validate required environment variables
 * Throws error if any required variable is missing
 */
export const validateEnv = (): void => {
  const requiredEnvKeys = [
    // Application Environment
    "PORT",
    "NODE_ENV",
    "ENCRYPTION_KEY",

    // JWT Configuration
    "JWT_SECRET",
    "JWT_EXPIRES_IN",

    // Database Type
    "DATABASE_TYPE",

    // Bucket provider
    "UPLOAD_PROVIDER",

    // PostgreSQL Configuration (if using postgres)
    "PG_USER",
    "PG_HOST",
    "PG_DB",
    "PG_PASS",
    "PG_PORT",
    "DB_SSL",

    // Cloudinary Configuration
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",

    // Optional configurations (commented out, uncomment as needed)
    // MongoDB Configuration
    // "MONGO_URI",

    // AWS S3 Configuration
    // "AWS_ACCESS_KEY_ID",
    // "AWS_SECRET_ACCESS_KEY",
    // "AWS_REGION",
    // "AWS_LOG_BUCKET",

    // Redis Configuration
    // "REDIS_HOST",
    // "REDIS_PORT",

    // Brevo SMTP Configuration
    // "BREVO_SMTP_HOST",
    // "BREVO_SMTP_PORT",
    // "BREVO_SMTP_USER",
    // "BREVO_SMTP_PASSWORD",
    // "BREVO_FROM_EMAIL",

    // Dialog SMS Configuration
    // "DIALOG_BASE_URL",
    // "DIALOG_USERNAME",
    // "DIALOG_PASSWORD",
    // "LOGIN_ENDPOINT",
    // "SMS_ENDPOINT",

    // Firebase Configuration
    // "FIREBASE_SERVICE_ACCOUNT",

    // Security Configuration
    // "RATE_LIMIT_MAX",
  ];

  log.info("🔍 Starting environment variable validation...");

  const missingKeys = requiredEnvKeys.filter((key) => !process.env[key]);

  if (missingKeys.length > 0) {
    missingKeys.forEach((key) => {
      log.error(`❌ Missing required environment variable: ${key}`);
    });
    log.info("📌 Please ensure your .env file is properly configured");
    process.exit(1);
  }

  // Load Firebase service account if provided
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const filePath = process.env.FIREBASE_SERVICE_ACCOUNT;
      const firebaseConfig = JSON.parse(fs.readFileSync(filePath, "utf8"));
      log.info("✅ Firebase service account loaded successfully");
    } catch (error) {
      log.error("❌ Failed to load Firebase service account", error as Error);
      process.exit(1);
    }
  }

  log.info("✅ All environment variables validated successfully");
};

/**
 * Get environment variable with type safety
 */
export const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key];
  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${key} is not defined`);
  }
  return value || defaultValue || "";
};

/**
 * Get environment variable as number
 */
export const getEnvNumber = (key: string, defaultValue?: number): number => {
  const value = process.env[key];
  if (!value && defaultValue === undefined) {
    throw new Error(`Environment variable ${key} is not defined`);
  }
  return value ? parseInt(value, 10) : defaultValue || 0;
};

/**
 * Get environment variable as boolean
 */
export const getEnvBoolean = (key: string, defaultValue: boolean = false): boolean => {
  const value = process.env[key];
  if (!value) {
    return defaultValue;
  }
  return value.toLowerCase() === "true" || value === "1";
};

/**
 * Check if application is in production mode
 */
export const isProduction = (): boolean => {
  return process.env.NODE_ENV === "production";
};

/**
 * Check if application is in development mode
 */
export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === "development";
};
