/**
 * Configuration Type Definitions
 * ===============================
 * Shared interfaces for service configurations
 */

/**
 * Brevo SMTP Configuration
 */
export interface IBrevoConfig {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  fromEmail: string;
  fromName?: string;
}

/**
 * Dialog SMS Configuration
 */
export interface IDialogConfig {
  baseUrl: string;
  loginEndpoint: string;
  smsEndpoint: string;
  username: string;
  password: string;
}

/**
 * Upload Provider Type
 */
export type UploadProvider = "cloudinary" | "s3";
