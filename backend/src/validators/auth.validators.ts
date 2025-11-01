/**
 * Authentication Validators
 * =========================
 * Zod schemas for validating authentication requests
 * Email-based authentication with support for Google OAuth
 */

import { z } from "zod";
import { VALIDATION } from "../constants/enums";

/**
 * Student Registration validation schema
 * POST /auth/signup
 * Only email and password - Google signup via OAuth callback
 */
export const registerStudentSchema = z.object({
  email: z
    .string({ message: "Email is required" })
    .email("Invalid email format")
    .max(VALIDATION.MAX_EMAIL_LENGTH || 255, "Email is too long"),

  password: z
    .string({ message: "Password is required" })
    .min(
      VALIDATION.MIN_PASSWORD_LENGTH || 6,
      `Password must be at least ${VALIDATION.MIN_PASSWORD_LENGTH || 6} characters`
    )
    .max(
      VALIDATION.MAX_PASSWORD_LENGTH || 128,
      `Password must not exceed ${VALIDATION.MAX_PASSWORD_LENGTH || 128} characters`
    ),
});

/**
 * Admin Registration validation schema
 * POST /auth/admin/register
 * Only password and invitation token - Google signup via OAuth callback
 */
export const adminRegistrationSchema = z.object({
  email: z.string().email("Invalid email format"),

  password: z.string().min(6, "Password must be at least 6 characters"),

  invitationToken: z
    .string({ message: "Invitation token is required" })
    .min(1, "Invitation token cannot be empty"),
});

/**
 * Login validation schema
 * POST /auth/login
 * Email-based login
 */
export const loginSchema = z.object({
  email: z.string({ message: "Email is required" }).email("Invalid email format"),

  password: z.string({ message: "Password is required" }).min(1, "Password cannot be empty"),
});

/**
 * Update Student Profile validation schema
 * PUT /auth/student/profile
 * All fields are optional
 */
export const updateStudentProfileSchema = z.object({
  firstName: z.string().optional(),

  lastName: z.string().optional(),

  dob: z.string().datetime().optional(),

  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),

  profilePicture: z.string().url("Invalid profile picture URL").optional(),

  pushId: z.string().optional(),

  year: z.number().int().min(1).optional(),

  nic: z.string().optional(),

  nicPic: z.string().url("Invalid NIC picture URL").optional(),

  registerCode: z.string().optional(),

  extraDetails: z.record(z.string(), z.any()).optional(),

  deliveryDetails: z.record(z.string(), z.any()).optional(),
});

/**
 * Admin Invitation validation schema
 * POST /auth/admin/invite
 */
export const adminInvitationSchema = z.object({
  email: z.string({ message: "Email is required" }).email("Invalid email format"),

  role: z.enum(["ADMIN"], { message: "Role must be ADMIN" }),
});

/**
 * Update Admin Profile validation schema
 * PUT /auth/admin/profile
 * All fields are optional
 */
export const updateAdminProfileSchema = z.object({
  firstName: z.string().optional(),

  lastName: z.string().optional(),

  image: z.string().url("Invalid image URL").optional(),

  type: z.string().optional(),
});

/**
 * Email Verification Request validation schema
 * POST /auth/request-email-verification
 */
export const emailVerificationRequestSchema = z.object({});

/**
 * Email Verification validation schema
 * POST /auth/verify-email
 */
export const emailVerificationSchema = z.object({
  code: z
    .string({ message: "Verification code is required" })
    .length(6, "Verification code must be exactly 6 digits")
    .regex(/^\d+$/, "Verification code must contain only numbers"),
});

/**
 * Password Reset Request validation schema
 * POST /auth/reset-password-request
 */
export const passwordResetRequestSchema = z.object({
  email: z.string({ message: "Email is required" }).email("Invalid email format"),
});

/**
 * Password Reset validation schema
 * POST /auth/reset-password
 */
export const passwordResetSchema = z.object({
  userId: z.string({ message: "User ID is required" }).min(1, "User ID cannot be empty"),

  code: z
    .string({ message: "Verification code is required" })
    .length(6, "Verification code must be exactly 6 digits")
    .regex(/^\d+$/, "Verification code must contain only numbers"),

  newPassword: z
    .string({ message: "New password is required" })
    .min(6, "Password must be at least 6 characters")
    .max(128, "Password is too long"),
});

/**
 * Assign Permissions validation schema
 * POST /auth/admin/:adminId/permissions
 */
export const assignPermissionsSchema = z.object({
  permissions: z.array(z.string()).min(1, "At least one permission must be specified"),
});

/**
 * OAuth Initiate validation schema
 * GET /auth/google/initiate?role=STUDENT&invitationToken=optional
 */
export const oauthInitiateSchema = z.object({
  role: z.enum(["STUDENT", "ADMIN"], { message: "Role must be STUDENT or ADMIN" }),

  invitationToken: z.string().optional(),
});

/**
 * OAuth Callback validation schema
 * GET /auth/google/callback?code=xxx&state=yyy
 */
export const oauthCallbackSchema = z.object({
  code: z.string({ message: "Authorization code is required" }).min(1, "Code cannot be empty"),

  state: z.string({ message: "State parameter is required" }).min(1, "State cannot be empty"),

  error: z.string().optional(),

  error_description: z.string().optional(),
});
