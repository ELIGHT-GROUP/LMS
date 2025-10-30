/**
 * Express Application Setup
 * =========================
 * Main Express application configuration and middleware setup
 */

import { Express, Request, Response, NextFunction } from "express";
// @ts-ignore - Express has both default and named exports
import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { log } from "./utils/logger";
import { httpLoggerMiddleware } from "./middleware/http-logger.middleware";
import {
  corsMiddleware,
  helmetMiddleware,
  compressionMiddleware,
  jsonBodyParserMiddleware,
  urlEncodedBodyParserMiddleware,
  disablePoweredByMiddleware,
  requestIdMiddleware,
} from "./middleware/security.middleware";
import routes from "./routes";

// Load environment variables
dotenv.config();

// Initialize Express application
const app: Express = express();

/**
 * Trust proxy - useful when behind a reverse proxy
 */
app.set("trust proxy", 1);

/**
 * Disable X-Powered-By header
 */
app.disable("x-powered-by");

/**
 * Security and utility middleware
 */
app.use(disablePoweredByMiddleware);
app.use(requestIdMiddleware);

/**
 * Request logging middleware
 */
app.use(httpLoggerMiddleware);

/**
 * Security headers and CORS
 */
app.use(helmetMiddleware);
app.use(corsMiddleware);

/**
 * Compression middleware for response optimization
 */
app.use(compressionMiddleware);

/**
 * Body parsing middleware
 */
app.use(jsonBodyParserMiddleware);
app.use(urlEncodedBodyParserMiddleware);

/**
 * Health check endpoint
 */
app.get("/health-check", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "✅ Server is up and running!",
    timestamp: new Date().toISOString(),
  });
  console.log("ℹ️  GET /health-check route accessed");
});

/**
 * Health check endpoint (JSON format)
 */
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

/**
 * Mount API routes
 */
app.use("/api", routes);

/**
 * Handle 404 errors for undefined routes
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
    path: req.originalUrl,
  });
});

/**
 * Global error handling middleware
 * Must be the last middleware
 */
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  log.error(`❌ Unhandled error:`, err);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

export default app;
