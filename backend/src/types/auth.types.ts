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
 * User Registration DTO - Student
 * Request body for /auth/signup endpoint
 * Google signup is handled via OAuth callback
 */
export interface IRegisterStudentDto {
  email: string;
  password: string;
}

/**
 * Admin Registration DTO
 * Request body for /auth/admin/register endpoint
 * Google signup is handled via OAuth callback
 */
export interface IRegisterAdminDto {
  email: string;
  password: string;
  invitationToken: string;
}

/**
 * User Login DTO
 * Request body for /auth/login endpoint
 */
export interface ILoginUserDto {
  email: string;
  password: string;
}

/**
 * Admin Invitation DTO
 * Request body for /auth/admin/invite endpoint (OWNER only)
 */
export interface IAdminInvitationDto {
  email: string;
  role: "ADMIN";
}

/**
 * Student Profile Update DTO
 * Request body for PUT /auth/student/profile endpoint
 */
export interface IUpdateStudentProfileDto {
  firstName?: string;
  lastName?: string;
  dob?: string; // ISO date format
  gender?: string;
  profilePicture?: string;
  pushId?: string;
  year?: number;
  nic?: string;
  nicPic?: string;
  registerCode?: string;
  extraDetails?: Record<string, any>;
  deliveryDetails?: Record<string, any>;
}

/**
 * Admin Profile Update DTO
 * Request body for PUT /auth/admin/profile endpoint
 */
export interface IUpdateAdminProfileDto {
  firstName?: string;
  lastName?: string;
  image?: string;
  type?: string;
}

/**
 * Email Verification Request DTO
 * Request body for /auth/request-email-verification endpoint
 */
export interface IEmailVerificationRequestDto {
  userId: string;
}

/**
 * Email Verification DTO
 * Request body for /auth/verify-email endpoint
 */
export interface IEmailVerificationDto {
  userId: string;
  code: string;
}

/**
 * Password Reset Request DTO
 * Request body for /auth/reset-password-request endpoint
 */
export interface IPasswordResetRequestDto {
  email: string;
}

/**
 * Password Reset DTO
 * Request body for /auth/reset-password endpoint
 */
export interface IPasswordResetDto {
  userId: string;
  code: string;
  newPassword: string;
}

/**
 * Admin Permission Assignment DTO
 * Request body for POST /auth/admin/:adminId/permissions endpoint
 */
export interface IAssignPermissionsDto {
  permissions: string[]; // Array of permission names/keys
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
  email: string;
  role: "OWNER" | "ADMIN" | "STUDENT";
  isEmailVerified: boolean;
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
  email: string;
}

/**
 * Invitation Response DTO
 * Response body for /auth/admin/invite endpoint
 */
export interface IInvitationResponse {
  invitationLink: string;
  expiresAt: string;
}

/**
 * Student Profile Response DTO
 */
export interface IStudentProfileResponse {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  isProfileCompleted: boolean;
  approvalStatus: string;
}

/**
 * Admin Profile Response DTO
 */
export interface IAdminProfileResponse {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  type?: string;
  status: string;
}

/**
 * ============================================
 * SERVICE INTERFACES
 * ============================================
 */

/**
 * Student Authentication Service Interface
 * Defines student auth-related business logic methods
 */
export interface IStudentAuthService {
  registerStudent(dto: IRegisterStudentDto): Promise<{
    message: string;
    data: IRegisterResponse;
  }>;

  updateStudentProfile(
    userId: string,
    dto: IUpdateStudentProfileDto
  ): Promise<{
    message: string;
    data: IStudentProfileResponse;
  }>;

  requestEmailVerification(dto: IEmailVerificationRequestDto): Promise<{
    message: string;
    data: { userId: string; code: string };
  }>;

  verifyEmail(dto: IEmailVerificationDto): Promise<{
    message: string;
  }>;

  loginUser(dto: ILoginUserDto): Promise<{
    message: string;
    data: ILoginResponse;
  }>;

  requestPasswordReset(dto: IPasswordResetRequestDto): Promise<{
    message: string;
    data: { userId: string; code: string };
  }>;

  resetPassword(dto: IPasswordResetDto): Promise<{
    message: string;
  }>;

  authData(userId: string): Promise<{
    message: string;
    data: IUserProfile;
  }>;
}

/**
 * Admin Authentication Service Interface
 * Defines admin auth-related business logic methods
 */
export interface IAdminAuthService {
  createInvitation(
    dto: IAdminInvitationDto,
    ownerId: string
  ): Promise<{
    message: string;
    data: IInvitationResponse;
  }>;

  registerAdmin(dto: IRegisterAdminDto): Promise<{
    message: string;
    data: IRegisterResponse;
  }>;

  updateAdminProfile(
    userId: string,
    dto: IUpdateAdminProfileDto
  ): Promise<{
    message: string;
    data: IAdminProfileResponse;
  }>;

  assignPermissions(
    adminId: string,
    dto: IAssignPermissionsDto
  ): Promise<{
    message: string;
    data: { adminId: string; permissions: string[] };
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

/**
 * ============================================
 * OAUTH DTOs
 * ============================================
 */

/**
 * OAuth Initiate Request
 * GET /auth/google/initiate?role=STUDENT|ADMIN&invitationToken=optional
 */
export interface IOAuthInitiateQuery {
  role: "STUDENT" | "ADMIN";
  invitationToken?: string;
}

/**
 * OAuth Initiate Response
 * Redirects to Google OAuth URL
 */
export interface IOAuthInitiateResponse {
  redirectUrl: string;
}

/**
 * OAuth Callback Query
 * GET /auth/google/callback?code=xxx&state=yyy&error=optional
 */
export interface IOAuthCallbackQuery {
  code?: string;
  state: string;
  error?: string;
  error_description?: string;
}

/**
 * OAuth Callback Response
 * Redirects to frontend with JWT
 */
export interface IOAuthCallbackResponse {
  redirectUrl: string;
}
