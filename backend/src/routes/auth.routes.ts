/**
 * Authentication Routes
 * ====================
 * API endpoints for user authentication
 */

// @ts-ignore - Express has both default and named exports
import express from "express";
import { AuthController } from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { loginRateLimiter, otpRateLimiter } from "../middleware/security.middleware";
import { validateBody, validateQuery } from "../middleware/validation.middleware";
import {
  registerSchema,
  loginSchema,
  requestOtpSchema,
  verifyOtpSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
  authDataQuerySchema,
} from "../validators/auth.validators";

const router = express.Router();

/**
 * POST /api/auth/signup
 * Register a new user
 */
router.post("/signup", validateBody(registerSchema), AuthController.registerUser);

/**
 * POST /api/auth/login
 * Authenticate user with phone and password
 */
router.post("/login", loginRateLimiter, validateBody(loginSchema), AuthController.loginUser);

/**
 * GET /api/auth/auth-data
 * Get authenticated user data (requires authentication)
 */
router.get(
  "/auth-data",
  authMiddleware,
  validateQuery(authDataQuerySchema),
  AuthController.authData
);

/**
 * POST /api/auth/request-otp
 * Request OTP for mobile verification
 */
router.post(
  "/request-otp",
  otpRateLimiter,
  validateBody(requestOtpSchema),
  AuthController.requestSendOtp
);

/**
 * POST /api/auth/verify-mobile
 * Verify mobile number with OTP code
 */
router.post("/verify-mobile", validateBody(verifyOtpSchema), AuthController.verifyMobileNumber);

/**
 * POST /api/auth/reset-password-request
 * Request password reset code
 */
router.post(
  "/reset-password-request",
  otpRateLimiter,
  validateBody(requestPasswordResetSchema),
  AuthController.requestPasswordReset
);

/**
 * POST /api/auth/reset-password
 * Reset user password with verification code
 */
router.post("/reset-password", validateBody(resetPasswordSchema), AuthController.resetPassword);

export default router;
