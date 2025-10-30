/**
 * Security Middleware
 * ===================
 * CORS, Helmet, compression, and rate limiting configurations
 */

import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
// @ts-ignore - Express has both default and named exports
import express from "express";
import { RATE_LIMITS } from "../constants/enums";

/**
 * CORS Configuration
 * Allows cross-origin requests from specified origins
 */
export const corsOptions = {
  origin: process.env.CORS_ALLOWED_ORIGINS?.split(",") || "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 200,
};

export const corsMiddleware = cors(corsOptions);

/**
 * Helmet Configuration
 * Secures HTTP headers
 */
export const helmetMiddleware = helmet({
  contentSecurityPolicy: process.env.NODE_ENV === "production" ? undefined : false,
  hsts: true,
  hidePoweredBy: true,
  xssFilter: true,
  noSniff: true,
  referrerPolicy: { policy: "no-referrer" },
});

/**
 * Compression Middleware
 * Compresses response bodies
 */
export const compressionMiddleware = compression();

/**
 * General Rate Limiting
 * Applies rate limiting to all requests
 */
export const rateLimitMiddleware = rateLimit({
  windowMs: RATE_LIMITS.DEFAULT_WINDOW_MS,
  max: parseInt(process.env.RATE_LIMIT_MAX || "100", 10),
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Login Rate Limiting
 * More restrictive rate limiting for login endpoints
 */
export const loginRateLimiter = rateLimit({
  windowMs: RATE_LIMITS.LOGIN_WINDOW_MS,
  max: RATE_LIMITS.LOGIN_MAX_REQUESTS,
  message: {
    success: false,
    message: "Too many login attempts, please try again after 15 minutes",
  },
  skipSuccessfulRequests: true,
});

/**
 * OTP Rate Limiting
 * Restrict OTP generation requests
 */
export const otpRateLimiter = rateLimit({
  windowMs: RATE_LIMITS.OTP_WINDOW_MS,
  max: RATE_LIMITS.OTP_MAX_REQUESTS,
  message: {
    success: false,
    message: "Too many OTP requests, please try again later",
  },
  skipSuccessfulRequests: true,
});

/**
 * JSON Body Parser Middleware with size limit
 */
export const jsonBodyParserMiddleware = express.json({ limit: "100kb" });

/**
 * URL Encoded Body Parser Middleware
 */
export const urlEncodedBodyParserMiddleware = express.urlencoded({
  limit: "100kb",
  extended: true,
});

/**
 * Disable powered-by header
 */
export const disablePoweredByMiddleware = (
  _req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void => {
  res.removeHeader("X-Powered-By");
  next();
};

/**
 * Request ID middleware
 * Adds unique ID to each request for tracking
 */
export const requestIdMiddleware = (
  req: express.Request,
  _res: express.Response,
  next: express.NextFunction
): void => {
  const requestId =
    req.headers["x-request-id"] || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  (req as any).requestId = requestId;
  next();
};
