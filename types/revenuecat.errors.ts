/**
 * Custom error types for RevenueCat service operations
 */

export class RevenueCatError extends Error {
  constructor(
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = "RevenueCatError";
  }
}

export class UserContextError extends RevenueCatError {
  constructor(message: string) {
    super(message, "USER_CONTEXT_ERROR");
    this.name = "UserContextError";
  }
}

export class AuthenticationError extends RevenueCatError {
  constructor(message: string) {
    super(message, "AUTHENTICATION_ERROR");
    this.name = "AuthenticationError";
  }
}

export class SubscriptionError extends RevenueCatError {
  constructor(
    message: string,
    public originalError?: Error
  ) {
    super(message, "SUBSCRIPTION_ERROR");
    this.name = "SubscriptionError";
  }
}

export class ConfigurationError extends RevenueCatError {
  constructor(message: string) {
    super(message, "CONFIGURATION_ERROR");
    this.name = "ConfigurationError";
  }
}

/**
 * User-facing error messages for different error scenarios
 */
export const USER_ERROR_MESSAGES = {
  USER_CONTEXT_MISMATCH: "Please try again after signing in",
  SUBSCRIPTION_FAILED:
    "Unable to process subscription. Please try again or contact support",
  NETWORK_ERROR: "Network error. Please check your connection and try again",
  CONFIGURATION_ERROR:
    "Service temporarily unavailable. Please try again later",
  PERMISSION_DENIED: "Operation not authorized for current user context",
} as const;
