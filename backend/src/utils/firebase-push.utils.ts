/**
 * Firebase Push Notification Utilities
 * =====================================
 * Send push notifications using Firebase Cloud Messaging (FCM)
 */

import { getFirebaseMessaging } from "../config/firebase.config";
import type {
  ISendPushNotificationParams,
  ISendTopicNotificationParams,
} from "../types/communication.types";
import logger from "./logger";

/**
 * Send push notification to a single device or multiple devices
 */
export const sendPushNotification = async ({
  token,
  title,
  body,
  data = {},
  imageUrl,
  sound = "default",
  badge,
  clickAction,
}: ISendPushNotificationParams): Promise<string | string[]> => {
  try {
    const messaging = getFirebaseMessaging();

    // Handle single token
    if (typeof token === "string") {
      const message = {
        notification: {
          title,
          body,
          ...(imageUrl && { imageUrl }),
        },
        data,
        token,
        ...(sound && { android: { notification: { sound } } }),
        ...(badge && { apns: { payload: { aps: { badge: parseInt(badge, 10) } } } }),
        ...(clickAction && { webpush: { fcmOptions: { link: clickAction } } }),
      };

      const response = await messaging.send(message);
      logger.info(`✅ Push notification sent to token: ${token}`);
      return response;
    }

    // Handle multiple tokens
    const message = {
      notification: {
        title,
        body,
        ...(imageUrl && { imageUrl }),
      },
      data,
      tokens: token,
      ...(sound && { android: { notification: { sound } } }),
      ...(badge && { apns: { payload: { aps: { badge: parseInt(badge, 10) } } } }),
      ...(clickAction && { webpush: { fcmOptions: { link: clickAction } } }),
    };

    const response = await messaging.sendEachForMulticast(message);
    logger.info(
      `✅ Push notifications sent: ${response.successCount} successful, ${response.failureCount} failed`
    );

    return response.responses.map((r) => r.messageId || "");
  } catch (error) {
    logger.error("❌ Error sending push notification:", error);
    throw new Error(
      `Failed to send push notification: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

/**
 * Send push notification to a topic
 */
export const sendTopicNotification = async ({
  topic,
  title,
  body,
  data = {},
  imageUrl,
}: ISendTopicNotificationParams): Promise<string> => {
  try {
    const messaging = getFirebaseMessaging();

    const message = {
      notification: {
        title,
        body,
        ...(imageUrl && { imageUrl }),
      },
      data,
      topic,
    };

    const response = await messaging.send(message);
    logger.info(`✅ Topic notification sent to: ${topic}`);
    return response;
  } catch (error) {
    logger.error("❌ Error sending topic notification:", error);
    throw new Error(
      `Failed to send topic notification: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

/**
 * Subscribe devices to a topic
 */
export const subscribeToTopic = async (tokens: string | string[], topic: string): Promise<void> => {
  try {
    const messaging = getFirebaseMessaging();
    const tokenArray = Array.isArray(tokens) ? tokens : [tokens];

    await messaging.subscribeToTopic(tokenArray, topic);
    logger.info(`✅ ${tokenArray.length} device(s) subscribed to topic: ${topic}`);
  } catch (error) {
    logger.error("❌ Error subscribing to topic:", error);
    throw new Error(
      `Failed to subscribe to topic: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};

/**
 * Unsubscribe devices from a topic
 */
export const unsubscribeFromTopic = async (
  tokens: string | string[],
  topic: string
): Promise<void> => {
  try {
    const messaging = getFirebaseMessaging();
    const tokenArray = Array.isArray(tokens) ? tokens : [tokens];

    await messaging.unsubscribeFromTopic(tokenArray, topic);
    logger.info(`✅ ${tokenArray.length} device(s) unsubscribed from topic: ${topic}`);
  } catch (error) {
    logger.error("❌ Error unsubscribing from topic:", error);
    throw new Error(
      `Failed to unsubscribe from topic: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};
