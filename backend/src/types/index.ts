/**
 * Request/Response Type Definitions
 * ====================================
 * Central location for all TypeScript type definitions used across the application
 */

import { Request, Response, NextFunction } from "express";

/**
 * Extended Express Request with user information
 */
export interface IAuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

/**
 * API Response Format
 */
export interface IApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

/**
 * Middleware type
 */
export type IMiddleware = (
  req: IAuthenticatedRequest,
  res: Response,
  next: NextFunction
) => Promise<void> | void;

/**
 * Re-export all auth-related types from auth.types.ts
 * Includes: DTOs, Token types, VerificationToken types, service interfaces
 */
export type {
  Token,
  TokenPayload,
  VerificationToken,
  VerificationTokenRequest,
  IRegisterStudentDto,
  IRegisterAdminDto,
  ILoginUserDto,
  IAdminInvitationDto,
  IUpdateStudentProfileDto,
  IUpdateAdminProfileDto,
  IEmailVerificationRequestDto,
  IEmailVerificationDto,
  IPasswordResetRequestDto,
  IPasswordResetDto,
  IAssignPermissionsDto,
  IUserProfile,
  ILoginResponse,
  IRegisterResponse,
  IInvitationResponse,
  IStudentProfileResponse,
  IAdminProfileResponse,
  IStudentAuthService,
  IAdminAuthService,
  IJwtPayload,
  IDeviceInfo,
  ITokenOptions,
  IOtpResponse,
} from "./auth.types";
