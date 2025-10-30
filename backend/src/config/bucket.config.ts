/**
 * Storage/Bucket Configuration
 * ============================
 * Handles file upload provider configuration (Cloudinary or AWS S3)
 */

import { log } from "../utils/logger";

export type UploadProvider = "cloudinary" | "s3";

const UPLOAD_PROVIDER: UploadProvider =
  (process.env.UPLOAD_PROVIDER as UploadProvider) || "cloudinary";

let cloudinaryClient: any = null;
let s3Client: any = null;

/**
 * Configure storage provider
 */
export const configureStorage = async (): Promise<void> => {
  try {
    if (UPLOAD_PROVIDER === "cloudinary") {
      await configureCloudinary();
      log.info("✅ Cloudinary storage configured");
    } else if (UPLOAD_PROVIDER === "s3") {
      await configureS3();
      log.info("✅ AWS S3 storage configured");
    } else {
      log.error(`❌ Unknown upload provider: ${UPLOAD_PROVIDER}`);
      throw new Error(`Unknown upload provider: ${UPLOAD_PROVIDER}`);
    }
  } catch (error) {
    log.error("❌ Storage configuration failed", error as Error);
    throw error;
  }
};

/**
 * Configure Cloudinary
 */
const configureCloudinary = async (): Promise<void> => {
  try {
    // @ts-ignore - Cloudinary doesn't have TypeScript definitions
    const cloudinary = (await import("cloudinary")) as any;
    cloudinary.v2.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    cloudinaryClient = cloudinary.v2;
    log.info("✅ Cloudinary configured successfully");
  } catch (error) {
    log.error("❌ Cloudinary configuration failed", error as Error);
    throw error;
  }
};

/**
 * Configure AWS S3
 */
const configureS3 = async (): Promise<void> => {
  try {
    const { S3Client } = await import("@aws-sdk/client-s3");
    s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
    });
    log.info("✅ AWS S3 configured successfully");
  } catch (error) {
    log.error("❌ AWS S3 configuration failed", error as Error);
    throw error;
  }
};

/**
 * Get Cloudinary client
 */
export const getCloudinary = (): any => {
  if (!cloudinaryClient) {
    throw new Error("Cloudinary not configured");
  }
  return cloudinaryClient;
};

/**
 * Get S3 client
 */
export const getS3 = (): any => {
  if (!s3Client) {
    throw new Error("S3 not configured");
  }
  return s3Client;
};

/**
 * Get current upload provider
 */
export const getUploadProvider = (): UploadProvider => {
  return UPLOAD_PROVIDER;
};
