/**
 * Authentication Service
 * ======================
 * Business logic for user registration, login, and authentication
 * Using Prisma ORM for database operations
 */

import bcrypt from "bcryptjs";
import { getPrisma } from "../config/database";
import { generateToken } from "../utils/jwt";
import { IRegisterUserDto, ILoginUserDto, IUserProfile } from "../types";
import {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
  InternalServerError,
} from "../utils/errors";
import logger from "../utils/logger";
import { API_MESSAGES } from "../constants/enums";

/**
 * Helper function to generate OTP code
 */
const generateOTPCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Helper function to hash password
 */
const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

/**
 * Helper function to compare passwords
 */
const comparePasswords = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

/**
 * Check if verification code has expired
 */
const isVerificationCodeExpired = (expiresAt: Date | null): boolean => {
  if (!expiresAt) return true;
  return new Date() > expiresAt;
};

/**
 * Authentication Service - All auth-related operations
 */
export const AuthService = {
  /**
   * Register a new user
   */
  async registerUser(dto: IRegisterUserDto): Promise<{
    message: string;
    data: { userId: string; is_verified: boolean };
  }> {
    const prisma = getPrisma();
    try {
      const { email, password, phone_number, role } = dto;

      // Check if phone number already exists
      const existingPhoneUser = await prisma.user.findUnique({
        where: { phone_number },
        select: { id: true },
      });

      if (existingPhoneUser) {
        throw new BadRequestError(API_MESSAGES.PHONE_ALREADY_EXISTS);
      }

      // Check if email already exists
      if (email) {
        const existingEmailUser = await prisma.user.findUnique({
          where: { email },
          select: { id: true },
        });

        if (existingEmailUser) {
          throw new BadRequestError(API_MESSAGES.EMAIL_ALREADY_EXISTS);
        }
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Generate verification code
      const verificationCode = generateOTPCode();

      // Create user
      const user = await prisma.user.create({
        data: {
          email: email || undefined,
          phone_number,
          password: hashedPassword,
          role: role || "STUDENT",
          is_verified: false,
          is_active: true,
          verification_code: verificationCode,
          verification_code_expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        },
      });

      logger.info(`User registered successfully: ${user.id}`);

      return {
        message: API_MESSAGES.USER_CREATED,
        data: {
          userId: user.id,
          is_verified: user.is_verified,
        },
      };
    } catch (error) {
      logger.error("Error in registerUser:", error);
      if (error instanceof BadRequestError) {
        throw error;
      }
      throw new InternalServerError("Registration failed");
    }
  },

  /**
   * Login user with phone and password
   */
  async loginUser(dto: ILoginUserDto): Promise<{
    message: string;
    data: IUserProfile & { token: string };
  }> {
    const prisma = getPrisma();
    try {
      const { phone_number, password } = dto;

      // Find user
      const user = await prisma.user.findUnique({
        where: { phone_number },
      });

      if (!user) {
        throw new NotFoundError(API_MESSAGES.USER_NOT_FOUND);
      }

      // Verify password
      const isValidPassword = await comparePasswords(password, user.password);
      if (!isValidPassword) {
        throw new UnauthorizedError(API_MESSAGES.INVALID_CREDENTIALS);
      }

      // Generate token
      const token = generateToken({
        id: user.id,
        role: user.role,
      });

      // Save token to database
      await prisma.token.create({
        data: {
          user_id: user.id,
          token,
          expire_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          is_active: true,
        },
      });

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { last_login: new Date() },
      });

      logger.info(`User logged in successfully: ${user.id}`);

      return {
        message: API_MESSAGES.LOGIN_SUCCESS,
        data: {
          token,
          id: user.id,
          email: user.email || undefined,
          phone_number: user.phone_number,
          role: user.role,
          is_verified: user.is_verified,
          is_active: user.is_active,
        },
      };
    } catch (error) {
      logger.error("Error in loginUser:", error);
      if (error instanceof NotFoundError || error instanceof UnauthorizedError) {
        throw error;
      }
      throw new InternalServerError("Login failed");
    }
  },

  /**
   * Request OTP for mobile verification
   */
  async requestSendOtp(dto: { phone_number: string }): Promise<{
    message: string;
    data: { userId: string };
  }> {
    const prisma = getPrisma();
    try {
      const { phone_number } = dto;

      const user = await prisma.user.findUnique({
        where: { phone_number },
        select: { id: true },
      });

      if (!user) {
        throw new NotFoundError(API_MESSAGES.USER_NOT_FOUND);
      }

      // Generate OTP
      const verificationCode = generateOTPCode();

      await prisma.user.update({
        where: { id: user.id },
        data: {
          verification_code: verificationCode,
          verification_code_expires_at: new Date(Date.now() + 10 * 60 * 1000),
        },
      });

      logger.info(`OTP sent to user: ${user.id}`);

      return {
        message: API_MESSAGES.OTP_SENT,
        data: { userId: user.id },
      };
    } catch (error) {
      logger.error("Error in requestSendOtp:", error);
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError("OTP request failed");
    }
  },

  /**
   * Verify mobile number with OTP
   */
  async verifyMobileNumber(dto: { userId: string; code: string }): Promise<{
    message: string;
  }> {
    const prisma = getPrisma();
    try {
      const { userId, code } = dto;

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundError(API_MESSAGES.USER_NOT_FOUND);
      }

      // Check if code has expired
      if (isVerificationCodeExpired(user.verification_code_expires_at)) {
        throw new BadRequestError(API_MESSAGES.OTP_EXPIRED);
      }

      // Verify code
      if (user.verification_code !== code) {
        throw new BadRequestError(API_MESSAGES.INVALID_OTP);
      }

      // Update user as verified
      await prisma.user.update({
        where: { id: userId },
        data: {
          is_verified: true,
          is_active: true,
          verification_code: null,
          verification_code_expires_at: null,
        },
      });

      logger.info(`Mobile verified for user: ${userId}`);

      return { message: API_MESSAGES.PHONE_VERIFIED };
    } catch (error) {
      logger.error("Error in verifyMobileNumber:", error);
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError("Verification failed");
    }
  },

  /**
   * Request password reset
   */
  async requestPasswordReset(dto: { phone_number: string }): Promise<{
    message: string;
    data: { userId: string };
  }> {
    const prisma = getPrisma();
    try {
      const { phone_number } = dto;

      const user = await prisma.user.findUnique({
        where: { phone_number },
        select: { id: true },
      });

      if (!user) {
        throw new NotFoundError(API_MESSAGES.USER_NOT_FOUND);
      }

      // Generate reset code
      const resetCode = generateOTPCode();

      await prisma.user.update({
        where: { id: user.id },
        data: {
          verification_code: resetCode,
          verification_code_expires_at: new Date(Date.now() + 10 * 60 * 1000),
        },
      });

      logger.info(`Password reset code sent to user: ${user.id}`);

      return {
        message: "Password reset code sent successfully",
        data: { userId: user.id },
      };
    } catch (error) {
      logger.error("Error in requestPasswordReset:", error);
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError("Password reset request failed");
    }
  },

  /**
   * Reset user password
   */
  async resetPassword(dto: { userId: string; newPassword: string }): Promise<{
    message: string;
  }> {
    const prisma = getPrisma();
    try {
      const { userId, newPassword } = dto;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      if (!user) {
        throw new NotFoundError(API_MESSAGES.USER_NOT_FOUND);
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);

      await prisma.user.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          verification_code: null,
          verification_code_expires_at: null,
        },
      });

      logger.info(`Password reset for user: ${userId}`);

      return { message: API_MESSAGES.PASSWORD_RESET_SUCCESS };
    } catch (error) {
      logger.error("Error in resetPassword:", error);
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError("Password reset failed");
    }
  },

  /**
   * Get authenticated user data
   */
  async authData(dto: { userId: string }): Promise<{
    message: string;
    data: IUserProfile;
  }> {
    const prisma = getPrisma();
    try {
      const { userId } = dto;

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundError(API_MESSAGES.USER_NOT_FOUND);
      }

      return {
        message: "Auth data fetched successfully",
        data: {
          id: user.id,
          email: user.email || undefined,
          phone_number: user.phone_number,
          role: user.role,
          is_verified: user.is_verified,
          is_active: user.is_active,
        },
      };
    } catch (error) {
      logger.error("Error in authData:", error);
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError("Failed to fetch auth data");
    }
  },
};
