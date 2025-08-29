/**
 * Shared referral system configuration
 * This is the single source of truth for all referral-related constants
 */

export const REFERRAL_CONFIG = {
  // Code format
  CODE_LENGTH: 6,
  MAX_USAGE_PER_CODE: 1000,

  // Credit rewards
  REFERRER_CREDITS: 10,
  REFEREE_CREDITS: 5,

  // Client-side only configs
  DEFAULT_EXPIRY_DAYS: 365,
} as const;

// Server-only configs (not exposed to client)
export const REFERRAL_SERVER_CONFIG = {
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: 60 * 1000,
  RATE_LIMIT_MAX_ATTEMPTS: 10,

  // Data cleanup
  VALIDATION_RETENTION_DAYS: 7,
  INACTIVE_CODE_RETENTION_YEARS: 1,
} as const;
