/**
 * Communication Type Definitions
 * ===============================
 * Shared interfaces for email, SMS, and push notifications
 */

/**
 * Email Sending Parameters
 */
export interface ISendEmailParams {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content?: Buffer | string;
    path?: string;
  }>;
}

/**
 * Verification Email Parameters
 */
export interface ISendVerificationEmailParams {
  to: string;
  userName: string;
  verificationCode: string;
  verificationLink?: string;
}

/**
 * Password Reset Email Parameters
 */
export interface ISendPasswordResetEmailParams {
  to: string;
  userName: string;
  resetCode: string;
  resetLink?: string;
}

/**
 * Push Notification Parameters
 */
export interface ISendPushNotificationParams {
  token: string | string[];
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  sound?: string;
  badge?: string;
  clickAction?: string;
}

/**
 * Topic Notification Parameters
 */
export interface ISendTopicNotificationParams {
  topic: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

/**
 * SMS Sending Parameters
 */
export interface ISendSmsParams {
  to: string | string[];
  message: string;
  senderId?: string;
}

/**
 * OTP SMS Parameters
 */
export interface ISendOtpSmsParams {
  to: string;
  otp: string;
  expiryMinutes?: number;
}

/**
 * Bulk SMS Parameters
 */
export interface ISendBulkSmsParams {
  recipients: Array<{ to: string; message: string }>;
  senderId?: string;
}

/**
 * SMS Response Interface
 */
export interface ISmsResponse {
  messageId?: string;
  status?: string;
  recipient?: string;
  error?: string;
  [key: string]: unknown;
}

/**
 * Bulk SMS Result
 */
export interface IBulkSmsResult {
  success: boolean;
  messageId?: string;
  recipient?: string;
  error?: string;
}
