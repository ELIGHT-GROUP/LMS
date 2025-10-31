/**
 * Cloudinary Configuration
 * =========================
 * Image and video upload service configuration
 */

import { v2 as cloudinary } from "cloudinary";
import logger from "../utils/logger";

let isConfigured = false;

/**
 * Configure Cloudinary with environment variables
 */
export const configureCloudinary = (): void => {
  if (isConfigured) {
    logger.warn("Cloudinary is already configured");
    return;
  }

  const requiredEnvVars = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"];

  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(`Missing required Cloudinary environment variables: ${missingVars.join(", ")}`);
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  isConfigured = true;
  logger.info("✅ Cloudinary configured successfully");
};

/**
 * Get Cloudinary instance
 */
export const getCloudinaryInstance = () => {
  if (!isConfigured) {
    configureCloudinary();
  }
  return cloudinary;
};
