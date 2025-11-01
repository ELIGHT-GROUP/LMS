/**
 * Authentication Routes
 * ====================
 * API endpoints for user authentication
 * Supports separate flows for STUDENT and ADMIN authentication
 */

// @ts-ignore - Express has both default and named exports
import express from "express";
import * as AuthController from "../controllers/auth.controller";
import * as StudentAuthController from "../controllers/student-auth.controller";
import * as AdminAuthController from "../controllers/admin-auth.controller";
import * as OAuthController from "../controllers/oauth.controller";
import { authMiddleware, authorize } from "../middleware/auth.middleware";
import { loginRateLimiter, emailVerificationRateLimiter } from "../middleware/security.middleware";
import { validate, validateQuery } from "../middleware/validation.middleware";
import {
  registerStudentSchema,
  loginSchema,
  updateStudentProfileSchema,
  adminInvitationSchema,
  adminRegistrationSchema,
  updateAdminProfileSchema,
  emailVerificationRequestSchema,
  emailVerificationSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  assignPermissionsSchema,
  oauthInitiateSchema,
  oauthCallbackSchema,
} from "../validators/auth.validators";

const router = express.Router();

/**
 * ============================================
 * STUDENT AUTHENTICATION ROUTES
 * ============================================
 */

/**
 * POST /api/auth/signup
 * Register a new student (email/password or Google)
 */
router.post(
  "/signup",
  validate(registerStudentSchema, "body"),
  StudentAuthController.registerStudent
);

/**
 * POST /api/auth/login
 * Student/Admin login with email and password
 * Works for both roles
 */
router.post("/login", loginRateLimiter, validate(loginSchema, "body"), AuthController.loginUser);

/**
 * PUT /api/auth/student/profile
 * Update student profile (requires authentication)
 */
router.put(
  "/student/profile",
  authMiddleware,
  validate(updateStudentProfileSchema, "body"),
  StudentAuthController.updateStudentProfile
);

/**
 * POST /api/auth/request-email-verification
 * Request email verification code (requires authentication)
 * Works for both STUDENT and ADMIN
 */
router.post(
  "/request-email-verification",
  authMiddleware,
  emailVerificationRateLimiter,
  validate(emailVerificationRequestSchema, "body"),
  AuthController.requestEmailVerification
);

/**
 * POST /api/auth/verify-email
 * Verify email with code (requires authentication)
 * Works for both STUDENT and ADMIN
 */
router.post(
  "/verify-email",
  authMiddleware,
  validate(emailVerificationSchema, "body"),
  AuthController.verifyEmail
);

/**
 * POST /api/auth/reset-password-request
 * Request password reset code
 * Works for both STUDENT and ADMIN
 */
router.post(
  "/reset-password-request",
  validate(passwordResetRequestSchema, "body"),
  AuthController.requestPasswordReset
);

/**
 * POST /api/auth/reset-password
 * Reset password with code
 * Works for both STUDENT and ADMIN
 */
router.post("/reset-password", validate(passwordResetSchema, "body"), AuthController.resetPassword);

/**
 * GET /api/auth/auth-data
 * Get authenticated user data (requires authentication)
 * Works for both STUDENT and ADMIN
 */
router.get("/auth-data", authMiddleware, AuthController.authData);

/**
 * ============================================
 * ADMIN AUTHENTICATION ROUTES
 * ============================================
 */

/**
 * POST /api/auth/admin/invite
 * Create admin invitation (OWNER only)
 */
router.post(
  "/admin/invite",
  authMiddleware,
  authorize("OWNER"),
  validate(adminInvitationSchema, "body"),
  AdminAuthController.createInvitation
);

/**
 * POST /api/auth/admin/register
 * Register admin with invitation token
 */
router.post(
  "/admin/register",
  validate(adminRegistrationSchema, "body"),
  AdminAuthController.registerAdmin
);

/**
 * PUT /api/auth/admin/profile
 * Update admin profile (requires authentication)
 */
router.put(
  "/admin/profile",
  authMiddleware,
  validate(updateAdminProfileSchema, "body"),
  AdminAuthController.updateAdminProfile
);

/**
 * POST /api/auth/admin/:adminId/permissions
 * Assign permissions to admin (OWNER only)
 */
router.post(
  "/admin/:adminId/permissions",
  authMiddleware,
  authorize("OWNER"),
  validate(assignPermissionsSchema, "body"),
  AdminAuthController.assignPermissions
);

/**
 * ============================================
 * GOOGLE OAUTH ROUTES
 * ============================================
 */

/**
 * GET /api/auth/google/initiate?role=STUDENT|ADMIN&invitationToken=optional
 * Initiates Google OAuth flow
 * Redirects user to Google consent screen
 */
router.get(
  "/google/initiate",
  validateQuery(oauthInitiateSchema),
  OAuthController.initiateGoogleOAuth
);

/**
 * GET /api/auth/google/callback?code=xxx&state=yyy
 * Google OAuth callback endpoint
 * Handles token exchange and user creation
 * Redirects to frontend with JWT token
 */
router.get(
  "/google/callback",
  validateQuery(oauthCallbackSchema),
  OAuthController.googleOAuthCallback
);

export default router;
