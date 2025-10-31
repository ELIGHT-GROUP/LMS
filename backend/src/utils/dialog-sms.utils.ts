/**
 * Dialog SMS Utilities
 * =====================
 * SMS sending functionality using Dialog SMS API
 * Note: This is a template - adjust based on actual Dialog API specifications
 */

import axios, { AxiosInstance } from "axios";
import type {
  ISendSmsParams,
  ISendOtpSmsParams,
  ISendBulkSmsParams,
  ISmsResponse,
  IBulkSmsResult,
} from "../types/communication.types";
import logger from "./logger";

/**
 * Dialog SMS Configuration Interface
 */
interface IDialogConfig {
  baseUrl: string;
  loginEndpoint: string;
  smsEndpoint: string;
  username: string;
  password: string;
}

/**
 * Get Dialog SMS configuration from environment
 */
const getDialogConfig = (): IDialogConfig => {
  const required = [
    "DIALOG_BASE_URL",
    "DIALOG_USERNAME",
    "DIALOG_PASSWORD",
    "LOGIN_ENDPOINT",
    "SMS_ENDPOINT",
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required Dialog SMS configuration: ${missing.join(", ")}`);
  }

  return {
    baseUrl: process.env.DIALOG_BASE_URL!,
    loginEndpoint: process.env.LOGIN_ENDPOINT!,
    smsEndpoint: process.env.SMS_ENDPOINT!,
    username: process.env.DIALOG_USERNAME!,
    password: process.env.DIALOG_PASSWORD!,
  };
};

/**
 * Dialog API client
 */
let axiosInstance: AxiosInstance | null = null;
let authToken: string | null = null;
let tokenExpiry: number = 0;

/**
 * Initialize axios instance
 */
const getAxiosInstance = (): AxiosInstance => {
  if (!axiosInstance) {
    const config = getDialogConfig();
    axiosInstance = axios.create({
      baseURL: config.baseUrl,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
  return axiosInstance;
};

/**
 * Authenticate with Dialog API and get token
 */
const authenticateDialog = async (): Promise<string> => {
  try {
    const config = getDialogConfig();
    const instance = getAxiosInstance();

    const response = await instance.post(config.loginEndpoint, {
      username: config.username,
      password: config.password,
    });

    authToken = response.data.token || response.data.access_token;
    tokenExpiry = Date.now() + 3600000; // Assume 1 hour expiry

    logger.info("✅ Dialog SMS authentication successful");
    return authToken!;
  } catch (error) {
    logger.error("❌ Dialog SMS authentication failed:", error);
    throw new Error(
      `Dialog SMS authentication failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

/**
 * Get valid auth token (refresh if expired)
 */
const getAuthToken = async (): Promise<string> => {
  if (!authToken || Date.now() >= tokenExpiry) {
    return authenticateDialog();
  }
  return authToken;
};

/**
 * Send SMS using Dialog API
 */
export const sendSms = async ({
  to,
  message,
  senderId = "LMS",
}: ISendSmsParams): Promise<ISmsResponse> => {
  try {
    const config = getDialogConfig();
    const instance = getAxiosInstance();
    const token = await getAuthToken();

    const recipients = Array.isArray(to) ? to : [to];

    const response = await instance.post(
      config.smsEndpoint,
      {
        to: recipients,
        message,
        sender_id: senderId,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    logger.info(`✅ SMS sent successfully to ${recipients.length} recipient(s)`);
    return response.data;
  } catch (error) {
    logger.error("❌ Error sending SMS:", error);

    // Retry once if authentication failed
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      logger.info("Token expired, retrying with new token...");
      authToken = null;
      return sendSms({ to, message, senderId });
    }

    throw new Error(
      `Failed to send SMS: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};

/**
 * Send OTP SMS
 */
export const sendOtpSms = async ({
  to,
  otp,
  expiryMinutes = 10,
}: ISendOtpSmsParams): Promise<ISmsResponse> => {
  const message = `Your verification code is: ${otp}. This code will expire in ${expiryMinutes} minutes. Do not share this code with anyone.`;

  return sendSms({ to, message });
};

/**
 * Send bulk SMS
 */
export const sendBulkSms = async ({
  recipients,
  senderId = "LMS",
}: ISendBulkSmsParams): Promise<IBulkSmsResult[]> => {
  try {
    const promises = recipients.map(({ to, message }) => sendSms({ to, message, senderId }));

    const results = await Promise.allSettled(promises);

    const successCount = results.filter((r) => r.status === "fulfilled").length;
    const failureCount = results.filter((r) => r.status === "rejected").length;

    logger.info(`✅ Bulk SMS sent: ${successCount} successful, ${failureCount} failed`);

    return results.map((r) =>
      r.status === "fulfilled"
        ? { success: true, ...r.value }
        : { success: false, error: String(r.reason) }
    );
  } catch (error) {
    logger.error("❌ Error sending bulk SMS:", error);
    throw error;
  }
};

/**
 * Check SMS balance (if supported by Dialog API)
 */
export const checkSmsBalance = async (): Promise<number> => {
  try {
    const config = getDialogConfig();
    const instance = getAxiosInstance();
    const token = await getAuthToken();

    const response = await instance.get("/balance", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    logger.info(`✅ SMS Balance: ${response.data.balance}`);
    return response.data.balance;
  } catch (error) {
    logger.error("❌ Error checking SMS balance:", error);
    throw new Error(
      `Failed to check SMS balance: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};
