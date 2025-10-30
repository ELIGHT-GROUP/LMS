/**
 * Custom Error Classes
 * =====================
 * Application-specific error classes extending the built-in Error class
 * These are used throughout the application for consistent error handling
 */

/**
 * Base Error Class
 * All custom errors should extend from this class
 */
export class AppError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * 400 Bad Request Error
 * Thrown when the client provides invalid input or data format
 */
export class BadRequestError extends AppError {
  constructor(message: string = "Bad Request") {
    super(message, 400);
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }
}

/**
 * 401 Unauthorized Error
 * Thrown when authentication fails or token is invalid
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(message, 401);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

/**
 * 403 Forbidden Error
 * Thrown when the user doesn't have permission to access a resource
 */
export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden") {
    super(message, 403);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

/**
 * 404 Not Found Error
 * Thrown when a requested resource doesn't exist
 */
export class NotFoundError extends AppError {
  constructor(message: string = "Not Found") {
    super(message, 404);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * 500 Internal Server Error
 * Thrown when an unexpected server error occurs
 */
export class InternalServerError extends AppError {
  constructor(message: string = "Internal Server Error") {
    super(message, 500);
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}

/**
 * Database Error
 * Thrown when database operations fail
 */
export class DatabaseError extends AppError {
  constructor(message: string = "Database Error") {
    super(message, 500);
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

/**
 * Validation Error
 * Thrown when data validation fails
 */
export class ValidationError extends AppError {
  public readonly details?: Record<string, string[]>;

  constructor(message: string = "Validation Error", details?: Record<string, string[]>) {
    super(message, 422);
    this.details = details;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}
