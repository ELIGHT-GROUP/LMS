/**
 * Authentication Types & Data Transfer Objects
 * ==============================================
 * Consolidates all auth-related types including:
 * - JSON structure types (Token, VerificationToken)
 * - Request/Response DTOs
 * - Service interfaces
 */

/**
 * ============================================
 * TOKEN TYPES (JSON structures in AuthUser)
 * ============================================
 */

/**
 * JWT Token structure stored in AuthUser.tokens JSON array
 * Each token object contains metadata about a JWT token
 */
export type Token = {
  id: string; // Unique token identifier
  token: string; // JWT token string
  deviceInfo?: {
    deviceName?: string;
    deviceType?: string; // MOBILE, TABLET, DESKTOP, etc
    userAgent?: string;
  } | null;
  ipAddress?: string | null; // IP address where token was created
  expireAt: Date | string; // Token expiration timestamp
  isActive: boolean; // Whether token is still valid/active
  createdAt: Date | string; // When token was created
};

/**
 * JWT token payload structure
 * Decoded from JWT token
 */
export type TokenPayload = {
  id: string; // User ID (authUser.id)
  role: "OWNER" | "ADMIN" | "STUDENT"; // User role
  iat?: number; // Issued at timestamp
  exp?: number; // Expiration timestamp
};

/**
 * ============================================
 * VERIFICATION TOKEN TYPES (JSON structures in AuthUser)
 * ============================================
 */

/**
 * Verification token structure stored in AuthUser.verification_tokens JSON array
 * Each token object represents a one-time code for verification
 */
export type VerificationToken = {
  id: string; // Unique token identifier
  tokenHash: string; // Hashed verification code/OTP
  type: "VERIFY_EMAIL" | "VERIFY_PHONE" | "PASSWORD_RESET" | "INVITE_ADMIN"; // Token purpose
  expiresAt: Date | string; // When token expires
  isUsed: boolean; // Whether token has been used (prevents replay)
  createdAt: Date | string; // When token was created
};

/**
 * Verification token request data
 * Used when requesting new verification code
 */
export type VerificationTokenRequest = {
  type: "VERIFY_EMAIL" | "VERIFY_PHONE" | "PASSWORD_RESET" | "INVITE_ADMIN";
  expiryMinutes?: number; // Custom expiry (default: 10 minutes)
};

/**
 * ============================================
 * AUTHENTICATION REQUEST/RESPONSE DTOs
 * ============================================
 */

/**
 * User Registration DTO
 * Request body for /auth/signup endpoint
 */
export interface IRegisterUserDto {
  email?: string;
  password: string;
  phoneNumber: string;
  role?: "STUDENT" | "ADMIN" | "OWNER";
}

/**
 * User Login DTO
 * Request body for /auth/login endpoint
 */
export interface ILoginUserDto {
  phoneNumber: string;
  password: string;
}

/**
 * OTP Request DTO
 * Request body for /auth/request-otp endpoint
 */
export interface IOtpRequestDto {
  phoneNumber: string;
}

/**
 * Verify Mobile DTO
 * Request body for /auth/verify-mobile endpoint
 */
export interface IVerifyMobileDto {
  userId: string;
  code: string;
}

/**
 * Password Reset Request DTO
 * Request body for /auth/reset-password-request endpoint
 */
export interface IPasswordResetRequestDto {
  phoneNumber: string;
}

/**
 * Password Reset DTO
 * Request body for /auth/reset-password endpoint
 */
export interface IPasswordResetDto {
  userId: string;
  newPassword: string;
}

/**
 * ============================================
 * AUTHENTICATION RESPONSE DTOs
 * ============================================
 */

/**
 * User Profile Response
 * Returned after successful login or registration
 */
export interface IUserProfile {
  id: string;
  email?: string;
  phoneNumber: string;
  role: "OWNER" | "ADMIN" | "STUDENT";
  isEmailVerified: boolean;
  isMobileVerified: boolean;
  isAccountVerified: boolean;
  isActive: boolean;
}

/**
 * Login Response DTO
 * Response body for /auth/login endpoint
 */
export interface ILoginResponse extends IUserProfile {
  token: string;
}

/**
 * Registration Response DTO
 * Response body for /auth/signup endpoint
 */
export interface IRegisterResponse {
  userId: string;
  isEmailVerified: boolean;
}

/**
 * ============================================
 * SERVICE INTERFACES
 * ============================================
 */

/**
 * Authentication Service Interface
 * Defines all auth-related business logic methods
 */
export interface IAuthService {
  registerUser(dto: IRegisterUserDto): Promise<{
    message: string;
    data: IRegisterResponse;
  }>;

  loginUser(dto: ILoginUserDto): Promise<{
    message: string;
    data: ILoginResponse & { token: string };
  }>;

  requestSendOtp(dto: IOtpRequestDto): Promise<{
    message: string;
    data: { userId: string };
  }>;

  verifyMobileNumber(dto: IVerifyMobileDto): Promise<{
    message: string;
  }>;

  requestPasswordReset(dto: IPasswordResetRequestDto): Promise<{
    message: string;
    data: { userId: string };
  }>;

  resetPassword(dto: IPasswordResetDto): Promise<{
    message: string;
  }>;

  authData(dto: { userId: string }): Promise<{
    message: string;
    data: IUserProfile;
  }>;
}

/**
 * ============================================
 * HELPER TYPES
 * ============================================
 */

/**
 * JWT Payload
 * Structure of decoded JWT token
 */
export interface IJwtPayload {
  id: string;
  role: "OWNER" | "ADMIN" | "STUDENT";
}

/**
 * Device Info for Token Tracking
 */
export interface IDeviceInfo {
  deviceName?: string;
  deviceType?: "MOBILE" | "TABLET" | "DESKTOP" | "UNKNOWN";
  userAgent?: string;
  ipAddress?: string;
}

/**
 * Token Creation Options
 */
export interface ITokenOptions {
  expiryHours?: number;
  deviceInfo?: IDeviceInfo;
  ipAddress?: string;
}

/**
 * OTP Generation Response
 */
export interface IOtpResponse {
  code: string;
  expiryMinutes: number;
}
