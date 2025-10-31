/**
 * Email Utilities
 * ================
 * Email sending functionality using Brevo SMTP
 */

import nodemailer, { Transporter, SendMailOptions } from "nodemailer";
import brevoConfig from "../config/brevo-smtp.config";
import type {
  ISendEmailParams,
  ISendVerificationEmailParams,
  ISendPasswordResetEmailParams,
} from "../types/communication.types";
import logger from "./logger";

let transporter: Transporter | null = null;

/**
 * Initialize nodemailer transporter with Brevo SMTP settings
 */
const initializeTransporter = (): Transporter => {
  if (transporter) {
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: brevoConfig.smtpHost,
    port: brevoConfig.smtpPort,
    secure: brevoConfig.smtpPort === 465, // Use TLS for port 465
    auth: {
      user: brevoConfig.smtpUser,
      pass: brevoConfig.smtpPassword,
    },
  });

  logger.info("✅ Email transporter initialized");
  return transporter;
};

/**
 * Send an email using Brevo SMTP
 */
export const sendEmail = async ({
  to,
  subject,
  text,
  html,
  from,
  cc,
  bcc,
  attachments,
}: ISendEmailParams): Promise<{ messageId: string; accepted: string[] }> => {
  try {
    const emailTransporter = initializeTransporter();

    const mailOptions: SendMailOptions = {
      from: from || `"${brevoConfig.fromName}" <${brevoConfig.fromEmail}>`,
      to: Array.isArray(to) ? to.join(", ") : to,
      subject,
      text,
      html,
      cc,
      bcc,
      attachments,
    };

    const info = await emailTransporter.sendMail(mailOptions);

    logger.info(`✅ Email sent successfully to ${Array.isArray(to) ? to.join(", ") : to}`);
    logger.info(`Message ID: ${info.messageId}`);

    return {
      messageId: info.messageId,
      accepted: info.accepted as string[],
    };
  } catch (error) {
    logger.error("❌ Error sending email:", error);
    throw new Error(
      `Failed to send email: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};

/**
 * Send verification email
 */
export const sendVerificationEmail = async ({
  to,
  userName,
  verificationCode,
  verificationLink,
}: ISendVerificationEmailParams): Promise<{ messageId: string }> => {
  const subject = "Verify Your Email Address";

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .code { font-size: 24px; font-weight: bold; color: #4CAF50; padding: 10px; background-color: #fff; border: 2px dashed #4CAF50; display: inline-block; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Email Verification</h1>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            <p>Thank you for registering! Please verify your email address using the code below:</p>
            <p style="text-align: center;">
              <span class="code">${verificationCode}</span>
            </p>
            ${verificationLink ? `<p>Or click this link: <a href="${verificationLink}">${verificationLink}</a></p>` : ""}
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request this, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} LMS Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `Hi ${userName},\n\nThank you for registering! Your verification code is: ${verificationCode}\n\n${verificationLink ? `Or visit: ${verificationLink}\n\n` : ""}This code will expire in 10 minutes.`;

  return sendEmail({ to, subject, html, text });
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async ({
  to,
  userName,
  resetCode,
  resetLink,
}: ISendPasswordResetEmailParams): Promise<{ messageId: string }> => {
  const subject = "Reset Your Password";

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #FF5722; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .code { font-size: 24px; font-weight: bold; color: #FF5722; padding: 10px; background-color: #fff; border: 2px dashed #FF5722; display: inline-block; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset</h1>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            <p>We received a request to reset your password. Use the code below:</p>
            <p style="text-align: center;">
              <span class="code">${resetCode}</span>
            </p>
            ${resetLink ? `<p>Or click this link: <a href="${resetLink}">${resetLink}</a></p>` : ""}
            <p>This code will expire in 10 minutes.</p>
            <p><strong>If you didn't request this, please ignore this email and secure your account.</strong></p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} LMS Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `Hi ${userName},\n\nWe received a request to reset your password. Your reset code is: ${resetCode}\n\n${resetLink ? `Or visit: ${resetLink}\n\n` : ""}This code will expire in 10 minutes.`;

  return sendEmail({ to, subject, html, text });
};

/**
 * Send welcome email
 */
export const sendWelcomeEmail = async (
  to: string,
  userName: string
): Promise<{ messageId: string }> => {
  const subject = "Welcome to LMS Platform!";

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to LMS Platform!</h1>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            <p>Welcome to our learning platform! We're excited to have you on board.</p>
            <p>Start exploring our courses and begin your learning journey today!</p>
            <p>If you have any questions, feel free to contact our support team.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} LMS Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `Hi ${userName},\n\nWelcome to LMS Platform! We're excited to have you on board.\n\nStart exploring our courses and begin your learning journey today!`;

  return sendEmail({ to, subject, html, text });
};
