/**
 * Routes Index
 * ============
 * Central routing configuration and API endpoint aggregation
 */

import { Request, Response } from "express";
// @ts-ignore - Express has both default and named exports
import express from "express";
import { asyncHandler } from "../middleware/async-handler.middleware";
import { successResponse } from "../utils/response";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";

const router = express.Router();

/**
 * Health check endpoint
 */
router.get(
  "/",
  asyncHandler(async (_req: Request, res: Response) => {
    successResponse(res, "🚀 API is working correctly", {
      version: "1.0.0",
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * Mount API route modules
 */
router.use("/auth", authRoutes);
router.use("/users", userRoutes);

/**
 * 404 handler for undefined routes
 */
router.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
  });
});

export default router;
