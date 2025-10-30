/**
 * Async Error Handler Middleware
 * ==============================
 * Wraps async route handlers to catch errors and pass to error handler
 * Eliminates the need for try-catch in every route handler
 */

import { Request, Response, NextFunction } from "express";
import type { IAuthenticatedRequest } from "../types";
import logger from "../utils/logger";

/**
 * Async handler wrapper for Express route handlers
 * Catches any errors thrown in async functions and passes to error handler
 *
 * Usage:
 * router.get('/path', asyncHandler(async (req, res, next) => {
 *   // Your async code here
 *   // Errors will be automatically caught
 * }));
 *
 * @param fn - Async route handler function
 * @returns Express middleware that handles async errors
 */
export const asyncHandler = (
  fn: (
    req: IAuthenticatedRequest | Request,
    res: Response,
    next: NextFunction
  ) => Promise<void> | void
) => {
  return (req: IAuthenticatedRequest | Request, res: Response, next: NextFunction) => {
    // Resolve the promise and catch any errors
    Promise.resolve(fn(req, res, next)).catch((error) => {
      logger.error("Async handler error:", error);
      next(error);
    });
  };
};

/**
 * Alternative: Generic async handler with better type support
 * Use this version if you need more flexibility
 */
export const asyncHandlerWithTypes = <T extends Request = Request>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<void> | void
) => {
  return (req: T, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((error: Error) => {
      logger.error(`Async handler error in route ${req.method} ${req.path}:`, error);
      next(error);
    });
  };
};

/**
 * Example usage in routes:
 *
 * // Before (with try-catch):
 * router.post('/login', async (req, res) => {
 *   try {
 *     const result = await authService.login(req.body);
 *     res.json(result);
 *   } catch (error) {
 *     next(error);
 *   }
 * });
 *
 * // After (with asyncHandler):
 * router.post('/login', asyncHandler(async (req, res) => {
 *   const result = await authService.login(req.body);
 *   res.json(result);
 * }));
 */
