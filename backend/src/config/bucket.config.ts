/**
 * Storage/Bucket Configuration
 * ============================
 * Handles file upload provider configuration (Cloudinary or AWS S3)
 */

import type { UploadProvider } from "../types/storage.types";
import logger from "../utils/logger";

let uploadProvider: UploadProvider | null = null;

/**
 * Get upload provider from environment
 */
const getProviderFromEnv = (): UploadProvider => {
  const provider = process.env.UPLOAD_PROVIDER?.toLowerCase();

  if (!provider) {
    logger.warn("UPLOAD_PROVIDER not set, defaulting to 'cloudinary'");
    return "cloudinary";
  }

  if (provider !== "cloudinary" && provider !== "s3") {
    logger.warn(`Invalid UPLOAD_PROVIDER '${provider}', defaulting to 'cloudinary'`);
    return "cloudinary";
  }

  return provider as UploadProvider;
};

/**
 * Initialize upload provider
 */
export const initializeUploadProvider = (): UploadProvider => {
  if (uploadProvider) {
    return uploadProvider;
  }

  uploadProvider = getProviderFromEnv();
  logger.info(`✅ Upload provider set to: ${uploadProvider}`);
  return uploadProvider;
};

/**
 * Get current upload provider
 */
export const getUploadProvider = (): UploadProvider => {
  if (!uploadProvider) {
    return initializeUploadProvider();
  }
  return uploadProvider;
};

export default { initializeUploadProvider, getUploadProvider };
