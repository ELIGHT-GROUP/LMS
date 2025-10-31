/**
 * Storage & Upload Type Definitions
 * ==================================
 * Shared interfaces for file upload operations
 */

/**
 * Upload Provider Type
 */
export type UploadProvider = "cloudinary" | "s3";

/**
 * S3 Upload Parameters
 */
export interface IS3UploadParams {
  key: string;
  fileContent: Buffer | string;
  contentType?: string;
  bucket?: string;
  metadata?: Record<string, string>;
}

/**
 * S3 Retrieve Parameters
 */
export interface IS3RetrieveParams {
  key: string;
  bucket?: string;
}

/**
 * S3 Signed URL Parameters
 */
export interface IS3SignedUrlParams {
  key: string;
  bucket?: string;
  expiresIn?: number; // seconds
}

/**
 * S3 List Parameters
 */
export interface IS3ListParams {
  prefix?: string;
  bucket?: string;
  maxKeys?: number;
}

/**
 * Cloudinary Upload Parameters
 */
export interface ICloudinaryUploadParams {
  file: Buffer | string;
  folder?: string;
  publicId?: string;
  resourceType?: "image" | "video" | "raw" | "auto";
  transformation?: ICloudinaryTransformParams | ICloudinaryTransformParams[];
  tags?: string[];
}

/**
 * Cloudinary Delete Parameters
 */
export interface ICloudinaryDeleteParams {
  publicId: string;
  resourceType?: "image" | "video" | "raw";
}

/**
 * Cloudinary Transform Parameters (for upload transformation)
 */
export interface ICloudinaryTransformParams {
  width?: number;
  height?: number;
  crop?: "scale" | "fit" | "limit" | "fill" | "thumb" | "crop";
  quality?: number | "auto";
  format?: string;
  gravity?: "auto" | "face" | "center" | "north" | "south" | "east" | "west";
  radius?: number | "max";
  effect?: string;
  overlay?: string;
  [key: string]: string | number | undefined;
}

/**
 * Cloudinary URL Generation Parameters
 */
export interface ICloudinaryUrlParams {
  publicId: string;
  transformation?: ICloudinaryTransformParams | ICloudinaryTransformParams[];
  resourceType?: "image" | "video" | "raw";
}

/**
 * Unified Image Upload Parameters
 */
export interface IImageUploadParams {
  file: Buffer | string;
  filename?: string;
  folder?: string;
  contentType?: string;
  metadata?: Record<string, string>;
  tags?: string[];
}

/**
 * Image Upload Response
 */
export interface IImageUploadResponse {
  url: string;
  publicId?: string;
  key?: string;
  provider: "cloudinary" | "s3";
  width?: number;
  height?: number;
  format?: string;
}
