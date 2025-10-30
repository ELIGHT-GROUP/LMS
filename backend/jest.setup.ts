/**
 * Jest Setup File
 * ===============
 * Configuration for Jest test environment
 */
/// <reference types="jest" />

import dotenv from "dotenv";

// Load test environment variables
dotenv.config({ path: ".env.test" });

// Set test environment
process.env.NODE_ENV = "test";

// Suppress console output in tests
if (process.env.SUPPRESS_LOGS === "true") {
  // @ts-ignore - jest globals are available at runtime
  jest.spyOn(console, "log").mockImplementation((): void => {});
  // @ts-ignore - jest globals are available at runtime
  jest.spyOn(console, "error").mockImplementation((): void => {});
  // @ts-ignore - jest globals are available at runtime
  jest.spyOn(console, "warn").mockImplementation((): void => {});
}

// Global test timeout
// @ts-ignore - jest globals are available at runtime
jest.setTimeout(10000);
