/**
 * Cloudinary Utilities
 * =====================
 * Helper functions for Cloudinary image/video operations
 */

import { UploadApiResponse, UploadApiOptions } from "cloudinary";
import { getCloudinaryInstance } from "../config/cloudinary.config";
import type {
  ICloudinaryUploadParams,
  ICloudinaryDeleteParams,
  ICloudinaryUrlParams,
} from "../types/storage.types";
import logger from "./logger";

/**
 * Upload file to Cloudinary
 */

export const uploadToCloudinary = async ({
  file,
  folder,
  publicId,
  resourceType = "auto",
  transformation,
  tags,
}: ICloudinaryUploadParams): Promise<UploadApiResponse> => {
  const cloudinary = getCloudinaryInstance();

  return new Promise((resolve, reject) => {
    const options: UploadApiOptions = {
      folder,
      public_id: publicId,
      resource_type: resourceType,
      transformation,
      tags,
    };

    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        logger.error("❌ Error uploading to Cloudinary:", error);
        return reject(error);
      }
      if (result) {
        logger.info(`✅ File uploaded to Cloudinary: ${result.secure_url}`);
        resolve(result);
      } else {
        reject(new Error("Upload failed with no result"));
      }
    });

    // Handle different file types
    if (Buffer.isBuffer(file)) {
      uploadStream.end(file);
    } else {
      // If it's a base64 string or file path
      cloudinary.uploader.upload(file, options, (error, result) => {
        if (error) {
          logger.error("❌ Error uploading to Cloudinary:", error);
          return reject(error);
        }
        if (result) {
          logger.info(`✅ File uploaded to Cloudinary: ${result.secure_url}`);
          resolve(result);
        }
      });
    }
  });
};

/**
 * Delete file from Cloudinary
 */
export const deleteFromCloudinary = async ({
  publicId,
  resourceType = "image",
}: ICloudinaryDeleteParams): Promise<void> => {
  const cloudinary = getCloudinaryInstance();

  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    logger.info(`✅ File deleted from Cloudinary: ${publicId}`);
  } catch (error) {
    logger.error("❌ Error deleting from Cloudinary:", error);
    throw new Error(
      `Failed to delete from Cloudinary: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

/**
 * Generate transformation URL for Cloudinary image
 */
export const generateCloudinaryUrl = ({
  publicId,
  transformation,
  resourceType = "image",
}: ICloudinaryUrlParams): string => {
  const cloudinary = getCloudinaryInstance();

  return cloudinary.url(publicId, {
    resource_type: resourceType,
    transformation,
  });
};

/**
 * Upload multiple files to Cloudinary
 */
export const uploadMultipleToCloudinary = async (
  files: ICloudinaryUploadParams[]
): Promise<UploadApiResponse[]> => {
  try {
    const uploadPromises = files.map((file) => uploadToCloudinary(file));
    const results = await Promise.all(uploadPromises);
    logger.info(`✅ Uploaded ${results.length} files to Cloudinary`);
    return results;
  } catch (error) {
    logger.error("❌ Error uploading multiple files to Cloudinary:", error);
    throw error;
  }
};
