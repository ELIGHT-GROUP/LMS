/**
 * Validation Middleware
 * =====================
 * Zod-based request validation middleware
 * Provides type-safe validation for request body, query, and params
 */

import { z } from "zod";
import { Request, Response, NextFunction } from "express";
import { badRequestResponse } from "../utils/response";
import logger from "../utils/logger";

/**
 * Validation target type
 */
type ValidationTarget = "body" | "query" | "params";

/**
 * Generic validation middleware factory
 * Validates request data against Zod schema
 */
export const validate = (schema: z.ZodSchema, target: ValidationTarget = "body") => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Select data source based on target
      const dataToValidate = req[target];

      // Parse and validate
      const validatedData = schema.parse(dataToValidate);

      // Replace request data with validated data (type-safe)
      req[target] = validatedData;

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Format validation errors
        const errors = error.issues.map((err) => ({
          field: err.path.join(".") || "unknown",
          message: err.message,
        }));

        const errorMessage = errors.map((e) => `${e.field}: ${e.message}`).join(", ");

        logger.warn("Validation failed:", { errors, path: req.path });

        badRequestResponse(res, errorMessage || "Validation failed");
        return;
      }

      // Unknown error
      logger.error("Unexpected validation error:", error);
      badRequestResponse(res, "Validation error occurred");
    }
  };
};

/**
 * Validate request body
 */
export const validateBody = (schema: z.ZodSchema) => validate(schema, "body");

/**
 * Validate query parameters
 */
export const validateQuery = (schema: z.ZodSchema) => validate(schema, "query");

/**
 * Validate route parameters
 */
export const validateParams = (schema: z.ZodSchema) => validate(schema, "params");
