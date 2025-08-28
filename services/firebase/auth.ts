import type { FirebaseAuthTypes } from "@react-native-firebase/auth";
import auth, {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "@react-native-firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "@react-native-firebase/firestore";
import { httpsCallable } from "@react-native-firebase/functions";
import {
  GoogleSignin,
  SignInResponse,
} from "@react-native-google-signin/google-signin";
import * as AppleAuthentication from "expo-apple-authentication";
import { Alert, Platform } from "react-native";
import {
  LoginCredentials,
  SignUpCredentials,
  User,
} from "../../types/auth.types";

import { validateEmail } from "../../utils/validation";
import { logger } from "../../utils/logger";
import { CacheConfig } from "../../constants/CacheConfig";
import { FirestoreUserData } from "../../types/firestore.types";
import { AUTH_TIMEOUTS } from "../../constants/AuthConstants";
import { FCMService } from "../fcm";
import { AuthCacheService } from "../auth/authCacheService";
import { authService, db, functionsService } from "./config";
import { creditsService } from "./credits";
import { serverTimestamp } from "@react-native-firebase/firestore";

// Type definitions
interface AppleAuthError {
  code?: string;
  message?: string;
}

// Constants
const AUTH_DEBOUNCE_DELAY = CacheConfig.AUTH_DEBOUNCE_MS; // Use centralized config

// FCM Initialization Strategy:
// - New users (signup, first-time social): FCMService.initializeFCM(true) - Force re-initialization
// - Existing users (sign-in, auth state observer): FCMService.initializeFCM() - Normal initialization

// Helper function to consistently initialize FCM based on user type
const initializeFCMForAuthOperation = async (
  operationType: "signup" | "signin" | "observer",
  userUid: string
) => {
  const forceReinitialization = operationType === "signup";

  try {
    logger.debug(`Starting FCM initialization for ${operationType}`, {
      uid: userUid,
      forceReinitialization,
    });

    await FCMService.initializeFCM(forceReinitialization);

    logger.debug(
      `FCM initialization completed successfully for ${operationType}`
    );
  } catch (error) {
    logger.error(`FCM initialization failed for ${operationType}`, error);
  }
};

// Helper function to wait for Firebase profile update to propagate using auth state listener
const waitForProfileUpdate = async (
  user: FirebaseAuthTypes.User,
  expectedDisplayName: string,
  timeoutMs = AUTH_TIMEOUTS.PROFILE_UPDATE_TIMEOUT_MS // Increased timeout for reliability
): Promise<boolean> => {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let unsubscribe: (() => void) | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    // Set up timeout fallback
    timeoutId = setTimeout(() => {
      if (unsubscribe) unsubscribe();

      logger.warn("Profile update verification timed out", {
        expectedDisplayName,
        finalDisplayName: authService.currentUser?.displayName,
        elapsedMs: Date.now() - startTime,
      });

      resolve(false);
    }, timeoutMs);

    // Check immediately first
    if (authService.currentUser?.displayName === expectedDisplayName) {
      if (timeoutId) clearTimeout(timeoutId);
      logger.debug("Profile update confirmed immediately", {
        displayName: expectedDisplayName,
        elapsedMs: 0,
      });
      resolve(true);
      return;
    }

    // Set up auth state change listener for more reliable detection
    unsubscribe = onAuthStateChanged(authService, (authUser) => {
      if (authUser?.displayName === expectedDisplayName) {
        if (timeoutId) clearTimeout(timeoutId);
        if (unsubscribe) unsubscribe();

        logger.debug("Profile update confirmed via auth state listener", {
          displayName: authUser.displayName,
          elapsedMs: Date.now() - startTime,
        });

        resolve(true);
      }
    });

    // Also try reloading the user as a backup approach
    const pollAsBackup = async () => {
      // Wait a bit to let the auth state listener work first
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Only poll if we haven't resolved yet
      let attempts = 0;
      const maxAttempts = Math.floor((timeoutMs - 500) / 200); // Poll every 200ms

      while (attempts < maxAttempts) {
        try {
          await reload(user);
          const currentUser = authService.currentUser;

          if (currentUser?.displayName === expectedDisplayName) {
            if (timeoutId) clearTimeout(timeoutId);
            if (unsubscribe) unsubscribe();

            logger.debug("Profile update confirmed via polling backup", {
              displayName: currentUser.displayName,
              elapsedMs: Date.now() - startTime,
            });

            resolve(true);
            return;
          }
        } catch (error) {
          logger.debug("Profile reload failed during verification", error);
        }

        attempts++;
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    };

    // Start backup polling
    pollAsBackup().catch((error) => {
      logger.debug("Profile update polling backup failed", error);
    });
  });
};

// Helper function to check if user has a deletion marker
const checkDeletionMarker = async (email: string): Promise<boolean> => {
  try {
    const checkDeletionMarkerFunction = httpsCallable(
      functionsService,
      "checkDeletionMarker"
    );

    const result = await checkDeletionMarkerFunction({ email });
    return (result.data as { hasMarker: boolean }).hasMarker;
  } catch (error) {
    logger.error("Error checking deletion marker", error);
    // Default to not granting credits for security if check fails
    return true;
  }
};

// Convert Firebase User to our User type
const convertFirebaseUser = async (
  firebaseUser: FirebaseAuthTypes.User
): Promise<User> => {
  try {
    logger.debug("Converting Firebase user to app user", {
      displayName: firebaseUser.displayName,
      uid: firebaseUser.uid,
    });

    const userRef = doc(db, "users", firebaseUser.uid);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data() as FirestoreUserData | undefined;

    const user = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName || userData?.displayName || null,
      photoURL: firebaseUser.photoURL,
      createdAt: userData?.createdAt?.toDate() || new Date(),
      isAdmin: userData?.isAdmin || false,
      emailVerified: firebaseUser.emailVerified,
    };

    logger.debug("Converted user", {
      displayName: user.displayName,
      firebaseDisplayName: firebaseUser.displayName,
      firestoreDisplayName: userData?.displayName,
    });
    return user;
  } catch (error) {
    logger.warn(
      "Firestore error in convertFirebaseUser, using basic user data",
      {
        error: error instanceof Error ? error.message : String(error),
      }
    );
    // Return basic user data if Firestore fails
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName || null,
      photoURL: firebaseUser.photoURL,
      createdAt: new Date(),
      isAdmin: false,
      emailVerified: firebaseUser.emailVerified,
    };
  }
};

// Create user document in Firestore and return the complete user data
const createUserDocument = async (
  user: FirebaseAuthTypes.User,
  overrideDisplayName?: string
): Promise<FirestoreUserData | null> => {
  try {
    logger.debug("Starting user document creation", {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
    });

    const userRef = doc(db, "users", user.uid);
    const userSnapshot = await getDoc(userRef);

    // Use override displayName if provided, otherwise use user.displayName
    const finalDisplayName = overrideDisplayName || user.displayName;
    logger.debug("Using displayName", {
      displayName: finalDisplayName,
      source: overrideDisplayName ? "override" : "user profile",
    });

    // Check for deletion marker BEFORE creating any documents for new users
    const isNewUser = !userSnapshot.exists();
    let shouldGrantFreeCredits = true;

    if (isNewUser) {
      logger.debug("New user detected - checking deletion marker before document creation");
      
      const userEmail = user.email;
      if (userEmail) {
        try {
          const hasMarker = await checkDeletionMarker(userEmail);
          if (hasMarker) {
            logger.debug("Deletion marker found - will not grant free credits", { 
              uid: user.uid 
            });
            shouldGrantFreeCredits = false;
          } else {
            logger.debug("No deletion marker found - will grant free credits", {
              uid: user.uid 
            });
          }
        } catch (error) {
          logger.error("Error checking deletion marker, defaulting to no free credits", error);
          shouldGrantFreeCredits = false;
        }
      } else {
        logger.warn("No email found for user, not granting free credits", { 
          uid: user.uid 
        });
        shouldGrantFreeCredits = false;
      }
    }

    // Always set core user data with merge: true to ensure it exists
    const userData = {
      email: user.email,
      displayName: finalDisplayName,
      photoURL: user.photoURL,
      // Only set createdAt and children for new users, not existing ones
      ...(isNewUser ? { createdAt: new Date(), children: [] } : {}),
    };
    logger.debug("User data to set/merge", userData);

    await setDoc(userRef, userData, { merge: true });
    logger.debug("User document created/updated successfully");

    // Read back the document and return the complete data
    const finalSnapshot = await getDoc(userRef);
    if (finalSnapshot.exists()) {
      const savedData = finalSnapshot.data() as FirestoreUserData;
      logger.debug("Document verification successful", {
        hasEmail: !!savedData?.email,
        hasDisplayName: !!savedData?.displayName,
        hasFcmToken: !!savedData?.fcmToken,
      });

      if (isNewUser) {
        if (shouldGrantFreeCredits) {
          logger.debug("Initializing credits with free credits");
          await creditsService.initializeUserCredits(user.uid);
          logger.debug("Credits initialized successfully with free credits");
        } else {
          logger.debug("Creating credits document without free credits");
          // Create credits document manually without free credits
          await setDoc(doc(db, "userCredits", user.uid), {
            userId: user.uid,
            balance: 0,
            lifetimeUsed: 0,
            subscriptionActive: false,
            freeCreditsGranted: false,
            lastUpdated: serverTimestamp(),
          });
          logger.debug("Credits document created without free credits");
        }
      } else {
        logger.debug("Existing user - checking credits");
        // Check if user has credits initialized (for existing users before credits system)
        const userCredits = await creditsService.getUserCredits(user.uid);
        if (!userCredits) {
          logger.debug("Initializing credits for existing user");
          await creditsService.initializeUserCredits(user.uid);
          logger.debug("Credits initialized for existing user");
        } else {
          logger.debug("User credits already exist");
        }
      }

      logger.debug("User document creation process completed, returning data");
      return savedData;
    } else {
      logger.error("Document verification FAILED - document does not exist");
      return null;
    }
  } catch (error) {
    logger.error("Failed to create user document in Firestore", error);
    // Don't throw error - authentication can still work without Firestore
    return null;
  }
};

// Initialize Google Sign-In (call this once in your app)
let googleSignInConfigured = false;
export const configureGoogleSignIn = (webClientId: string) => {
  if (googleSignInConfigured) {
    return; // Already configured, skip
  }
  GoogleSignin.configure({
    webClientId,
    offlineAccess: true,
    scopes: ["openid", "profile", "email"],
  });
  googleSignInConfigured = true;
};

// Email/Password Authentication
export const signUpWithEmail = async ({
  email,
  password,
  displayName,
}: SignUpCredentials): Promise<User> => {
  const userCredential = await createUserWithEmailAndPassword(
    authService,
    email,
    password
  );

  // Check if this is a test account (for development only)
  const isTestAccount = __DEV__ && email.endsWith("@test.dreamweaver");

  // Update Firebase profile BEFORE sending verification email (so email includes display name)
  if (displayName?.trim()) {
    logger.debug("Updating Firebase profile", {
      displayName,
    });
    try {
      await updateProfile(userCredential.user, {
        displayName: displayName.trim(),
      });

      // Wait for Firebase profile update to propagate with retry logic
      const profileUpdateSuccess = await waitForProfileUpdate(
        userCredential.user,
        displayName.trim()
      );

      if (profileUpdateSuccess) {
        // Clear user cache for this specific user to force fresh data fetch
        AuthCacheService.invalidateUser(userCredential.user.uid);
        logger.debug(
          "Firebase profile updated successfully and user cache cleared for user",
          {
            uid: userCredential.user.uid,
          }
        );
      } else {
        logger.warn("Profile update verification failed, proceeding anyway");
      }
    } catch (error) {
      logger.error("Firebase profile update failed", error);
    }
  } else {
    logger.debug("No displayName provided for Firebase profile");
  }

  if (!isTestAccount) {
    // Send email verification for real accounts
    try {
      await sendEmailVerification(userCredential.user);
    } catch (verificationError) {
      logger.error("Failed to send email verification", verificationError);
      Alert.alert(
        "Verification error",
        "We encountered an issue while sending the verification email. Please try sending it again.",
        [{ text: "OK" }]
      );
    }
  } else {
    // Test accounts skip email verification for development purposes
    logger.debug("Skipping email verification for test account", {
      email: email,
      isDevelopment: __DEV__,
    });
  }

  // Pass displayName directly to avoid timing issues with Firebase profile updates
  const finalDisplayName = displayName?.trim() || null;
  logger.debug("Creating user document", {
    displayName: finalDisplayName,
  });

  const firestoreData = await createUserDocument(
    userCredential.user,
    finalDisplayName || undefined
  );

  // Create the complete user object with Firestore data
  const appUser: User = {
    uid: userCredential.user.uid,
    email: userCredential.user.email,
    displayName:
      firestoreData?.displayName ||
      userCredential.user.displayName ||
      finalDisplayName,
    photoURL: userCredential.user.photoURL,
    createdAt: firestoreData?.createdAt?.toDate() || new Date(),
    isAdmin: firestoreData?.isAdmin || false,
    emailVerified: userCredential.user.emailVerified,
  };

  // Manually update the store with the complete user object
  const { useAuthStore } = await import("../../store/authStore");
  useAuthStore.getState().setUser(appUser);
  logger.debug("Auth store updated with complete user data (signUpWithEmail)", {
    displayName: appUser.displayName,
    uid: appUser.uid,
  });

  // Initialize FCM for push notifications
  await initializeFCMForAuthOperation("signup", userCredential.user.uid);

  return appUser;
};

export const signInWithEmail = async ({
  email,
  password,
}: LoginCredentials): Promise<User> => {
  const userCredential = await signInWithEmailAndPassword(
    authService,
    email,
    password
  );

  // Initialize FCM for push notifications
  await initializeFCMForAuthOperation("signin", userCredential.user.uid);

  return convertFirebaseUser(userCredential.user);
};

// Google Sign-In
export const signInWithGoogle = async (): Promise<User> => {
  try {
    // Check if your device supports Google Play
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    // Get the users ID token
    const result: SignInResponse = await GoogleSignin.signIn();

    // Check if sign-in was successful and extract idToken
    if (result.type !== "success") {
      throw new Error("Google Sign-In was cancelled or failed");
    }

    const idToken = result.data.idToken;
    if (!idToken) {
      throw new Error("No ID token received from Google Sign-In");
    }

    // Create a Google credential with the token
    const googleCredential = GoogleAuthProvider.credential(idToken);

    // Sign-in the user with the credential
    const userCredential = await signInWithCredential(
      authService,
      googleCredential
    );

    const firestoreData = await createUserDocument(userCredential.user);

    // Create the complete user object with Firestore data
    const appUser: User = {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      displayName:
        firestoreData?.displayName || userCredential.user.displayName,
      photoURL: userCredential.user.photoURL,
      createdAt: firestoreData?.createdAt?.toDate() || new Date(),
      isAdmin: firestoreData?.isAdmin || false,
      emailVerified: userCredential.user.emailVerified,
    };

    // Manually update the store with the complete user object
    const { useAuthStore } = await import("../../store/authStore");
    useAuthStore.getState().setUser(appUser);
    logger.debug(
      "Auth store updated with complete user data (signInWithGoogle)",
      {
        displayName: appUser.displayName,
        uid: appUser.uid,
      }
    );

    // Initialize FCM for push notifications
    // Check if this is a new user (created recently) to determine FCM strategy
    const userCreationTime = new Date(
      userCredential.user.metadata.creationTime!
    ).getTime();
    const now = Date.now();
    const isNewUser =
      now - userCreationTime < AUTH_TIMEOUTS.NEW_USER_THRESHOLD_MS; // Consider new if created within threshold

    const operationType = isNewUser ? "signup" : "signin";
    await initializeFCMForAuthOperation(operationType, userCredential.user.uid);

    return appUser;
  } catch (error) {
    logger.error("Google Sign-In error", error);
    throw error;
  }
};

// Apple Sign-In
export const signInWithApple = async (): Promise<User> => {
  if (Platform.OS !== "ios") {
    throw new Error("Apple Sign-In is only available on iOS");
  }

  try {
    // Check if Apple Sign-In is available
    const isAvailable = await AppleAuthentication.isAvailableAsync();
    if (!isAvailable) {
      throw new Error("Apple Sign-In is not available on this device");
    }

    // Request Apple authentication
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      throw new Error("Apple Sign-In did not return an identity token");
    }

    // Create Firebase credential for Apple Sign-In
    // Apple credential may include nonce but it's not in the type definition
    const appleCredential =
      credential as AppleAuthentication.AppleAuthenticationCredential & {
        nonce?: string;
      };
    const firebaseCredential = auth.AppleAuthProvider.credential(
      credential.identityToken,
      appleCredential.nonce || undefined
    );

    // Sign in to Firebase
    const userCredential = await signInWithCredential(
      authService,
      firebaseCredential
    );

    // Update profile with Apple data if available
    if (
      credential.fullName &&
      (credential.fullName.givenName || credential.fullName.familyName)
    ) {
      const displayName = [
        credential.fullName.givenName,
        credential.fullName.familyName,
      ]
        .filter(Boolean)
        .join(" ");

      if (displayName && !userCredential.user.displayName) {
        await updateProfile(userCredential.user, { displayName });
      }
    }

    const firestoreData = await createUserDocument(userCredential.user);

    // Create the complete user object with Firestore data
    const appUser: User = {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      displayName:
        firestoreData?.displayName || userCredential.user.displayName,
      photoURL: userCredential.user.photoURL,
      createdAt: firestoreData?.createdAt?.toDate() || new Date(),
      isAdmin: firestoreData?.isAdmin || false,
      emailVerified: userCredential.user.emailVerified,
    };

    // Manually update the store with the complete user object
    const { useAuthStore } = await import("../../store/authStore");
    useAuthStore.getState().setUser(appUser);
    logger.debug(
      "Auth store updated with complete user data (signInWithApple)",
      {
        displayName: appUser.displayName,
        uid: appUser.uid,
      }
    );

    // Initialize FCM for push notifications
    // Check if this is a new user (created recently) to determine FCM strategy
    const userCreationTime = new Date(
      userCredential.user.metadata.creationTime!
    ).getTime();
    const now = Date.now();
    const isNewUser =
      now - userCreationTime < AUTH_TIMEOUTS.NEW_USER_THRESHOLD_MS; // Consider new if created within threshold

    const operationType = isNewUser ? "signup" : "signin";
    await initializeFCMForAuthOperation(operationType, userCredential.user.uid);

    return appUser;
  } catch (error: unknown) {
    logger.error("Apple Sign-In error", error);

    const appleError = error as AppleAuthError;

    // Provide more specific error messages
    if (appleError.code === "ERR_REQUEST_CANCELED") {
      throw new Error("Apple Sign-In was canceled by the user");
    } else if (appleError.code === "ERR_INVALID_RESPONSE") {
      throw new Error("Invalid response from Apple Sign-In");
    } else if (appleError.code === "ERR_REQUEST_FAILED") {
      throw new Error(
        "Apple Sign-In request failed. Please check your internet connection and try again."
      );
    } else if (appleError.message?.includes("not available")) {
      throw new Error("Apple Sign-In is not available on this device");
    } else if (appleError.message?.includes("authorization attempt failed")) {
      throw new Error(
        "Apple Sign-In failed. Please ensure you have a valid Apple ID and try again."
      );
    }

    throw error;
  }
};

// Email Verification
export const resendVerificationEmail = async (): Promise<void> => {
  const currentUser = authService.currentUser;

  if (currentUser && !currentUser.emailVerified) {
    await sendEmailVerification(currentUser);
  } else if (!currentUser) {
    throw new Error("No user is currently signed in");
  } else {
    throw new Error("Email is already verified");
  }
};

export const checkEmailVerified = async (): Promise<boolean> => {
  const currentUser = authService.currentUser;
  if (currentUser) {
    // Reload user to get latest email verification status
    await reload(currentUser);
    return currentUser.emailVerified;
  }
  return false;
};

// Password Reset
export const resetPassword = async (email: string): Promise<void> => {
  const validation = validateEmail(email);

  if (!validation.isValid) {
    throw new Error(validation.error || "Invalid email address");
  }

  await sendPasswordResetEmail(authService, email);
};

// Sign Out
export const signOutUser = async (): Promise<void> => {
  // Clean up FCM listeners but keep the token in the database
  // This allows the user to receive notifications when they sign back in
  try {
    await FCMService.cleanupListeners();
  } catch (error) {}

  await GoogleSignin.signOut();
  await signOut(authService);
};

// Delete Account
export const deleteAccount = async (): Promise<void> => {
  const currentUser = authService.currentUser;
  if (!currentUser) {
    throw new Error("No user is currently signed in");
  }

  try {
    // Clean up FCM token completely for account deletion
    try {
      await FCMService.cleanup();
    } catch (error) {
      logger.debug("FCM cleanup failed during account deletion", error);
    }

    const deleteUserDataFunction = httpsCallable(
      functionsService,
      "deleteUserData"
    );

    await deleteUserDataFunction({});

    // Explicitly sign out to ensure auth state updates
    try {
      await signOut(authService);
    } catch (signOutError) {
      logger.debug("Sign out error after deletion (this is expected)", {
        error:
          signOutError instanceof Error
            ? signOutError.message
            : String(signOutError),
      });
    }
  } catch (error) {
    logger.error("Error deleting user account", error);
    throw error;
  }
};

// Service function to update user onboarding status
export const updateUserOnboardingStatus = async (
  uid: string,
  completed: boolean = true
): Promise<void> => {
  logger.debug("Updating user onboarding status", { uid, completed });

  const userRef = doc(db, "users", uid);
  const updateData: Partial<FirestoreUserData> = {
    hasCompletedOnboarding: completed,
  };

  // Only set completion timestamp if marking as completed
  if (completed) {
    updateData.onboardingCompletedAt = new Date();
  }

  await updateDoc(userRef, updateData);
};

// Debounce mechanism for auth state changes
class AuthDebouncer {
  private timer: ReturnType<typeof setTimeout> | null = null;

  debounce(callback: () => void, delay: number): void {
    this.clear();
    this.timer = setTimeout(callback, delay);
  }

  clear(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}

const authDebouncer = new AuthDebouncer();
let lastAuthState: {
  uid: string | null;
  emailVerified: boolean;
  displayName: string | null;
} | null = null;

// Auth State Observer
export const subscribeToAuthChanges = (
  callback: (user: User | null) => void
): (() => void) => {
  const unsubscribe = onAuthStateChanged(authService, async (firebaseUser) => {
    // Check if this is a duplicate auth state change
    const currentAuthState = {
      uid: firebaseUser?.uid || null,
      emailVerified: firebaseUser?.emailVerified || false,
      displayName: firebaseUser?.displayName || null,
    };

    // Skip if auth state hasn't actually changed (but always check displayName too)
    if (
      lastAuthState &&
      lastAuthState.uid === currentAuthState.uid &&
      lastAuthState.emailVerified === currentAuthState.emailVerified &&
      lastAuthState.displayName === currentAuthState.displayName
    ) {
      return; // Skip duplicate auth state changes
    }

    lastAuthState = currentAuthState;

    // Clear any existing debounce timer
    authDebouncer.clear();

    // Debounce auth state changes (except for logout)
    if (!firebaseUser) {
      // Process logout immediately
      AuthCacheService.clearAll();
      callback(null);
      return;
    }

    // For login/auth state updates, use a small debounce
    authDebouncer.debounce(async () => {
      if (firebaseUser) {
        // Try to get cached user data first to avoid excessive Firestore reads
        let cachedUser: User | null = null;
        try {
          // AuthCacheService.getUserData returns null if not cached or expired
          const firestoreData = await AuthCacheService.getUserData(
            firebaseUser.uid
          );
          if (firestoreData) {
            // Reconstruct User object from cached Firestore data and Firebase auth data
            cachedUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              emailVerified: firebaseUser.emailVerified,
              createdAt: new Date(
                firebaseUser.metadata?.creationTime || Date.now()
              ),
              isAdmin: firestoreData.isAdmin || false,
            };
          }
        } catch (error) {
          logger.debug("Cache miss or error, will fetch fresh data", error);
        }

        if (cachedUser) {
          logger.debug(
            "Using cached user data, updated with latest Firebase auth info",
            {
              firebaseDisplayName: firebaseUser.displayName,
              cachedDisplayName: cachedUser.displayName,
            }
          );

          callback(cachedUser);
        } else {
          const user = await convertFirebaseUser(firebaseUser);
          callback(user);

          // Initialize FCM for existing authenticated users
          await initializeFCMForAuthOperation("observer", firebaseUser.uid);
        }
      }
    }, AUTH_DEBOUNCE_DELAY);
  });

  // Return cleanup function
  return () => {
    authDebouncer.clear();
    unsubscribe();
  };
};
