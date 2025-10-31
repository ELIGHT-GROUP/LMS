/**
 * HTTP Logger Middleware
 * ======================
 * Logs incoming HTTP requests with structured logging
 */

import { Request, Response, NextFunction } from "express";
import { log } from "../utils/logger";

/**
 * HTTP Request Logger Middleware
 * Logs all incoming HTTP requests with method, URL, and timestamp
 *
 * @middleware
 */
export const httpLoggerMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const requestId = (req as Request & { requestId?: string }).requestId || "unknown";

  // Log incoming request
  log.http(`${req.method} ${req.url}`, {
    requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });

  // Log simple console output
  console.log(`🌐 HTTP ${req.method} ${req.url} [ID: ${requestId}]`);

  // Capture response details
  const originalJson = res.json.bind(res);

  res.json = function (data: unknown) {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    log.http(`${req.method} ${req.url}`, {
      requestId,
      statusCode,
      duration: `${duration}ms`,
      method: req.method,
      url: req.url,
    });

    return originalJson(data);
  };

  next();
};

export default httpLoggerMiddleware;
