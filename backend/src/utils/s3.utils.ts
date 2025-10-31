/**
 * AWS S3 Utilities
 * =================
 * Helper functions for S3 file operations
 */

import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  PutObjectCommandInput,
  GetObjectCommandInput,
  DeleteObjectCommandInput,
  ListObjectsV2CommandInput,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getS3Client, getS3Bucket } from "../config/s3.config";
import type {
  IS3UploadParams,
  IS3RetrieveParams,
  IS3SignedUrlParams,
  IS3ListParams,
} from "../types/storage.types";
import logger from "./logger";

/**
 * Upload file to S3
 */
export const uploadToS3 = async ({
  key,
  fileContent,
  contentType = "application/octet-stream",
  bucket,
  metadata,
}: IS3UploadParams): Promise<{ bucket: string; key: string; url: string }> => {
  const s3Client = getS3Client();
  const bucketName = bucket || getS3Bucket();

  try {
    const params: PutObjectCommandInput = {
      Bucket: bucketName,
      Key: key,
      Body: fileContent,
      ContentType: contentType,
      ...(metadata && { Metadata: metadata }),
    };

    const command = new PutObjectCommand(params);
    await s3Client.send(command);

    const url = `https://${bucketName}.s3.amazonaws.com/${key}`;
    logger.info(`✅ File uploaded successfully to S3: ${bucketName}/${key}`);

    return { bucket: bucketName, key, url };
  } catch (error) {
    logger.error("❌ Error uploading file to S3:", error);
    throw new Error(
      `Failed to upload file to S3: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};

/**
 * Retrieve file from S3
 */
export const retrieveFromS3 = async ({ key, bucket }: IS3RetrieveParams): Promise<Buffer> => {
  const s3Client = getS3Client();
  const bucketName = bucket || getS3Bucket();

  try {
    const params: GetObjectCommandInput = {
      Bucket: bucketName,
      Key: key,
    };

    const command = new GetObjectCommand(params);
    const response = await s3Client.send(command);

    // Convert stream to buffer
    const stream = response.Body as any;
    const chunks: Buffer[] = [];

    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }

    const data = Buffer.concat(chunks);
    logger.info(`✅ File retrieved from S3: ${key}`);

    return data;
  } catch (error) {
    logger.error("❌ Error retrieving file from S3:", error);
    throw new Error(
      `Failed to retrieve file from S3: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};

/**
 * Generate a pre-signed URL for file access
 */
export const generateSignedUrl = async ({
  key,
  bucket,
  expiresIn = 3600,
}: IS3SignedUrlParams): Promise<string> => {
  const s3Client = getS3Client();
  const bucketName = bucket || getS3Bucket();

  try {
    const params: GetObjectCommandInput = {
      Bucket: bucketName,
      Key: key,
    };

    const command = new GetObjectCommand(params);
    const url = await getSignedUrl(s3Client, command, { expiresIn });

    logger.info(`✅ Signed URL generated for: ${key}`);
    return url;
  } catch (error) {
    logger.error("❌ Error generating signed URL:", error);
    throw new Error(
      `Failed to generate signed URL: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};

/**
 * Delete file from S3
 */
export const deleteFromS3 = async ({ key, bucket }: IS3RetrieveParams): Promise<void> => {
  const s3Client = getS3Client();
  const bucketName = bucket || getS3Bucket();

  try {
    const params: DeleteObjectCommandInput = {
      Bucket: bucketName,
      Key: key,
    };

    const command = new DeleteObjectCommand(params);
    await s3Client.send(command);

    logger.info(`✅ File deleted from S3: ${key}`);
  } catch (error) {
    logger.error("❌ Error deleting file from S3:", error);
    throw new Error(
      `Failed to delete file from S3: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};

/**
 * List files in S3 bucket
 */
export const listS3Files = async ({
  prefix = "",
  bucket,
  maxKeys = 1000,
}: IS3ListParams = {}): Promise<string[]> => {
  const s3Client = getS3Client();
  const bucketName = bucket || getS3Bucket();

  try {
    const params: ListObjectsV2CommandInput = {
      Bucket: bucketName,
      Prefix: prefix,
      MaxKeys: maxKeys,
    };

    const command = new ListObjectsV2Command(params);
    const response = await s3Client.send(command);

    const files = response.Contents?.map((obj) => obj.Key || "") || [];
    logger.info(`✅ Listed ${files.length} files from S3`);

    return files;
  } catch (error) {
    logger.error("❌ Error listing files from S3:", error);
    throw new Error(
      `Failed to list files from S3: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};
