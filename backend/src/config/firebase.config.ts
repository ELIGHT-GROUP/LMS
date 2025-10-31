/**
 * Firebase Configuration
 * =======================
 * Firebase Admin SDK initialization for push notifications
 */

import * as admin from "firebase-admin";
import logger from "../utils/logger";

let isInitialized = false;

/**
 * Initialize Firebase Admin SDK
 */
export const initializeFirebase = (): void => {
  if (isInitialized) {
    logger.warn("Firebase Admin is already initialized");
    return;
  }

  try {
    // Check if service account key is provided via environment variable
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (!serviceAccountKey) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY environment variable is required");
    }

    // Parse the service account JSON
    const serviceAccount = JSON.parse(serviceAccountKey);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    isInitialized = true;
    logger.info("✅ Firebase Admin SDK initialized successfully");
  } catch (error) {
    logger.error("❌ Firebase initialization failed:", error);
    throw error;
  }
};

/**
 * Get Firebase Auth instance
 */
export const getFirebaseAuth = (): admin.auth.Auth => {
  if (!isInitialized) {
    initializeFirebase();
  }
  return admin.auth();
};

/**
 * Get Firebase Messaging instance
 */
export const getFirebaseMessaging = (): admin.messaging.Messaging => {
  if (!isInitialized) {
    initializeFirebase();
  }
  return admin.messaging();
};

/**
 * Get Firestore instance
 */
export const getFirestore = (): admin.firestore.Firestore => {
  if (!isInitialized) {
    initializeFirebase();
  }
  return admin.firestore();
};
