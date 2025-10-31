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
  IRegisterUserDto,
  ILoginUserDto,
  IOtpRequestDto,
  IVerifyMobileDto,
  IPasswordResetRequestDto,
  IPasswordResetDto,
  IUserProfile,
  ILoginResponse,
  IRegisterResponse,
  IAuthService,
  IJwtPayload,
  IDeviceInfo,
  ITokenOptions,
  IOtpResponse,
} from "./auth.types";
