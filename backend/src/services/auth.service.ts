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
    data: { userId: string; isEmailVerified: boolean };
  }> {
    const prisma = getPrisma();
    try {
      const { email, password, phoneNumber, role } = dto;

      // Check if phone number already exists
      const existingPhoneUser = await prisma.authUser.findUnique({
        where: { phoneNumber },
        select: { id: true },
      });

      if (existingPhoneUser) {
        throw new BadRequestError(API_MESSAGES.PHONE_ALREADY_EXISTS);
      }

      // Check if email already exists
      if (email) {
        const existingEmailUser = await prisma.authUser.findUnique({
          where: { email },
          select: { id: true },
        });

        if (existingEmailUser) {
          throw new BadRequestError(API_MESSAGES.EMAIL_ALREADY_EXISTS);
        }
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create auth user
      const authUser = await prisma.authUser.create({
        data: {
          email: email || undefined,
          phoneNumber,
          passwordHash: hashedPassword,
          role: (role as any) || "STUDENT", // Cast to Role enum
          isEmailVerified: !!email, // Email counts as verified on registration
          isMobileVerified: false,
          type: "LOCAL",
          maxLoginDevice: 5,
          themeMode: "light",
        } as any, // Cast entire data object
      });

      // If role is STUDENT, create StudentProfile with new fields
      if ((role as any) === "STUDENT" || !role) {
        await prisma.studentProfile.create({
          data: {
            authUserId: authUser.id,
            isProfileCompleted: false,
            status: "ACTIVE",
            // Use type casting for new fields
          } as any,
        });
      }

      logger.info(`User registered successfully: ${authUser.id}`);

      return {
        message: API_MESSAGES.USER_CREATED,
        data: {
          userId: authUser.id,
          isEmailVerified: authUser.isEmailVerified,
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
      const { phoneNumber, password } = dto;

      // Find user
      const authUser = await prisma.authUser.findUnique({
        where: { phoneNumber },
      });

      if (!authUser) {
        throw new NotFoundError(API_MESSAGES.USER_NOT_FOUND);
      }

      // Verify password
      const isValidPassword = await comparePasswords(password, authUser.passwordHash);
      if (!isValidPassword) {
        throw new UnauthorizedError(API_MESSAGES.INVALID_CREDENTIALS);
      }

      // Generate token
      const token = generateToken({
        id: authUser.id,
        role: authUser.role as "OWNER" | "ADMIN" | "STUDENT",
      });

      // Save token to authUser.tokens JSON array (no longer separate table)
      // Cast tokens to any since Prisma types might not be fully updated
      const existingTokens = Array.isArray((authUser as any).tokens)
        ? (authUser as any).tokens
        : [];
      const newTokenRecord = {
        id: Math.random().toString(36).substring(2, 11),
        token,
        expireAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        isActive: true,
        createdAt: new Date(),
      };

      await prisma.authUser.update({
        where: { id: authUser.id },
        data: {
          tokens: [...existingTokens, newTokenRecord] as any,
          lastLogin: new Date(),
        },
      });

      logger.info(`User logged in successfully: ${authUser.id}`);

      return {
        message: API_MESSAGES.LOGIN_SUCCESS,
        data: {
          token,
          id: authUser.id,
          email: authUser.email || undefined,
          phoneNumber: authUser.phoneNumber,
          role: authUser.role as "OWNER" | "ADMIN" | "STUDENT",
          isEmailVerified: authUser.isEmailVerified,
          isMobileVerified: (authUser as any).isMobileVerified || false,
          isAccountVerified: (authUser as any).isAccountVerified || false,
          isActive: authUser.isActive,
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
  async requestSendOtp(dto: { phoneNumber: string }): Promise<{
    message: string;
    data: { userId: string };
  }> {
    const prisma = getPrisma();
    try {
      const { phoneNumber } = dto;

      const authUser = await prisma.authUser.findUnique({
        where: { phoneNumber },
      });

      if (!authUser) {
        throw new NotFoundError(API_MESSAGES.USER_NOT_FOUND);
      }

      // Generate OTP code
      const otpCode = generateOTPCode();
      // In real implementation, this would be hashed before storing
      const tokenHash = otpCode;

      // Create verification token in JSON array
      const existingVerificationTokens = Array.isArray((authUser as any).verificationTokens)
        ? (authUser as any).verificationTokens
        : [];

      const newVerificationToken = {
        id: Math.random().toString(36).substring(2, 11),
        tokenHash,
        type: "VERIFY_PHONE",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        isUsed: false,
        createdAt: new Date(),
      };

      await prisma.authUser.update({
        where: { id: authUser.id },
        data: {
          verificationTokens: [...existingVerificationTokens, newVerificationToken] as any,
        },
      });

      logger.info(`OTP sent to user: ${authUser.id}`);

      return {
        message: API_MESSAGES.OTP_SENT,
        data: { userId: authUser.id },
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

      const authUser = await prisma.authUser.findUnique({
        where: { id: userId },
      });

      if (!authUser) {
        throw new NotFoundError(API_MESSAGES.USER_NOT_FOUND);
      }

      // Search for verification token in JSON array
      const verificationTokens = Array.isArray((authUser as any).verificationTokens)
        ? (authUser as any).verificationTokens
        : [];

      const tokenIndex = verificationTokens.findIndex(
        (t: any) => t.tokenHash === code && !t.isUsed && new Date(t.expiresAt) > new Date()
      );

      if (tokenIndex === -1) {
        throw new BadRequestError("Invalid or expired OTP");
      }

      // Mark token as used
      const updatedTokens = [...verificationTokens];
      updatedTokens[tokenIndex].isUsed = true;

      await prisma.authUser.update({
        where: { id: userId },
        data: {
          isMobileVerified: true,
          isActive: true,
          verificationTokens: updatedTokens as any,
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
  async requestPasswordReset(dto: { phoneNumber: string }): Promise<{
    message: string;
    data: { userId: string };
  }> {
    const prisma = getPrisma();
    try {
      const { phoneNumber } = dto;

      const authUser = await prisma.authUser.findUnique({
        where: { phoneNumber },
      });

      if (!authUser) {
        throw new NotFoundError(API_MESSAGES.USER_NOT_FOUND);
      }

      // Generate reset code
      const resetCode = generateOTPCode();

      // Create PASSWORD_RESET verification token in JSON array
      const existingVerificationTokens = Array.isArray((authUser as any).verificationTokens)
        ? (authUser as any).verificationTokens
        : [];

      const newResetToken = {
        id: Math.random().toString(36).substring(2, 11),
        tokenHash: resetCode,
        type: "PASSWORD_RESET",
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
        isUsed: false,
        createdAt: new Date(),
      };

      await prisma.authUser.update({
        where: { id: authUser.id },
        data: {
          verificationTokens: [...existingVerificationTokens, newResetToken] as any,
        },
      });

      logger.info(`Password reset code sent to user: ${authUser.id}`);

      return {
        message: "Password reset code sent successfully",
        data: { userId: authUser.id },
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

      const authUser = await prisma.authUser.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      if (!authUser) {
        throw new NotFoundError(API_MESSAGES.USER_NOT_FOUND);
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);

      await prisma.authUser.update({
        where: { id: userId },
        data: {
          passwordHash: hashedPassword,
          passwordChangedAt: new Date(), // Record when password was changed
        } as any,
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

      const authUser = await prisma.authUser.findUnique({
        where: { id: userId },
      });

      if (!authUser) {
        throw new NotFoundError(API_MESSAGES.USER_NOT_FOUND);
      }

      return {
        message: "Auth data fetched successfully",
        data: {
          id: authUser.id,
          email: authUser.email || undefined,
          phoneNumber: authUser.phoneNumber,
          role: authUser.role as "OWNER" | "ADMIN" | "STUDENT",
          isEmailVerified: authUser.isEmailVerified,
          isMobileVerified: (authUser as any).isMobileVerified || false,
          isAccountVerified: (authUser as any).isAccountVerified || false,
          isActive: authUser.isActive,
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
