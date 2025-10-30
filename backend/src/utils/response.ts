/**
 * Response Utility Functions
 * ============================
 * Standardized response handlers for API endpoints
 * Ensures consistent response format across the application
 */

import { Response } from "express";
import type { IApiResponse } from "../types";
import {
  BadRequestError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
  AppError,
} from "./errors";
import logger from "./logger";

/**
 * Send a standardized response to the client
 */
const sendResponse = <T = any>(
  res: Response,
  statusCode: number,
  message: string,
  data?: T
): Response => {
  const responsePayload: IApiResponse<T> = {
    success: statusCode >= 200 && statusCode < 300,
    message,
    data,
  };

  logger.info(`Response ${statusCode}: ${message}`);
  return res.status(statusCode).json(responsePayload);
};

/**
 * Send a success response (200 OK)
 */
export const successResponse = <T = any>(
  res: Response,
  message: string,
  data?: T,
  statusCode: number = 200
): Response => {
  return sendResponse<T>(res, statusCode, message, data);
};

/**
 * Send a created response (201 Created)
 */
export const createdResponse = <T = any>(res: Response, message: string, data?: T): Response => {
  return sendResponse<T>(res, 201, message, data);
};

/**
 * Send a bad request response (400)
 */
export const badRequestResponse = (
  res: Response,
  message: string = "Invalid request"
): Response => {
  return sendResponse(res, 400, message);
};

/**
 * Send an unauthorized response (401)
 */
export const unauthorizedResponse = (res: Response, message: string = "Unauthorized"): Response => {
  return sendResponse(res, 401, message);
};

/**
 * Send a forbidden response (403)
 */
export const forbiddenResponse = (res: Response, message: string = "Forbidden"): Response => {
  return sendResponse(res, 403, message);
};

/**
 * Send a not found response (404)
 */
export const notFoundResponse = (res: Response, message: string = "Not found"): Response => {
  return sendResponse(res, 404, message);
};

/**
 * Send a server error response (500)
 */
export const serverErrorResponse = (res: Response, message: string = "Server error"): Response => {
  return sendResponse(res, 500, message);
};

/**
 * Handle and send error responses based on error type
 */
export const handleErrorResponse = (res: Response, error: unknown): Response => {
  if (error instanceof InternalServerError) {
    logger.error("Internal Server Error:", error);
    return serverErrorResponse(res, error.message);
  }

  if (error instanceof BadRequestError) {
    logger.warn("Bad Request Error:", error);
    return badRequestResponse(res, error.message);
  }

  if (error instanceof UnauthorizedError) {
    logger.warn("Unauthorized Error:", error);
    return unauthorizedResponse(res, error.message);
  }

  if (error instanceof NotFoundError) {
    logger.warn("Not Found Error:", error);
    return notFoundResponse(res, error.message);
  }

  if (error instanceof ForbiddenError) {
    logger.warn("Forbidden Error:", error);
    return forbiddenResponse(res, error.message);
  }

  if (error instanceof AppError) {
    logger.error("App Error:", error);
    return sendResponse(res, error.statusCode, error.message);
  }

  if (error instanceof Error) {
    logger.error("Unknown Error:", error);
    return serverErrorResponse(res, error.message || "An unexpected error occurred");
  }

  logger.error("Unknown error occurred:", error);
  return serverErrorResponse(res, "An unexpected error occurred");
};
