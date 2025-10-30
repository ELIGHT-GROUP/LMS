/**
 * Logger Utility
 * ===============
 * Winston-based logger configuration for structured logging
 */

import winston from "winston";
import path from "path";
import fs from "fs";

/**
 * Define log directories
 */
const logFolder = path.resolve("logs");
const environment = process.env.NODE_ENV || "development";

/**
 * Ensure local log folder exists
 */
if (!fs.existsSync(logFolder)) {
  fs.mkdirSync(logFolder, { recursive: true });
}

/**
 * Define custom format for console logging with emoji icons
 */
const consoleFormat = winston.format.printf((info) => {
  const level = String(info.level);
  const message = String(info.message);
  const timestamp = String(info.timestamp);

  const icons: Record<string, string> = {
    info: "ℹ️ ",
    error: "❌",
    warn: "⚠️ ",
    http: "🌐",
    debug: "🔍",
  };

  const icon = icons[level] || "📄";
  return `${timestamp} ${icon} ${level.toUpperCase()}: ${message}`;
});

/**
 * Define Winston transports for local and console logging
 */
const transports = [
  new winston.transports.File({
    filename: path.join(logFolder, "info.log"),
    level: "info",
  }),
  new winston.transports.File({
    filename: path.join(logFolder, "error.log"),
    level: "error",
  }),
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      consoleFormat
    ),
  }),
];

/**
 * Create the logger instance with Winston
 */
const logger = winston.createLogger({
  level: environment === "production" ? "error" : "info",
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports,
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logFolder, "exceptions.log"),
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logFolder, "rejections.log"),
    }),
  ],
});

/**
 * Type-safe logger methods with proper return types
 */
export const log = {
  /**
   * Log info level messages
   */
  info: (message: string, metadata?: Record<string, any>): void => {
    logger.info(message, metadata);
  },

  /**
   * Log error level messages
   */
  error: (message: string, error?: Error | Record<string, any>): void => {
    if (error instanceof Error) {
      logger.error(message, { error: error.message, stack: error.stack });
    } else {
      logger.error(message, error);
    }
  },

  /**
   * Log warning level messages
   */
  warn: (message: string, metadata?: Record<string, any>): void => {
    logger.warn(message, metadata);
  },

  /**
   * Log debug level messages
   */
  debug: (message: string, metadata?: Record<string, any>): void => {
    logger.debug(message, metadata);
  },

  /**
   * Log HTTP requests
   */
  http: (message: string, metadata?: Record<string, any>): void => {
    logger.info(message, metadata);
  },
};

export default logger;
