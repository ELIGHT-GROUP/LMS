/**
 * Authentication Validators
 * =========================
 * Zod schemas for validating authentication requests
 * Provides type-safe validation for auth endpoints
 */

import { z } from "zod";
import { VALIDATION } from "../constants/enums";

/**
 * Register/Signup validation schema
 */
export const registerSchema = z.object({
  phoneNumber: z
    .string({ message: "Phone number is required" })
    .min(1, "Phone number cannot be empty")
    .regex(VALIDATION.PHONE_REGEX, "Invalid phone number format"),

  password: z
    .string({ message: "Password is required" })
    .min(
      VALIDATION.MIN_PASSWORD_LENGTH,
      `Password must be at least ${VALIDATION.MIN_PASSWORD_LENGTH} characters`
    )
    .max(
      VALIDATION.MAX_PASSWORD_LENGTH,
      `Password must not exceed ${VALIDATION.MAX_PASSWORD_LENGTH} characters`
    ),

  email: z
    .string()
    .email("Invalid email format")
    .max(
      VALIDATION.MAX_EMAIL_LENGTH,
      `Email must not exceed ${VALIDATION.MAX_EMAIL_LENGTH} characters`
    )
    .optional()
    .or(z.literal("")),

  role: z
    .enum(["ADMIN", "TEACHER", "STUDENT", "CLIENT"], {
      message: "Role must be one of: ADMIN, TEACHER, STUDENT, CLIENT",
    })
    .optional(),
});

/**
 * Login validation schema
 */
export const loginSchema = z.object({
  phoneNumber: z
    .string({ message: "Phone number is required" })
    .min(1, "Phone number cannot be empty"),

  password: z.string({ message: "Password is required" }).min(1, "Password cannot be empty"),
});

/**
 * Request OTP validation schema
 */
export const requestOtpSchema = z.object({
  phoneNumber: z
    .string({ message: "Phone number is required" })
    .min(1, "Phone number cannot be empty")
    .regex(VALIDATION.PHONE_REGEX, "Invalid phone number format"),
});

/**
 * Verify mobile/OTP validation schema
 */
export const verifyOtpSchema = z.object({
  userId: z
    .string({ message: "User ID is required" })
    .min(1, "User ID cannot be empty")
    .cuid("Invalid user ID format"),

  code: z
    .string({ message: "Verification code is required" })
    .length(6, "Verification code must be exactly 6 digits")
    .regex(/^\d+$/, "Verification code must contain only numbers"),
});

/**
 * Password reset request validation schema
 */
export const requestPasswordResetSchema = z.object({
  phoneNumber: z
    .string({ message: "Phone number is required" })
    .min(1, "Phone number cannot be empty")
    .regex(VALIDATION.PHONE_REGEX, "Invalid phone number format"),
});

/**
 * Reset password validation schema
 */
export const resetPasswordSchema = z.object({
  userId: z
    .string({ message: "User ID is required" })
    .min(1, "User ID cannot be empty")
    .cuid("Invalid user ID format"),

  newPassword: z
    .string({ message: "New password is required" })
    .min(
      VALIDATION.MIN_PASSWORD_LENGTH,
      `Password must be at least ${VALIDATION.MIN_PASSWORD_LENGTH} characters`
    )
    .max(
      VALIDATION.MAX_PASSWORD_LENGTH,
      `Password must not exceed ${VALIDATION.MAX_PASSWORD_LENGTH} characters`
    ),
});

/**
 * Auth data query validation schema
 */
export const authDataQuerySchema = z.object({
  userId: z
    .string({ message: "User ID is required" })
    .min(1, "User ID cannot be empty")
    .cuid("Invalid user ID format"),
});

// Export types inferred from schemas
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RequestOtpInput = z.infer<typeof requestOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type AuthDataQueryInput = z.infer<typeof authDataQuerySchema>;
