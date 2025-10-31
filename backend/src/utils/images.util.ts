/**
 * Image Upload Utilities
 * =======================
 * Unified interface for uploading images to Cloudinary or S3
 * based on the configured upload provider
 */

import { uploadToCloudinary } from "./cloudinary.utils";
import { uploadToS3 } from "./s3.utils";
import { getUploadProvider } from "../config/bucket.config";
import type {
  IImageUploadParams,
  IImageUploadResponse,
  ICloudinaryUploadParams,
  IS3UploadParams,
} from "../types/storage.types";
import logger from "./logger";

/**
 * Upload image using the configured provider
 * Automatically selects between Cloudinary and S3
 */
export const uploadImage = async ({
  file,
  filename,
  folder,
  contentType = "image/jpeg",
  metadata,
  tags,
}: IImageUploadParams): Promise<IImageUploadResponse> => {
  const provider = getUploadProvider();

  try {
    if (provider === "cloudinary") {
      // Upload to Cloudinary
      const cloudinaryParams: ICloudinaryUploadParams = {
        file,
        folder,
        publicId: filename,
        resourceType: "image",
        tags,
      };

      const result = await uploadToCloudinary(cloudinaryParams);

      logger.info(`✅ Image uploaded to Cloudinary: ${result.secure_url}`);

      return {
        url: result.secure_url,
        publicId: result.public_id,
        provider: "cloudinary",
        width: result.width,
        height: result.height,
        format: result.format,
      };
    } else if (provider === "s3") {
      // Upload to S3
      if (!filename) {
        throw new Error("Filename is required for S3 uploads");
      }

      const key = folder ? `${folder}/${filename}` : filename;

      const s3Params: IS3UploadParams = {
        key,
        fileContent: file as Buffer,
        contentType,
        metadata,
      };

      const result = await uploadToS3(s3Params);

      logger.info(`✅ Image uploaded to S3: ${result.url}`);

      return {
        url: result.url,
        key: result.key,
        provider: "s3",
      };
    } else {
      throw new Error(`Unsupported upload provider: ${provider}`);
    }
  } catch (error) {
    logger.error("❌ Error uploading image:", error);
    throw new Error(
      `Failed to upload image: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};

/**
 * Upload multiple images
 */
export const uploadMultipleImages = async (
  images: IImageUploadParams[]
): Promise<IImageUploadResponse[]> => {
  try {
    const uploadPromises = images.map((image) => uploadImage(image));
    const results = await Promise.all(uploadPromises);

    logger.info(`✅ Uploaded ${results.length} images successfully`);
    return results;
  } catch (error) {
    logger.error("❌ Error uploading multiple images:", error);
    throw error;
  }
};

/**
 * Generate thumbnail filename
 */
export const generateThumbnailFilename = (originalFilename: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalFilename.split(".").pop();
  const nameWithoutExtension = originalFilename.replace(/\.[^/.]+$/, "");

  return `${nameWithoutExtension}-thumb-${timestamp}-${random}.${extension}`;
};

/**
 * Validate image file
 */
export const validateImageFile = (
  file: Buffer,
  options: {
    maxSizeInMB?: number;
    allowedFormats?: string[];
  } = {}
): { valid: boolean; error?: string } => {
  const { maxSizeInMB = 10, allowedFormats = ["jpg", "jpeg", "png", "gif", "webp"] } = options;

  // Check file size
  const fileSizeInMB = file.length / (1024 * 1024);
  if (fileSizeInMB > maxSizeInMB) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeInMB}MB limit`,
    };
  }

  // Check file format (magic numbers)
  const fileSignature = file.slice(0, 4).toString("hex");
  const formatMap: Record<string, string> = {
    "89504e47": "png",
    "47494638": "gif",
    ffd8ffe0: "jpg",
    ffd8ffe1: "jpg",
    ffd8ffe2: "jpg",
    ffd8ffe3: "jpg",
    ffd8ffe8: "jpg",
    "52494646": "webp",
  };

  const detectedFormat = formatMap[fileSignature];
  if (!detectedFormat || !allowedFormats.includes(detectedFormat)) {
    return {
      valid: false,
      error: `Invalid file format. Allowed formats: ${allowedFormats.join(", ")}`,
    };
  }

  return { valid: true };
};
