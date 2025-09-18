/**
 * Custom error types for RevenueCat service operations
 */

class RevenueCatError extends Error {
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
