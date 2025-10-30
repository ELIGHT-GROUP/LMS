/**
 * Application Enums and Constants
 * ==============================
 * Centralized definitions for user roles, types, and other constants
 */

/**
 * User Roles in the Application
 */
export enum UserRole {
  ADMIN = "ADMIN",
  TEACHER = "TEACHER",
  STUDENT = "STUDENT",
  CLIENT = "CLIENT",
}

/**
 * User Account Status
 */
export enum AccountStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
  DELETED = "DELETED",
}

/**
 * Theme Mode
 */
export enum ThemeMode {
  LIGHT = "LIGHT",
  DARK = "DARK",
}

/**
 * Size Chart Types
 */
export enum SizeChartType {
  TYPE_ONE = "TYPE_ONE",
  TYPE_TWO = "TYPE_TWO",
}

/**
 * Constants for time expiry
 */
export const TIME_CONSTANTS = {
  NEVER_EXPIRE: new Date("9999-12-31"),
  OTP_EXPIRY_MINUTES: 10,
  TOKEN_EXPIRY_HOURS: 24,
  PASSWORD_RESET_EXPIRY_MINUTES: 30,
} as const;

/**
 * API Response Messages
 */
export const API_MESSAGES = {
  // Success Messages
  USER_CREATED: "User created successfully",
  USER_UPDATED: "User updated successfully",
  USER_DELETED: "User deleted successfully",
  LOGIN_SUCCESS: "Login successful",
  LOGOUT_SUCCESS: "Logout successful",
  PASSWORD_RESET_SUCCESS: "Password reset successfully",
  OTP_SENT: "OTP sent successfully",
  OTP_VERIFIED: "OTP verified successfully",
  EMAIL_VERIFIED: "Email verified successfully",
  PHONE_VERIFIED: "Phone number verified successfully",

  // Error Messages
  INVALID_CREDENTIALS: "Invalid phone number or password",
  USER_NOT_FOUND: "User not found",
  USER_ALREADY_EXISTS: "User already exists",
  EMAIL_ALREADY_EXISTS: "Email already exists",
  PHONE_ALREADY_EXISTS: "Phone number already exists",
  INVALID_TOKEN: "Invalid or expired token",
  UNAUTHORIZED_ACCESS: "Unauthorized access",
  FORBIDDEN_ACTION: "Forbidden action",
  OTP_EXPIRED: "OTP has expired",
  INVALID_OTP: "Invalid OTP code",
  WEAK_PASSWORD: "Password is too weak",
  SERVER_ERROR: "An unexpected server error occurred",
} as const;

/**
 * HTTP Status Codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * Validation Constants
 */
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 160,
  MAX_EMAIL_LENGTH: 120,
  PHONE_REGEX: /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;

/**
 * Pagination Constants
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

/**
 * Rate Limiting Constants
 */
export const RATE_LIMITS = {
  DEFAULT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  DEFAULT_MAX_REQUESTS: 100,
  LOGIN_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  LOGIN_MAX_REQUESTS: 5,
  OTP_WINDOW_MS: 60 * 1000, // 1 minute
  OTP_MAX_REQUESTS: 3,
} as const;
