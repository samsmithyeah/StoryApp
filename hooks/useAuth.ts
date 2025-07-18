import { useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signInWithApple,
  configureGoogleSignIn,
} from "../services/firebase/auth";
import { LoginCredentials, SignUpCredentials } from "../types/auth.types";

export const useAuth = () => {
  const { user, loading, error, initialize, setLoading, setError, signOut } =
    useAuthStore();

  useEffect(() => {
    // Configure Google Sign-In
    const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
    if (webClientId) {
      configureGoogleSignIn(webClientId);
    }

    // Initialize auth state listener
    initialize();
  }, [initialize]);

  const emailSignIn = async (credentials: LoginCredentials) => {
    try {
      setLoading(true);
      setError(null);
      await signInWithEmail(credentials);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  const emailSignUp = async (credentials: SignUpCredentials) => {
    try {
      setLoading(true);
      setError(null);
      await signUpWithEmail(credentials);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  const googleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithGoogle();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Google sign in failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const appleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithApple();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Apple sign in failed");
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    emailSignIn,
    emailSignUp,
    googleSignIn,
    appleSignIn,
    signOut,
  };
};
