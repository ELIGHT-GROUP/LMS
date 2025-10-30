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

const router = express.Router();

/**
 * POST /api/auth/signup
 * Register a new user
 */
router.post("/signup", AuthController.registerUser);

/**
 * POST /api/auth/login
 * Authenticate user with phone and password
 */
router.post("/login", loginRateLimiter, AuthController.loginUser);

/**
 * GET /api/auth/auth-data
 * Get authenticated user data (requires authentication)
 */
router.get("/auth-data", authMiddleware, AuthController.authData);

/**
 * POST /api/auth/request-otp
 * Request OTP for mobile verification
 */
router.post("/request-otp", otpRateLimiter, AuthController.requestSendOtp);

/**
 * POST /api/auth/verify-mobile
 * Verify mobile number with OTP code
 */
router.post("/verify-mobile", AuthController.verifyMobileNumber);

/**
 * POST /api/auth/reset-password-request
 * Request password reset code
 */
router.post("/reset-password-request", otpRateLimiter, AuthController.requestPasswordReset);

/**
 * POST /api/auth/reset-password
 * Reset user password with verification code
 */
router.post("/reset-password", AuthController.resetPassword);

export default router;
