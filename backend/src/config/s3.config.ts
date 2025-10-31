/**
 * AWS S3 Configuration
 * =====================
 * AWS S3 client configuration for file storage
 */

import { S3Client } from "@aws-sdk/client-s3";
import logger from "../utils/logger";

let s3Client: S3Client | null = null;
let bucketName: string | null = null;

/**
 * Configure AWS S3 client
 */
export const configureS3 = (): void => {
  if (s3Client) {
    logger.warn("S3 client is already configured");
    return;
  }

  const requiredEnvVars = [
    "AWS_REGION",
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "AWS_S3_BUCKET",
  ];

  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(`Missing required AWS S3 environment variables: ${missingVars.join(", ")}`);
  }

  const region = process.env.AWS_REGION!;
  const endpoint = process.env.AWS_S3_ENDPOINT; // For LocalStack or custom S3-compatible storage

  s3Client = new S3Client({
    region,
    ...(endpoint && { endpoint }),
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  bucketName = process.env.AWS_S3_BUCKET!;
  logger.info(`✅ AWS S3 configured successfully (Region: ${region}, Bucket: ${bucketName})`);
};

/**
 * Get S3 client instance
 */
export const getS3Client = (): S3Client => {
  if (!s3Client) {
    configureS3();
  }
  return s3Client!;
};

/**
 * Get S3 bucket name
 */
export const getS3Bucket = (): string => {
  if (!bucketName) {
    configureS3();
  }
  return bucketName!;
};
