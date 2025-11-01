/**
 * Common Authentication Controller
 * ================================
 * Shared endpoints for both Student and Admin authentication
 * - Login (works for both roles)
 * - Email verification
 * - Password reset
 * - Auth data retrieval
 *
 * Role-specific endpoints are in:
 * - student-auth.controller.ts for student-only flows
 * - admin-auth.controller.ts for admin-only flows
 */

import { Request, Response } from "express";
import { StudentAuthService } from "../services/auth.service";
import { asyncHandler } from "../middleware/async-handler.middleware";
import { successResponse } from "../utils/response";

/**
 * Login user with email and password
 * POST /api/auth/login
 * Works for both STUDENT and ADMIN roles
 * Body: { email, password }
 */
export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const result = await StudentAuthService.loginUser(req.body);

  successResponse(res, result.message, result.data);
});

/**
 * Request email verification code
 * POST /api/auth/request-email-verification
 * Headers: Authorization token
 * Works for both STUDENT and ADMIN
 */
export const requestEmailVerification = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  if (!userId) {
    throw new Error("User ID not found in request");
  }
  const result = await StudentAuthService.requestEmailVerification({
    userId,
  });

  successResponse(res, result.message, result.data);
});

/**
 * Verify email with code
 * POST /api/auth/verify-email
 * Headers: Authorization token
 * Works for both STUDENT and ADMIN
 * Body: { code }
 */
export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  if (!userId) {
    throw new Error("User ID not found in request");
  }
  const result = await StudentAuthService.verifyEmail({
    ...req.body,
    userId,
  });

  successResponse(res, result.message, undefined);
});

/**
 * Request password reset
 * POST /api/auth/reset-password-request
 * Works for both STUDENT and ADMIN
 * Body: { email }
 */
export const requestPasswordReset = asyncHandler(async (req: Request, res: Response) => {
  const result = await StudentAuthService.requestPasswordReset(req.body);

  successResponse(res, result.message, result.data);
});

/**
 * Reset password with code
 * POST /api/auth/reset-password
 * Works for both STUDENT and ADMIN
 * Body: { userId, code, newPassword }
 */
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const result = await StudentAuthService.resetPassword(req.body);

  successResponse(res, result.message, undefined);
});

/**
 * Get authenticated user data
 * GET /api/auth/auth-data
 * Headers: Authorization token
 * Works for both STUDENT and ADMIN
 */
export const authData = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  if (!userId) {
    throw new Error("User ID not found in request");
  }
  const result = await StudentAuthService.authData(userId);

  successResponse(res, result.message, result.data);
});
