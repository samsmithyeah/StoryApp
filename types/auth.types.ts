export enum AuthStatus {
  INITIALIZING = "initializing",
  UNAUTHENTICATED = "unauthenticated",
  UNVERIFIED = "unverified",
  REFERRAL_ENTRY = "referral_entry",
  ONBOARDING = "onboarding",
  AUTHENTICATED = "authenticated",
}

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Date;
  isAdmin?: boolean;
  emailVerified?: boolean;
  hasSeenReferralEntry?: boolean;
  referralCode?: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  authStatus: AuthStatus;
  hasCompletedOnboarding: boolean | null;
  needsReferralEntry?: boolean;
  justAppliedReferral?: boolean;
}

export type AuthProvider = "google" | "apple" | "email";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials extends LoginCredentials {
  displayName?: string;
}

// Firebase user metadata types
export interface FirebaseUserMetadata {
  creationTime?: string;
  lastSignInTime?: string;
}

export interface FirebaseUserWithMetadata {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  metadata?: FirebaseUserMetadata;
}

// Firebase Auth Error type
export interface FirebaseAuthError extends Error {
  code: string;
}

// Type guard for Firebase auth errors
export const isFirebaseAuthError = (
  error: unknown
): error is FirebaseAuthError => {
  return (
    error instanceof Error &&
    "code" in error &&
    typeof error.code === "string" &&
    error.code.startsWith("auth/")
  );
};

// Type guard for checking if Firebase user has metadata
export const hasFirebaseMetadata = (
  user: any
): user is { metadata: FirebaseUserMetadata } => {
  return user && typeof user.metadata === "object" && user.metadata !== null;
};
