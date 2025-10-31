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
import { successResponse, createdResponse } from "../utils/response";

/**
 * Authentication Controller - All auth endpoints
 * Note: All handlers are wrapped with asyncHandler
 */
export const AuthController = {
  /**
   * Register a new user
   * POST /api/auth/signup
   * Wrapped with asyncHandler for automatic error handling
   * Validation handled by Zod middleware
   */
  registerUser: asyncHandler(async (req: IAuthenticatedRequest, res: Response): Promise<void> => {
    const { email, password, phoneNumber, role } = req.body;

    const dto: IRegisterUserDto = {
      email,
      password,
      phoneNumber,
      role,
    };

    const response = await AuthService.registerUser(dto);
    createdResponse(res, response.message, response.data);
  }),

  /**
   * Login user
   * POST /api/auth/login
   * Wrapped with asyncHandler for automatic error handling
   * Validation handled by Zod middleware
   */
  loginUser: asyncHandler(async (req: IAuthenticatedRequest, res: Response): Promise<void> => {
    const { phoneNumber, password } = req.body;

    const dto: ILoginUserDto = { phoneNumber, password };

    const response = await AuthService.loginUser(dto);
    successResponse(res, response.message, response.data);
  }),

  /**
   * Request OTP for mobile verification
   * POST /api/auth/request-otp
   * Wrapped with asyncHandler for automatic error handling
   * Validation handled by Zod middleware
   */
  requestSendOtp: asyncHandler(async (req: IAuthenticatedRequest, res: Response): Promise<void> => {
    const { phoneNumber } = req.body;

    const response = await AuthService.requestSendOtp({ phoneNumber });
    successResponse(res, response.message, response.data);
  }),

  /**
   * Verify mobile number with OTP
   * POST /api/auth/verify-mobile
   * Wrapped with asyncHandler for automatic error handling
   * Validation handled by Zod middleware
   */
  verifyMobileNumber: asyncHandler(
    async (req: IAuthenticatedRequest, res: Response): Promise<void> => {
      const { userId, code } = req.body;

      const response = await AuthService.verifyMobileNumber({ userId, code });
      successResponse(res, response.message);
    }
  ),

  /**
   * Request password reset
   * POST /api/auth/reset-password-request
   * Wrapped with asyncHandler for automatic error handling
   * Validation handled by Zod middleware
   */
  requestPasswordReset: asyncHandler(
    async (req: IAuthenticatedRequest, res: Response): Promise<void> => {
      const { phoneNumber } = req.body;

      const response = await AuthService.requestPasswordReset({ phoneNumber });
      successResponse(res, response.message, response.data);
    }
  ),

  /**
   * Reset password
   * POST /api/auth/reset-password
   * Wrapped with asyncHandler for automatic error handling
   * Validation handled by Zod middleware
   */
  resetPassword: asyncHandler(async (req: IAuthenticatedRequest, res: Response): Promise<void> => {
    const { userId, newPassword } = req.body;

    const response = await AuthService.resetPassword({ userId, newPassword });
    successResponse(res, response.message);
  }),

  /**
   * Get authenticated user data
   * GET /api/auth/auth-data
   * Wrapped with asyncHandler for automatic error handling
   * Validation handled by Zod middleware
   */
  authData: asyncHandler(async (req: IAuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.query.userId as string;

    const response = await AuthService.authData({ userId });
    successResponse(res, response.message, response.data);
  }),
};
