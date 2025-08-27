export enum AuthStatus {
  INITIALIZING = "initializing",
  UNAUTHENTICATED = "unauthenticated",
  UNVERIFIED = "unverified",
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
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  authStatus: AuthStatus;
  hasCompletedOnboarding: boolean | null;
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
