/**
 * Admin Authentication Service
 * =============================
 * Business logic for admin-specific operations:
 * - Creating admin invitations
 * - Registering admins with invitation tokens
 * - Updating admin profiles
 * - Assigning permissions to admins
 */

import bcrypt from "bcryptjs";
import crypto from "crypto";
import { getPrisma } from "../config/database";
import { generateToken } from "../utils/jwt";
import {
  IAdminInvitationDto,
  IRegisterAdminDto,
  IUpdateAdminProfileDto,
  IAssignPermissionsDto,
  IInvitationResponse,
  IAdminProfileResponse,
} from "../types";
import {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
  InternalServerError,
  ForbiddenError,
} from "../utils/errors";
import logger from "../utils/logger";
import { API_MESSAGES } from "../constants/enums";
import { verifyGoogleToken } from "../utils/oauth";

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
 * Generate invitation token
 */
const generateInvitationToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

/**
 * Admin Authentication Service
 */
export const AdminAuthService = {
  /**
   * Create an invitation for a new admin (OWNER only)
   */
  async createInvitation(
    dto: IAdminInvitationDto,
    ownerId: string
  ): Promise<{
    message: string;
    data: IInvitationResponse;
  }> {
    const prisma = getPrisma();
    try {
      const { email, role } = dto;

      // Verify requester is OWNER
      const owner = await prisma.authUser.findUnique({
        where: { id: ownerId },
      });

      if (!owner || owner.role !== "OWNER") {
        throw new ForbiddenError("Only OWNER can create invitations");
      }

      // Check if email already exists
      const existingUser = await prisma.authUser.findUnique({
        where: { email },
        select: { id: true },
      });

      if (existingUser) {
        throw new BadRequestError(API_MESSAGES.EMAIL_ALREADY_EXISTS);
      }

      // Generate invitation token
      const token = generateInvitationToken();
      const tokenHash = await hashPassword(token);

      // Create invitation record
      const invitation = await prisma.invitation.create({
        data: {
          email,
          tokenHash,
          status: "PENDING",
          role,
          invitedBy: ownerId,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        } as any,
      });

      logger.info(`Admin invitation created: ${invitation.id} for ${email}`);

      return {
        message: "Invitation created successfully",
        data: {
          invitationLink: `${process.env.FRONTEND_URL}/admin/register?token=${token}`,
          expiresAt: (invitation.expiresAt as Date).toISOString(),
        },
      };
    } catch (error) {
      logger.error("Error in createInvitation:", error);
      if (error instanceof BadRequestError || error instanceof ForbiddenError) {
        throw error;
      }
      throw new InternalServerError("Invitation creation failed");
    }
  },

  /**
   * Register admin with invitation token (password-based)
   */
  async registerAdmin(dto: IRegisterAdminDto): Promise<{
    message: string;
    data: { userId: string; email: string; token: string };
  }> {
    const prisma = getPrisma();
    try {
      const { email, password, invitationToken } = dto;

      // Find and validate invitation
      const invitation = await prisma.invitation.findFirst({
        where: { email },
      });

      if (!invitation) {
        throw new BadRequestError("No active invitation for this email");
      }

      // Check if invitation is still valid
      if (invitation.status !== "PENDING" || new Date() > (invitation.expiresAt as Date)) {
        throw new BadRequestError("Invitation has expired");
      }

      // Verify invitation token
      const isValidToken = await comparePasswords(invitationToken, (invitation as any).tokenHash);
      if (!isValidToken) {
        throw new UnauthorizedError("Invalid invitation token");
      }

      // Check if email already registered
      const existingUser = await prisma.authUser.findUnique({
        where: { email },
        select: { id: true },
      });

      if (existingUser) {
        throw new BadRequestError(API_MESSAGES.EMAIL_ALREADY_EXISTS);
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create AuthUser
      const authUser = await prisma.authUser.create({
        data: {
          email,
          role: invitation.role || "ADMIN",
          type: "LOCAL",
          provider: "LOCAL",
          passwordHash: hashedPassword,
          isEmailVerified: true,
          isMobileVerified: false,
          isAccountVerified: false,
          maxLoginDevice: 5,
          themeMode: "light",
          tokens: [],
          verification_tokens: [],
        } as any,
      });

      // Create AdminProfile
      await prisma.adminProfile.create({
        data: {
          authUserId: authUser.id,
          signUpVia: "WEB",
          isProfileCompleted: false,
          status: "PENDING",
        } as any,
      });

      // Update invitation to ACCEPTED
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: {
          status: "ACCEPTED",
          acceptedBy: authUser.id,
          acceptedAt: new Date(),
        } as any,
      });

      // Generate token for immediate login
      const token = generateToken({
        id: authUser.id,
        role: (invitation.role || "ADMIN") as "OWNER" | "ADMIN" | "STUDENT",
      });

      // Save token to JSON array
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
          tokens: [newTokenRecord] as any,
          lastLogin: new Date(),
        },
      });

      logger.info(`Admin registered successfully: ${authUser.id}`);

      return {
        message: "Admin registered successfully",
        data: {
          userId: authUser.id,
          email: authUser.email!,
          token,
        },
      };
    } catch (error) {
      logger.error("Error in registerAdmin:", error);
      if (error instanceof BadRequestError || error instanceof UnauthorizedError) {
        throw error;
      }
      throw new InternalServerError("Admin registration failed");
    }
  },

  /**
   * Update admin profile
   */
  async updateAdminProfile(
    userId: string,
    dto: IUpdateAdminProfileDto
  ): Promise<{
    message: string;
    data: IAdminProfileResponse;
  }> {
    const prisma = getPrisma();
    try {
      // Find user and verify is ADMIN or OWNER
      const authUser = await prisma.authUser.findUnique({
        where: { id: userId },
      });

      if (!authUser) {
        throw new NotFoundError(API_MESSAGES.USER_NOT_FOUND);
      }

      if (authUser.role !== "ADMIN" && authUser.role !== "OWNER") {
        throw new BadRequestError("User is not an admin");
      }

      // Find admin profile
      const adminProfile = await prisma.adminProfile.findUnique({
        where: { authUserId: userId },
      });

      if (!adminProfile) {
        throw new NotFoundError("Admin profile not found");
      }

      // Update AdminProfile
      const updated = await prisma.adminProfile.update({
        where: { id: adminProfile.id },
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          image: dto.image,
          type: dto.type,
        },
      });

      // Update AuthUser
      await prisma.authUser.update({
        where: { id: userId },
        data: { isAccountVerified: true },
      });

      logger.info(`Admin profile updated: ${userId}`);

      return {
        message: "Admin profile updated successfully",
        data: {
          id: updated.id,
          firstName: updated.firstName || undefined,
          lastName: updated.lastName || undefined,
          email: authUser.email!,
          type: updated.type || undefined,
          status: "COMPLETED",
        },
      };
    } catch (error) {
      logger.error("Error in updateAdminProfile:", error);
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError("Profile update failed");
    }
  },

  /**
   * Assign permissions to admin (OWNER only)
   */
  async assignPermissions(
    adminId: string,
    ownerId: string,
    dto: IAssignPermissionsDto
  ): Promise<{
    message: string;
    data: { permissionsAssigned: number };
  }> {
    const prisma = getPrisma();
    try {
      // Verify requester is OWNER
      const owner = await prisma.authUser.findUnique({
        where: { id: ownerId },
      });

      if (!owner || owner.role !== "OWNER") {
        throw new ForbiddenError("Only OWNER can assign permissions");
      }

      // Verify target is ADMIN
      const admin = await prisma.authUser.findUnique({
        where: { id: adminId },
      });

      if (!admin || admin.role !== "ADMIN") {
        throw new BadRequestError("User is not an admin");
      }

      // Get admin profile
      const adminProfile = await prisma.adminProfile.findUnique({
        where: { authUserId: adminId },
      });

      if (!adminProfile) {
        throw new NotFoundError("Admin profile not found");
      }

      const { permissions } = dto;

      // Get permission records for the given names/keys
      const permissionRecords = await prisma.permission.findMany({
        where: { name: { in: permissions } },
      });

      if (permissionRecords.length !== permissions.length) {
        throw new BadRequestError("Some permissions do not exist");
      }

      // Remove existing permissions for this admin profile
      await prisma.adminPermission.deleteMany({
        where: {
          adminProfileId: adminProfile.id,
        },
      });

      // Assign new permissions
      const assignedPermissions = await Promise.all(
        permissionRecords.map((permission) =>
          prisma.adminPermission.create({
            data: {
              adminProfileId: adminProfile.id,
              permissionId: permission.id,
              isActive: true,
            } as any,
          })
        )
      );

      logger.info(`Permissions assigned to admin ${adminId}: ${assignedPermissions.length}`);

      return {
        message: "Permissions assigned successfully",
        data: { permissionsAssigned: assignedPermissions.length },
      };
    } catch (error) {
      logger.error("Error in assignPermissions:", error);
      if (
        error instanceof BadRequestError ||
        error instanceof ForbiddenError ||
        error instanceof NotFoundError
      ) {
        throw error;
      }
      throw new InternalServerError("Permission assignment failed");
    }
  },

  /**
   * Register admin with Google OAuth and invitation token
   */
  async registerAdminWithGoogle(
    invitationToken: string,
    email: string,
    googleData: any
  ): Promise<{
    message: string;
    data: { userId: string; email: string; token: string };
  }> {
    const prisma = getPrisma();
    try {
      // Find and validate invitation
      const invitation = await prisma.invitation.findFirst({
        where: { email },
      });

      if (!invitation) {
        throw new BadRequestError("No active invitation for this email");
      }

      // Check if invitation is still valid
      if (invitation.status !== "PENDING") {
        throw new BadRequestError("Invitation has already been used");
      }

      if ((invitation.expiresAt as Date) < new Date()) {
        throw new BadRequestError("Invitation has expired");
      }

      // Verify invitation token matches
      const isValidToken = await comparePasswords(invitationToken, (invitation as any).tokenHash);
      if (!isValidToken) {
        throw new UnauthorizedError("Invalid invitation token");
      }

      // Verify Google data email matches invitation
      if (email !== invitation.email) {
        throw new BadRequestError("Email mismatch with invitation");
      }

      // Check if email already exists
      const existingUser = await prisma.authUser.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new BadRequestError(API_MESSAGES.EMAIL_ALREADY_EXISTS);
      }

      // Create AuthUser
      const authUser = await prisma.authUser.create({
        data: {
          email,
          role: "ADMIN",
          type: "LOCAL",
          provider: "GOOGLE",
          providerId: googleData.sub,
          googleId: googleData.sub,
          isEmailVerified: true, // Google verified email
          isMobileVerified: false,
          isAccountVerified: false,
          maxLoginDevice: 5,
          themeMode: "light",
          tokens: [],
          verification_tokens: [],
        } as any,
      });

      // Create AdminProfile
      await prisma.adminProfile.create({
        data: {
          authUserId: authUser.id,
          signUpVia: "GOOGLE",
          isProfileCompleted: false,
          status: "PENDING",
          firstName: googleData.given_name,
          lastName: googleData.family_name,
          image: googleData.picture,
        } as any,
      });

      // Update invitation to ACCEPTED
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: {
          status: "ACCEPTED",
          acceptedBy: authUser.id,
          acceptedAt: new Date(),
        } as any,
      });

      // Generate JWT token
      const token = generateToken({
        id: authUser.id,
        role: authUser.role,
      });

      logger.info(`Admin registered via Google: ${authUser.id}`);

      return {
        message: "Admin registered successfully",
        data: {
          userId: authUser.id,
          email: authUser.email!,
          token,
        },
      };
    } catch (error) {
      logger.error("Error in registerAdminWithGoogle:", error);
      if (error instanceof BadRequestError || error instanceof UnauthorizedError) {
        throw error;
      }
      throw new InternalServerError("Admin Google registration failed");
    }
  },
};
