/**
 * Student Authentication Controller
 * ==================================
 * Handles STUDENT-SPECIFIC authentication endpoints only
 *
 * Common endpoints are in auth.controller.ts:
 * - loginUser
 * - requestEmailVerification
 * - verifyEmail
 * - requestPasswordReset
 * - resetPassword
 * - authData
 */

import { Request, Response } from "express";
import { StudentAuthService } from "../services/auth.service";
import { asyncHandler } from "../middleware/async-handler.middleware";
import { successResponse } from "../utils/response";

/**
 * Register new student
 * POST /api/auth/signup
 * Body: { email, password }
 */
export const registerStudent = asyncHandler(async (req: Request, res: Response) => {
  const result = await StudentAuthService.registerStudent(req.body);

  successResponse(res, result.message, result.data, 201);
});

/**
 * Update student profile
 * PUT /api/auth/student/profile
 * Headers: Authorization token
 * Body: { firstName?, lastName?, dob?, gender?, ... }
 */
export const updateStudentProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId; // From auth middleware
  if (!userId) {
    throw new Error("User ID not found in request");
  }
  const result = await StudentAuthService.updateStudentProfile(userId, req.body);

  successResponse(res, result.message, result.data);
});
