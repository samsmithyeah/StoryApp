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
}

export type AuthProvider = "google" | "apple" | "email";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials extends LoginCredentials {
  displayName?: string;
}
