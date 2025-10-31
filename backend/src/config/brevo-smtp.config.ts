/**
 * Brevo (formerly Sendinblue) SMTP Configuration
 * ===============================================
 * Email service configuration for transactional emails
 */

import type { IBrevoConfig } from "../types/config.types";
import logger from "../utils/logger";

/**
 * Validate Brevo SMTP configuration from environment
 */
const validateBrevoConfig = (): void => {
  const requiredVars = [
    "BREVO_SMTP_HOST",
    "BREVO_SMTP_PORT",
    "BREVO_SMTP_USER",
    "BREVO_SMTP_PASSWORD",
    "BREVO_FROM_EMAIL",
  ];

  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(`Missing required Brevo SMTP environment variables: ${missingVars.join(", ")}`);
  }
};

/**
 * Get Brevo SMTP configuration
 */
const getBrevoConfig = (): IBrevoConfig => {
  validateBrevoConfig();

  return {
    smtpHost: process.env.BREVO_SMTP_HOST!,
    smtpPort: parseInt(process.env.BREVO_SMTP_PORT!, 10),
    smtpUser: process.env.BREVO_SMTP_USER!,
    smtpPassword: process.env.BREVO_SMTP_PASSWORD!,
    fromEmail: process.env.BREVO_FROM_EMAIL!,
    fromName: process.env.BREVO_FROM_NAME || "LMS Platform",
  };
};

// Export configured instance
const brevoConfig = getBrevoConfig();
logger.info("✅ Brevo SMTP configuration loaded");

export default brevoConfig;
