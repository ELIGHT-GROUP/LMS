/**
 * OAuth Controller
 * ================
 * Handles Google OAuth flow for student and admin signup
 */

import { Request, Response } from "express";
import { asyncHandler } from "../middleware/async-handler.middleware";
import {
  generateOAuthState,
  validateOAuthState,
  generateGoogleOAuthUrl,
  exchangeGoogleCode,
  verifyGoogleToken,
  generateFrontendRedirectUrl,
} from "../utils/oauth";
import { StudentAuthService } from "../services/auth.service";
import { AdminAuthService } from "../services/admin-auth.service";
import logger from "../utils/logger";

/**
 * Initiate Google OAuth flow
 * GET /api/auth/google/initiate?role=STUDENT|ADMIN&invitationToken=optional
 *
 * Frontend redirects user to this endpoint, which then redirects to Google
 * Query parameters are validated by validateQuery middleware
 */
export const initiateGoogleOAuth = asyncHandler(async (req: Request, res: Response) => {
  const { role, invitationToken } = req.query as { role: string; invitationToken?: string };

  // Generate state with encryption
  const state = generateOAuthState(role as "STUDENT" | "ADMIN", invitationToken);

  // Generate Google OAuth URL
  const oauthUrl = generateGoogleOAuthUrl(state);

  logger.info(`OAuth flow initiated for ${role}`);

  // Redirect to Google
  res.redirect(oauthUrl);
});

/**
 * Google OAuth callback
 * GET /api/auth/google/callback?code=xxx&state=yyy
 *
 * Google redirects user back to this endpoint after consent
 * Query parameters are validated by validateQuery middleware
 */
export const googleOAuthCallback = asyncHandler(async (req: Request, res: Response) => {
  const { code, state, error, error_description } = req.query as {
    code?: string;
    state: string;
    error?: string;
    error_description?: string;
  };

  // Handle Google errors
  if (error) {
    logger.error(`Google OAuth error: ${error} - ${error_description}`);
    res.redirect(
      `${process.env.FRONTEND_REDIRECT_URL}/auth-error?error=${error}&description=${error_description}`
    );
    return;
  }

  if (!code) {
    logger.error("Missing code in OAuth callback");
    throw new Error("Missing authorization code");
  }

  try {
    // Validate and decode state
    const oauthState = validateOAuthState(state);

    // Exchange code for tokens
    const { idToken } = await exchangeGoogleCode(code);

    // Verify and decode Google token
    const googleData = await verifyGoogleToken(idToken);

    let jwtToken: string;
    let userId: string;
    let userRole: string;

    // Handle student signup
    if (oauthState.role === "STUDENT") {
      const result = await StudentAuthService.registerStudentWithGoogle(
        googleData.email,
        googleData
      );

      userId = result.data.userId;
      userRole = "STUDENT";
      jwtToken = result.data.token;

      logger.info(`Student registered via Google: ${userId}`);
    }

    // Handle admin signup
    else if (oauthState.role === "ADMIN") {
      if (!oauthState.invitationToken) {
        throw new Error("Invitation token required for admin signup");
      }

      const result = await AdminAuthService.registerAdminWithGoogle(
        oauthState.invitationToken,
        googleData.email,
        googleData
      );

      userId = result.data.userId;
      userRole = "ADMIN";
      jwtToken = result.data.token;

      logger.info(`Admin registered via Google: ${userId}`);
    } else {
      throw new Error("Invalid role");
    }

    // Generate frontend redirect URL with token
    const redirectUrl = generateFrontendRedirectUrl(jwtToken, userId, userRole);

    // Redirect to frontend with JWT
    res.redirect(redirectUrl);
  } catch (error) {
    logger.error("Google OAuth callback error:", error);

    const errorMessage = error instanceof Error ? error.message : "Authentication failed";

    res.redirect(
      `${process.env.FRONTEND_REDIRECT_URL}/auth-error?error=oauth_failed&description=${encodeURIComponent(errorMessage)}`
    );
  }
});
