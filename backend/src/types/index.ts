/**
 * Request/Response Type Definitions
 * ====================================
 * Common types used across controllers, services, and utilities
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
 * User Registration DTO
 */
export interface IRegisterUserDto {
  email?: string;
  password: string;
  phone_number: string;
  role?: string;
}

/**
 * User Login DTO
 */
export interface ILoginUserDto {
  phone_number: string;
  password: string;
}

/**
 * JWT Payload
 */
export interface IJwtPayload {
  id: string;
  role: string;
}

/**
 * User Profile
 */
export interface IUserProfile {
  id: string;
  email?: string;
  phone_number: string;
  role: string;
  is_verified: boolean;
  is_active: boolean;
}

/**
 * Middleware type
 */
export type IMiddleware = (
  req: IAuthenticatedRequest,
  res: Response,
  next: NextFunction
) => Promise<void> | void;
