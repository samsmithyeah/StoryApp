import { Child } from "./child.types";
import { logger } from "../utils/logger";

// Firestore user document structure
export interface FirestoreUserData {
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  createdAt?: { toDate(): Date };
  children?: Child[];
  isAdmin?: boolean;
  fcmToken?: string | null;
  hasCompletedOnboarding?: boolean;
  onboardingCompletedAt?: Date;

  // Additional fields that may exist in production
  lastActive?: Date | { toDate(): Date };
  updatedAt?: Date | { toDate(): Date };
  preferences?: Record<string, any>;
  fcmTokenUpdated?: Date | { toDate(): Date };
  lastStateUpdate?: Date | { toDate(): Date };
  appState?: string;
  savedCharacters?: any[];

  // Referral system fields
  referralCode?: string; // User's personal referral code
  referredBy?: string; // Referral code used during signup
  referralStats?: {
    totalReferred: number;
    creditsEarned: number;
    pendingReferrals: number;
    lastReferralAt?: { toDate(): Date };
  };

  // Allow any additional fields that might be added over time
  [key: string]: any;
}

// Cache entry structure
export interface CachedUserData {
  data: FirestoreUserData | null;
  timestamp: number;
}

// Validation helper type guards with stricter security checks
function isFirestoreUserData(data: any): data is FirestoreUserData {
  // Basic type check
  if (typeof data !== "object" || data === null) {
    return false;
  }

  // Check for obviously malicious properties (but allow legitimate extra fields)
  const suspiciousKeys = [
    "__proto__",
    "constructor",
    "prototype",
    "toString",
    "valueOf",
    "hasOwnProperty",
  ];

  const dataKeys = Object.keys(data);
  const hasSuspiciousKeys = dataKeys.some((key) =>
    suspiciousKeys.includes(key)
  );
  if (hasSuspiciousKeys) {
    console.warn(
      "Firestore data contains suspicious keys:",
      dataKeys.filter((key) => suspiciousKeys.includes(key))
    );
    return false;
  }

  // Log unexpected keys for monitoring but don't reject
  const coreKeys = [
    "email",
    "displayName",
    "photoURL",
    "createdAt",
    "children",
    "isAdmin",
    "fcmToken",
    "hasCompletedOnboarding",
    "onboardingCompletedAt",
  ];

  const extraKeys = dataKeys.filter((key) => !coreKeys.includes(key));
  if (extraKeys.length > 0) {
    logger.debug("Firestore data contains additional fields:", extraKeys);
  }

  // Validate each field with logging for debugging - handle null values
  if (data.email !== undefined && data.email !== null) {
    if (typeof data.email !== "string") {
      logger.debug("Email validation failed: not a string", {
        email: data.email,
      });
      return false;
    }
    if (!isValidEmail(data.email)) {
      logger.debug("Email validation failed: invalid format", {
        email: data.email,
      });
      return false;
    }
  }

  if (data.displayName !== undefined && data.displayName !== null) {
    if (typeof data.displayName !== "string") {
      logger.debug("DisplayName validation failed: not a string", {
        displayName: data.displayName,
      });
      return false;
    }
    if (data.displayName.length > 100) {
      logger.debug("DisplayName validation failed: too long", {
        length: data.displayName.length,
      });
      return false;
    }
  }

  if (data.photoURL !== undefined && data.photoURL !== null) {
    if (typeof data.photoURL !== "string") {
      logger.debug("PhotoURL validation failed: not a string", {
        photoURL: data.photoURL,
      });
      return false;
    }
    // Relax URL validation - some providers use non-standard URLs
    if (data.photoURL.length > 2000) {
      logger.debug("PhotoURL validation failed: too long", {
        length: data.photoURL.length,
      });
      return false;
    }
  }

  if (
    data.hasCompletedOnboarding !== undefined &&
    typeof data.hasCompletedOnboarding !== "boolean"
  ) {
    logger.debug("hasCompletedOnboarding validation failed: not a boolean", {
      value: data.hasCompletedOnboarding,
    });
    return false;
  }

  if (data.isAdmin !== undefined && typeof data.isAdmin !== "boolean") {
    logger.debug("isAdmin validation failed: not a boolean", {
      value: data.isAdmin,
    });
    return false;
  }

  if (data.fcmToken !== undefined && data.fcmToken !== null) {
    if (typeof data.fcmToken !== "string") {
      logger.debug("fcmToken validation failed: not a string", {
        fcmToken: data.fcmToken,
      });
      return false;
    }
    if (data.fcmToken.length > 500) {
      logger.debug("fcmToken validation failed: too long", {
        length: data.fcmToken.length,
      });
      return false;
    }
  }

  // Validate children array if present with relaxed validation
  if (data.children !== undefined) {
    if (!Array.isArray(data.children)) {
      logger.debug("Children validation failed: not an array", {
        children: data.children,
      });
      return false;
    }
    if (data.children.length > 50) {
      logger.debug("Children validation failed: too many children", {
        count: data.children.length,
      });
      return false;
    }
    // Relaxed validation of child objects - only check essential fields
    for (let i = 0; i < data.children.length; i++) {
      const child = data.children[i];
      if (typeof child !== "object" || child === null) {
        logger.debug(`Child ${i} validation failed: not an object`, { child });
        return false;
      }
      // Only require id - name might be missing in some cases
      if (typeof child.id !== "string") {
        logger.debug(`Child ${i} validation failed: missing or invalid id`, {
          child,
        });
        return false;
      }
    }
  }

  return true;
}

// Helper validation functions
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 320; // RFC 5321 limit
}

export function validateCacheData(data: any): FirestoreUserData | null {
  if (data === null) return null;

  if (!isFirestoreUserData(data)) {
    throw new Error("Invalid user data format");
  }

  return data;
}
