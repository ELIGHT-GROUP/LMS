/**
 * Admin Authentication Controller
 * ===============================
 * Handles admin-specific authentication endpoints
 */

import { Request, Response } from "express";
import { AdminAuthService } from "../services/admin-auth.service";
import { asyncHandler } from "../middleware/async-handler.middleware";
import logger from "../utils/logger";
import { successResponse } from "../utils/response";

// Import schemas when they're created
// import {
//   adminInvitationSchema,
//   adminRegistrationSchema,
//   updateAdminProfileSchema,
//   assignPermissionsSchema,
// } from "../validators/auth.validators";

/**
 * Create admin invitation
 * POST /auth/admin/invite
 * Headers: Authorization token (OWNER only)
 * Body: { email, role }
 */
export const createInvitation = asyncHandler(async (req: Request, res: Response) => {
  const ownerId = (req as any).user?.userId; // From auth middleware
  if (!ownerId) {
    throw new Error("User ID not found in request");
  }
  // TODO: Add validation with adminInvitationSchema
  const result = await AdminAuthService.createInvitation(req.body, ownerId);

  successResponse(res, result.message, result.data, 201);
});

/**
 * Register admin with invitation token
 * POST /auth/admin/register
 * Body: { email?, password?, googleToken?, invitationToken }
 */
export const registerAdmin = asyncHandler(async (req: Request, res: Response) => {
  // TODO: Add validation with adminRegistrationSchema
  const result = await AdminAuthService.registerAdmin(req.body);

  successResponse(res, result.message, result.data, 201);
});

/**
 * Update admin profile
 * PUT /auth/admin/profile
 * Headers: Authorization token
 * Body: { firstName?, lastName?, image?, type? }
 */
export const updateAdminProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId; // From auth middleware
  if (!userId) {
    throw new Error("User ID not found in request");
  }
  // TODO: Add validation with updateAdminProfileSchema
  const result = await AdminAuthService.updateAdminProfile(userId, req.body);

  successResponse(res, result.message, result.data);
});

/**
 * Assign permissions to admin
 * POST /auth/admin/:adminId/permissions
 * Headers: Authorization token (OWNER only)
 * Body: { permissions: string[] }
 * Params: { adminId }
 */
export const assignPermissions = asyncHandler(async (req: Request, res: Response) => {
  const ownerId = (req as any).user?.userId; // From auth middleware
  if (!ownerId) {
    throw new Error("User ID not found in request");
  }
  const { adminId } = req.params;
  // TODO: Add validation with assignPermissionsSchema
  const result = await AdminAuthService.assignPermissions(adminId, ownerId, req.body);

  successResponse(res, result.message, result.data);
});
