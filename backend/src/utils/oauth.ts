/**
 * OAuth Utilities
 * ===============
 * Google OAuth handling, state management, and token verification
 */

import crypto from "crypto";
import jwt from "jsonwebtoken";
import axios from "axios";
import { getEnv } from "../config/env";
import { BadRequestError, UnauthorizedError } from "./errors";
import logger from "./logger";

/**
 * OAuth State structure
 * Encrypted and sent to frontend, returned in callback
 */
interface OAuthState {
  nonce: string; // Random nonce for security
  invitationToken?: string; // Optional for admin signup
  role: "STUDENT" | "ADMIN"; // User role being registered
  timestamp: number; // When state was created
}

/**
 * Google Token Payload
 * Decoded from Google ID token
 */
interface GoogleTokenPayload {
  iss: string;
  azp: string;
  aud: string;
  sub: string; // Google user ID
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
  iat: number;
  exp: number;
}

/**
 * Generate OAuth state
 * Includes encryption for invitation token (if applicable)
 */
export const generateOAuthState = (role: "STUDENT" | "ADMIN", invitationToken?: string): string => {
  const state: OAuthState = {
    nonce: crypto.randomBytes(16).toString("hex"),
    role,
    ...(invitationToken && { invitationToken }),
    timestamp: Date.now(),
  };

  // Encrypt state using JWT so it can't be tampered with
  const encrypted = jwt.sign(state, getEnv("JWT_SECRET"), {
    expiresIn: "15m", // State expires in 15 minutes
  });

  return encrypted;
};

/**
 * Validate and decode OAuth state
 */
export const validateOAuthState = (state: string): OAuthState => {
  try {
    const decoded = jwt.verify(state, getEnv("JWT_SECRET")) as OAuthState;
    return decoded;
  } catch (error) {
    logger.error("Invalid OAuth state:", error);
    throw new BadRequestError("Invalid or expired OAuth state");
  }
};

/**
 * Generate Google OAuth URL
 */
export const generateGoogleOAuthUrl = (state: string): string => {
  const clientId = getEnv("GOOGLE_CLIENT_ID");
  const redirectUri = getEnv("GOOGLE_REDIRECT_URI");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "consent",
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

/**
 * Exchange authorization code for tokens
 */
export const exchangeGoogleCode = async (code: string): Promise<{ idToken: string }> => {
  try {
    const clientId = getEnv("GOOGLE_CLIENT_ID");
    const clientSecret = getEnv("GOOGLE_CLIENT_SECRET");
    const redirectUri = getEnv("GOOGLE_REDIRECT_URI");

    const response = await axios.post("https://oauth2.googleapis.com/token", {
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    });

    return {
      idToken: response.data.id_token,
    };
  } catch (error) {
    logger.error("Google token exchange failed:", error);
    throw new BadRequestError("Failed to exchange Google authorization code");
  }
};

/**
 * Verify and decode Google ID token
 * Validates token signature and returns claims
 */
export const verifyGoogleToken = async (idToken: string): Promise<GoogleTokenPayload> => {
  try {
    const clientId = getEnv("GOOGLE_CLIENT_ID");

    // Fetch Google's public keys
    const keysResponse = await axios.get("https://www.googleapis.com/oauth2/v1/certs");
    const keys = keysResponse.data;

    // Decode without verification first to get kid
    const decoded = jwt.decode(idToken, { complete: true }) as any;
    if (!decoded) {
      throw new Error("Invalid token format");
    }

    const { kid } = decoded.header;
    const key = keys[kid];

    if (!key) {
      throw new Error("Key not found");
    }

    // Verify token with public key
    const payload = jwt.verify(idToken, key, {
      algorithms: ["RS256"],
    }) as GoogleTokenPayload;

    // Validate audience
    if (payload.aud !== clientId) {
      throw new Error("Invalid audience");
    }

    // Validate issuer
    if (!["https://accounts.google.com", "accounts.google.com"].includes(payload.iss)) {
      throw new Error("Invalid issuer");
    }

    if (!payload.email_verified) {
      throw new Error("Email not verified by Google");
    }

    return payload;
  } catch (error) {
    logger.error("Google token verification failed:", error);
    throw new UnauthorizedError("Invalid or expired Google token");
  }
};

/**
 * Generate frontend redirect URL after successful OAuth
 * Includes JWT token for authentication
 */
export const generateFrontendRedirectUrl = (
  token: string,
  userId: string,
  role: string
): string => {
  const baseUrl = getEnv("FRONTEND_REDIRECT_URL");

  const params = new URLSearchParams({
    token,
    userId,
    role,
  });

  return `${baseUrl}/auth-callback?${params.toString()}`;
};
