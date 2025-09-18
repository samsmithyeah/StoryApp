// Test account configuration
const TEST_ACCOUNTS = {
  DOMAIN_SUFFIX: "@test.dreamweaver",
  // Specific test emails - using exact matches only to avoid false positives
  EXACT_TEST_EMAILS: [
    "test@example.com",
    "demo@example.com",
    "admin@test.dreamweaver",
    "user@test.dreamweaver",
  ] as const,
} as const;

// Auth timing constants
export const AUTH_TIMEOUTS = {
  PROFILE_UPDATE_TIMEOUT_MS: 10 * 1000, // 10 seconds for profile updates
  NEW_USER_THRESHOLD_MS: 60 * 1000, // 60 seconds - consider user new if created within last minute
} as const;

// Helper function to check if an email is a test account
export const isTestAccount = (email: string | null): boolean => {
  // Only apply test account logic in development builds
  if (!email || !__DEV__) return false;

  // Check for our controlled test domain (safe)
  if (email.endsWith(TEST_ACCOUNTS.DOMAIN_SUFFIX)) {
    return true;
  }

  // Only check exact matches for potentially real domains
  // This prevents accidentally treating real users as test accounts
  const normalizedEmail = email.toLowerCase().trim();
  return (TEST_ACCOUNTS.EXACT_TEST_EMAILS as readonly string[]).includes(
    normalizedEmail
  );
};
