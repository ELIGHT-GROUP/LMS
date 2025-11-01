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
 * Requires either password or googleToken
 */
export const registerStudentSchema = z
  .object({
    email: z
      .string({ message: "Email is required" })
      .email("Invalid email format")
      .max(VALIDATION.MAX_EMAIL_LENGTH || 255, "Email is too long"),

    password: z
      .string()
      .min(
        VALIDATION.MIN_PASSWORD_LENGTH || 6,
        `Password must be at least ${VALIDATION.MIN_PASSWORD_LENGTH || 6} characters`
      )
      .max(
        VALIDATION.MAX_PASSWORD_LENGTH || 128,
        `Password must not exceed ${VALIDATION.MAX_PASSWORD_LENGTH || 128} characters`
      )
      .optional(),

    googleToken: z.string().optional(),
  })
  .refine(
    (data) => data.password || data.googleToken,
    "Either password or googleToken must be provided"
  );

/**
 * Admin Registration validation schema
 * POST /auth/admin/register
 * Requires invitation token and either password or googleToken
 */
export const adminRegistrationSchema = z
  .object({
    email: z.string().email("Invalid email format").optional(),

    password: z.string().min(6, "Password must be at least 6 characters").optional(),

    googleToken: z.string().optional(),

    invitationToken: z
      .string({ message: "Invitation token is required" })
      .min(1, "Invitation token cannot be empty"),
  })
  .refine(
    (data) => data.password || data.googleToken,
    "Either password or googleToken must be provided"
  );

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
