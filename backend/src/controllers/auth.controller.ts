/**
 * Authentication Controller
 * ========================
 * HTTP request handlers for authentication endpoints
 * Uses asyncHandler middleware to handle async errors
 */

import { Response } from "express";
import type { IAuthenticatedRequest, IRegisterUserDto, ILoginUserDto } from "../types";
import { AuthService } from "../services/auth.service";
import { asyncHandler } from "../middleware/async-handler.middleware";
import {
  successResponse,
  badRequestResponse,
  handleErrorResponse,
  createdResponse,
} from "../utils/response";
import logger from "../utils/logger";

/**
 * Authentication Controller - All auth endpoints
 * Note: All handlers are wrapped with asyncHandler
 */
export const AuthController = {
  /**
   * Register a new user
   * POST /api/auth/signup
   * Wrapped with asyncHandler for automatic error handling
   */
  registerUser: asyncHandler(async (req: IAuthenticatedRequest, res: Response): Promise<void> => {
    const { email, password, phone_number, role } = req.body;

    // Validate required fields
    if (!password || !phone_number) {
      badRequestResponse(res, "Required fields are missing");
      return;
    }

    const dto: IRegisterUserDto = {
      email,
      password,
      phone_number,
      role,
    };

    const response = await AuthService.registerUser(dto);
    createdResponse(res, response.message, response.data);
  }),

  /**
   * Login user
   * POST /api/auth/login
   * Wrapped with asyncHandler for automatic error handling
   */
  loginUser: asyncHandler(async (req: IAuthenticatedRequest, res: Response): Promise<void> => {
    const { phone_number, password } = req.body;

    if (!phone_number || !password) {
      badRequestResponse(res, "Phone number and password are required");
      return;
    }

    const dto: ILoginUserDto = { phone_number, password };

    const response = await AuthService.loginUser(dto);
    successResponse(res, response.message, response.data);
  }),

  /**
   * Request OTP for mobile verification
   * POST /api/auth/request-otp
   * Wrapped with asyncHandler for automatic error handling
   */
  requestSendOtp: asyncHandler(async (req: IAuthenticatedRequest, res: Response): Promise<void> => {
    const { phone_number } = req.body;

    if (!phone_number) {
      badRequestResponse(res, "Phone number is required");
      return;
    }

    const response = await AuthService.requestSendOtp({ phone_number });
    successResponse(res, response.message, response.data);
  }),

  /**
   * Verify mobile number with OTP
   * POST /api/auth/verify-mobile
   * Wrapped with asyncHandler for automatic error handling
   */
  verifyMobileNumber: asyncHandler(
    async (req: IAuthenticatedRequest, res: Response): Promise<void> => {
      const { userId, code } = req.body;

      if (!userId || !code) {
        badRequestResponse(res, "User ID and verification code are required");
        return;
      }

      const response = await AuthService.verifyMobileNumber({ userId, code });
      successResponse(res, response.message);
    }
  ),

  /**
   * Request password reset
   * POST /api/auth/reset-password-request
   * Wrapped with asyncHandler for automatic error handling
   */
  requestPasswordReset: asyncHandler(
    async (req: IAuthenticatedRequest, res: Response): Promise<void> => {
      const { phone_number } = req.body;

      if (!phone_number) {
        badRequestResponse(res, "Phone number is required");
        return;
      }

      const response = await AuthService.requestPasswordReset({ phone_number });
      successResponse(res, response.message, response.data);
    }
  ),

  /**
   * Reset password
   * POST /api/auth/reset-password
   * Wrapped with asyncHandler for automatic error handling
   */
  resetPassword: asyncHandler(async (req: IAuthenticatedRequest, res: Response): Promise<void> => {
    const { userId, newPassword } = req.body;

    if (!userId || !newPassword) {
      badRequestResponse(res, "User ID and new password are required");
      return;
    }

    const response = await AuthService.resetPassword({ userId, newPassword });
    successResponse(res, response.message);
  }),

  /**
   * Get authenticated user data
   * GET /api/auth/auth-data
   * Wrapped with asyncHandler for automatic error handling
   */
  authData: asyncHandler(async (req: IAuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.query.userId as string;

    if (!userId) {
      badRequestResponse(res, "User ID is required");
      return;
    }

    const response = await AuthService.authData({ userId });
    successResponse(res, response.message, response.data);
  }),
};
