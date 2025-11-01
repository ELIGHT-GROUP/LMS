/**
 * Authentication Service
 * ======================
 * Business logic for user registration, login, and authentication
 * Using Prisma ORM for database operations
 */

import bcrypt from "bcryptjs";
import { getPrisma } from "../config/database";
import { generateToken } from "../utils/jwt";
import {
  IRegisterStudentDto,
  ILoginUserDto,
  IUserProfile,
  IUpdateStudentProfileDto,
  IEmailVerificationRequestDto,
  IEmailVerificationDto,
  IPasswordResetRequestDto,
  IPasswordResetDto,
  IStudentProfileResponse,
} from "../types";
import {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
  InternalServerError,
} from "../utils/errors";
import logger from "../utils/logger";
import { API_MESSAGES } from "../constants/enums";

/**
 * Helper function to generate 6-digit code
 */
const generateCode = (): string => {
  return "123456"; // Hardcoded until email integration
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
 * Student Authentication Service - All student auth-related operations
 */
export const StudentAuthService = {
  /**
   * Register a new student
   */
  async registerStudent(dto: IRegisterStudentDto): Promise<{
    message: string;
    data: { userId: string; email: string };
  }> {
    const prisma = getPrisma();
    try {
      const { email, password, googleToken } = dto;

      // Validate that at least one auth method is provided
      if (!password && !googleToken) {
        throw new BadRequestError("Password or Google token required");
      }

      // Check if email already exists
      const existingUser = await prisma.authUser.findUnique({
        where: { email },
        select: { id: true },
      });

      if (existingUser) {
        throw new BadRequestError(API_MESSAGES.EMAIL_ALREADY_EXISTS);
      }

      let authUserData: any = {
        email,
        role: "STUDENT",
        type: "LOCAL",
        isEmailVerified: true,
        isMobileVerified: false,
        isAccountVerified: false,
        maxLoginDevice: 5,
        themeMode: "light",
        tokens: [],
        verification_tokens: [],
      };

      // Normal signup
      if (password) {
        const hashedPassword = await hashPassword(password);
        authUserData.passwordHash = hashedPassword;
        authUserData.provider = "LOCAL";
      }

      // Google signup
      if (googleToken) {
        // TODO: Verify Google token with Google API
        authUserData.provider = "GOOGLE";
        authUserData.providerId = "google_sub_placeholder";
        authUserData.googleId = googleToken;
      }

      // Create auth user
      const authUser = await prisma.authUser.create({
        data: authUserData as any,
      });

      // Create StudentProfile
      await prisma.studentProfile.create({
        data: {
          authUserId: authUser.id,
          signUpVia: googleToken ? "GOOGLE" : "WEB",
          isProfileCompleted: false,
          status: "PENDING",
          approvalStatus: "PENDING",
        } as any,
      });

      logger.info(`Student registered successfully: ${authUser.id}`);

      return {
        message: API_MESSAGES.USER_CREATED,
        data: {
          userId: authUser.id,
          email: authUser.email!,
        },
      };
    } catch (error) {
      logger.error("Error in registerStudent:", error);
      if (error instanceof BadRequestError) {
        throw error;
      }
      throw new InternalServerError("Registration failed");
    }
  },

  /**
   * Update student profile
   */
  async updateStudentProfile(
    userId: string,
    dto: IUpdateStudentProfileDto
  ): Promise<{
    message: string;
    data: IStudentProfileResponse;
  }> {
    const prisma = getPrisma();
    try {
      // Find user and profile
      const authUser = await prisma.authUser.findUnique({
        where: { id: userId },
      });

      if (!authUser) {
        throw new NotFoundError(API_MESSAGES.USER_NOT_FOUND);
      }

      if (authUser.role !== "STUDENT") {
        throw new BadRequestError("User is not a student");
      }

      const studentProfile = await prisma.studentProfile.findUnique({
        where: { authUserId: userId },
      });

      if (!studentProfile) {
        throw new NotFoundError("Student profile not found");
      }

      // Update StudentProfile
      const updated = await prisma.studentProfile.update({
        where: { id: studentProfile.id },
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          dob: dto.dob ? new Date(dto.dob) : undefined,
          gender: dto.gender,
          profilePicture: dto.profilePicture,
          pushId: dto.pushId,
          year: dto.year,
          nic: dto.nic,
          nicPic: dto.nicPic,
          registerCode: dto.registerCode,
          extraDetails: dto.extraDetails as any,
          deliveryDetails: dto.deliveryDetails as any,
          isProfileCompleted: true,
        },
      });

      // Update AuthUser
      await prisma.authUser.update({
        where: { id: userId },
        data: { isAccountVerified: true },
      });

      logger.info(`Student profile updated: ${userId}`);

      return {
        message: "Student profile updated successfully",
        data: {
          id: updated.id,
          firstName: updated.firstName || undefined,
          lastName: updated.lastName || undefined,
          email: authUser.email!,
          isProfileCompleted: updated.isProfileCompleted,
          approvalStatus: updated.approvalStatus,
        },
      };
    } catch (error) {
      logger.error("Error in updateStudentProfile:", error);
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError("Profile update failed");
    }
  },

  /**
   * Request email verification code
   */
  async requestEmailVerification(dto: IEmailVerificationRequestDto): Promise<{
    message: string;
    data: { userId: string; code: string };
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

      if (authUser.isEmailVerified) {
        throw new BadRequestError("Email already verified");
      }

      const code = generateCode();

      const existingTokens = Array.isArray((authUser as any).verificationTokens)
        ? (authUser as any).verificationTokens
        : [];

      const newVerificationToken = {
        id: Math.random().toString(36).substring(2, 11),
        tokenHash: code,
        type: "VERIFY_EMAIL",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        isUsed: false,
        createdAt: new Date(),
      };

      await prisma.authUser.update({
        where: { id: userId },
        data: {
          verificationTokens: [...existingTokens, newVerificationToken] as any,
        },
      });

      logger.info(`Email verification code sent to: ${userId}`);

      return {
        message: "Verification code sent to email",
        data: { userId, code },
      };
    } catch (error) {
      logger.error("Error in requestEmailVerification:", error);
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError("Email verification request failed");
    }
  },

  /**
   * Verify email with code
   */
  async verifyEmail(dto: IEmailVerificationDto): Promise<{
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

      const verificationTokens = Array.isArray((authUser as any).verificationTokens)
        ? (authUser as any).verificationTokens
        : [];

      const tokenIndex = verificationTokens.findIndex(
        (t: any) =>
          t.tokenHash === code &&
          t.type === "VERIFY_EMAIL" &&
          !t.isUsed &&
          new Date(t.expiresAt) > new Date()
      );

      if (tokenIndex === -1) {
        throw new BadRequestError("Invalid or expired code");
      }

      const updatedTokens = [...verificationTokens];
      updatedTokens[tokenIndex].isUsed = true;

      await prisma.authUser.update({
        where: { id: userId },
        data: {
          isEmailVerified: true,
          verificationTokens: updatedTokens as any,
        },
      });

      logger.info(`Email verified for user: ${userId}`);

      return { message: "Email verified successfully" };
    } catch (error) {
      logger.error("Error in verifyEmail:", error);
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError("Email verification failed");
    }
  },

  /**
   * Login user with email and password
   */
  async loginUser(dto: ILoginUserDto): Promise<{
    message: string;
    data: {
      token: string;
      id: string;
      email: string;
      role: string;
      isEmailVerified: boolean;
      isAccountVerified: boolean;
      isActive: boolean;
    };
  }> {
    const prisma = getPrisma();
    try {
      const { email, password } = dto;

      // Find user
      const authUser = await prisma.authUser.findUnique({
        where: { email },
      });

      if (!authUser) {
        throw new NotFoundError(API_MESSAGES.USER_NOT_FOUND);
      }

      if (!authUser.passwordHash) {
        throw new UnauthorizedError("Password not set for this account");
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

      // Save token to JSON array
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
          email: authUser.email!,
          role: authUser.role as "OWNER" | "ADMIN" | "STUDENT",
          isEmailVerified: authUser.isEmailVerified,
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
   * Request password reset
   */
  async requestPasswordReset(dto: IPasswordResetRequestDto): Promise<{
    message: string;
    data: { userId: string; code: string };
  }> {
    const prisma = getPrisma();
    try {
      const { email } = dto;

      const authUser = await prisma.authUser.findUnique({
        where: { email },
      });

      if (!authUser) {
        throw new NotFoundError(API_MESSAGES.USER_NOT_FOUND);
      }

      const code = generateCode();

      const existingVerificationTokens = Array.isArray((authUser as any).verificationTokens)
        ? (authUser as any).verificationTokens
        : [];

      const newResetToken = {
        id: Math.random().toString(36).substring(2, 11),
        tokenHash: code,
        type: "PASSWORD_RESET",
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        isUsed: false,
        createdAt: new Date(),
      };

      await prisma.authUser.update({
        where: { id: authUser.id },
        data: {
          verificationTokens: [...existingVerificationTokens, newResetToken] as any,
        },
      });

      logger.info(`Password reset code sent to: ${authUser.id}`);

      return {
        message: "Password reset code sent to email",
        data: { userId: authUser.id, code },
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
   * Reset password
   */
  async resetPassword(dto: IPasswordResetDto): Promise<{
    message: string;
  }> {
    const prisma = getPrisma();
    try {
      const { userId, code, newPassword } = dto;

      const authUser = await prisma.authUser.findUnique({
        where: { id: userId },
      });

      if (!authUser) {
        throw new NotFoundError(API_MESSAGES.USER_NOT_FOUND);
      }

      const verificationTokens = Array.isArray((authUser as any).verificationTokens)
        ? (authUser as any).verificationTokens
        : [];

      const tokenIndex = verificationTokens.findIndex(
        (t: any) =>
          t.tokenHash === code &&
          t.type === "PASSWORD_RESET" &&
          !t.isUsed &&
          new Date(t.expiresAt) > new Date()
      );

      if (tokenIndex === -1) {
        throw new BadRequestError("Invalid or expired code");
      }

      const updatedTokens = [...verificationTokens];
      updatedTokens[tokenIndex].isUsed = true;

      const hashedPassword = await hashPassword(newPassword);

      await prisma.authUser.update({
        where: { id: userId },
        data: {
          passwordHash: hashedPassword,
          passwordChangedAt: new Date(),
          verificationTokens: updatedTokens as any,
        } as any,
      });

      logger.info(`Password reset for user: ${userId}`);

      return { message: API_MESSAGES.PASSWORD_RESET_SUCCESS };
    } catch (error) {
      logger.error("Error in resetPassword:", error);
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError("Password reset failed");
    }
  },

  /**
   * Get authenticated user data
   */
  async authData(userId: string): Promise<{
    message: string;
    data: IUserProfile;
  }> {
    const prisma = getPrisma();
    try {
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
          email: authUser.email!,
          role: authUser.role as "OWNER" | "ADMIN" | "STUDENT",
          isEmailVerified: authUser.isEmailVerified,
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
