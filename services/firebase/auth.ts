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
import { doc, getDoc, setDoc } from "@react-native-firebase/firestore";
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
import { FCMService } from "../fcm";
import { authService, db, functionsService } from "./config";
import { creditsService } from "./credits";

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
    const userData = userDoc.data();

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

// Create user document in Firestore
const createUserDocument = async (
  user: FirebaseAuthTypes.User,
  overrideDisplayName?: string
) => {
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

    // Always set core user data with merge: true to ensure it exists
    const userData = {
      email: user.email,
      displayName: finalDisplayName,
      photoURL: user.photoURL,
      // Only set createdAt and children for new users, not existing ones
      ...(userSnapshot.exists() ? {} : { createdAt: new Date(), children: [] }),
    };
    logger.debug("User data to set/merge", userData);

    await setDoc(userRef, userData, { merge: true });
    logger.debug("User document created/updated successfully");

    // Verify the document was actually written by reading it back
    const verifySnapshot = await getDoc(userRef);
    if (verifySnapshot.exists()) {
      const savedData = verifySnapshot.data();
      logger.debug("Document verification successful", {
        hasEmail: !!savedData?.email,
        hasDisplayName: !!savedData?.displayName,
        hasFcmToken: !!savedData?.fcmToken,
      });
    } else {
      logger.error("Document verification FAILED - document does not exist");
    }

    if (!userSnapshot.exists()) {
      logger.debug("New user - initializing credits");
      await creditsService.initializeUserCredits(user.uid);
      logger.debug("Credits initialized successfully");
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
    logger.debug("User document creation process completed");
  } catch (error) {
    logger.error("Failed to create user document in Firestore", error);
    // Don't throw error - authentication can still work without Firestore
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

      // Small delay to ensure Firebase processes the profile update
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Force a complete auth refresh to ensure the profile update persists
      await reload(userCredential.user);

      // Get fresh user instance after reload
      const currentUser = authService.currentUser;
      logger.debug("After reload - Firebase displayName", {
        displayName: currentUser?.displayName,
      });

      // Clear user cache to force fresh data fetch in auth state observer
      userCache = {};
      logger.debug("Firebase profile updated successfully and cache cleared");
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
  }

  // Pass displayName directly to avoid timing issues with Firebase profile updates
  const finalDisplayName = displayName?.trim() || null;
  logger.debug("Creating user document", {
    displayName: finalDisplayName,
  });

  await createUserDocument(userCredential.user, finalDisplayName || undefined);

  // Force auth state observer to re-evaluate by clearing the last auth state
  lastAuthState = null;

  // Manually trigger auth state change to pick up the Firestore data
  setTimeout(async () => {
    logger.debug("Attempting forced reload after user document creation");
    const currentUser = authService.currentUser;
    if (currentUser) {
      logger.debug("Current user exists, reloading (signUpWithEmail)");
      await reload(currentUser);
      logger.debug(
        "Reload completed, forcing auth state callback (signUpWithEmail)"
      );

      // Clear the user cache to force fresh Firestore read
      userCache = {};

      // Temporarily clear lastAuthState to force the callback to run
      lastAuthState = null;

      // Manually trigger the auth state observer callback with fresh data
      setTimeout(async () => {
        const user = await convertFirebaseUser(currentUser);
        logger.debug(
          "Manually triggering auth store update (signUpWithEmail)",
          {
            displayName: user.displayName,
            uid: user.uid,
          }
        );

        // Force the auth store to update by calling the setter directly
        const { useAuthStore } = await import("../../store/authStore");
        useAuthStore.getState().setUser(user);
        logger.debug("Auth store manually updated (signUpWithEmail)");
      }, 100);
    } else {
      logger.debug("No current user for forced reload (signUpWithEmail)");
    }
  }, 500);

  // Initialize FCM for push notifications with a small delay to ensure user document is created
  try {
    logger.debug("Starting FCM initialization for new email signup user", {
      uid: userCredential.user.uid,
    });
    // Small delay to ensure Firestore document is fully created
    logger.debug("Waiting 1 second for Firestore document to settle");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    logger.debug("Delay complete, initializing FCM with force flag");
    await FCMService.initializeFCM(true); // Force re-initialization for new users
    logger.debug("FCM initialization completed successfully for email signup");
  } catch (error) {
    logger.error("FCM initialization failed for email signup", error);
  }

  return convertFirebaseUser(userCredential.user);
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
  try {
    await FCMService.initializeFCM();
  } catch (error) {
    logger.error("FCM initialization failed for existing user sign-in", error);
  }

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

    await createUserDocument(userCredential.user);

    // Force auth state observer to re-evaluate by clearing the last auth state
    lastAuthState = null;

    // Manually trigger auth state change to pick up the Firestore data
    setTimeout(async () => {
      logger.debug(
        "Attempting forced reload after user document creation (signInWithGoogle)"
      );
      const currentUser = authService.currentUser;
      if (currentUser) {
        logger.debug("Current user exists, reloading (signInWithGoogle)");
        await reload(currentUser);
        logger.debug(
          "Reload completed, forcing auth state callback (signInWithGoogle)"
        );

        // Clear the user cache to force fresh Firestore read
        userCache = {};

        // Temporarily clear lastAuthState to force the callback to run
        lastAuthState = null;

        // Manually trigger the auth state observer callback with fresh data
        setTimeout(async () => {
          const user = await convertFirebaseUser(currentUser);
          logger.debug(
            "Manually triggering auth store update (signInWithGoogle)",
            {
              displayName: user.displayName,
              uid: user.uid,
            }
          );

          // Force the auth store to update by calling the setter directly
          const { useAuthStore } = await import("../../store/authStore");
          useAuthStore.getState().setUser(user);
          logger.debug("Auth store manually updated (signInWithGoogle)");
        }, 100);
      } else {
        logger.debug("No current user for forced reload (signInWithGoogle)");
      }
    }, 500);

    // Initialize FCM for push notifications with delay for new users
    try {
      // Small delay to ensure Firestore document is fully created for new users
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await FCMService.initializeFCM(true); // Force re-initialization for new users
    } catch (error) {
      logger.error("FCM initialization failed", error);
    }

    return convertFirebaseUser(userCredential.user);
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

    await createUserDocument(userCredential.user);

    // Force auth state observer to re-evaluate by clearing the last auth state
    lastAuthState = null;

    // Manually trigger auth state change to pick up the Firestore data
    setTimeout(async () => {
      logger.debug(
        "Attempting forced reload after user document creation (signInWithApple)"
      );
      const currentUser = authService.currentUser;
      if (currentUser) {
        logger.debug("Current user exists, reloading (signInWithApple)");
        await reload(currentUser);
        logger.debug(
          "Reload completed, forcing auth state callback (signInWithApple)"
        );

        // Clear the user cache to force fresh Firestore read
        userCache = {};

        // Temporarily clear lastAuthState to force the callback to run
        lastAuthState = null;

        // Manually trigger the auth state observer callback with fresh data
        setTimeout(async () => {
          const user = await convertFirebaseUser(currentUser);
          logger.debug(
            "Manually triggering auth store update (signInWithApple)",
            {
              displayName: user.displayName,
              uid: user.uid,
            }
          );

          // Force the auth store to update by calling the setter directly
          const { useAuthStore } = await import("../../store/authStore");
          useAuthStore.getState().setUser(user);
          logger.debug("Auth store manually updated (signInWithApple)");
        }, 100);
      } else {
        logger.debug("No current user for forced reload (signInWithApple)");
      }
    }, 500);

    // Initialize FCM for push notifications with delay for new users
    try {
      // Small delay to ensure Firestore document is fully created for new users
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await FCMService.initializeFCM(true); // Force re-initialization for new users
    } catch (error) {
      logger.error("FCM initialization failed", error);
    }

    return convertFirebaseUser(userCredential.user);
  } catch (error: any) {
    logger.error("Apple Sign-In error", error);

    // Provide more specific error messages
    if (error.code === "ERR_REQUEST_CANCELED") {
      throw new Error("Apple Sign-In was canceled by the user");
    } else if (error.code === "ERR_INVALID_RESPONSE") {
      throw new Error("Invalid response from Apple Sign-In");
    } else if (error.code === "ERR_REQUEST_FAILED") {
      throw new Error(
        "Apple Sign-In request failed. Please check your internet connection and try again."
      );
    } else if (error.message?.includes("not available")) {
      throw new Error("Apple Sign-In is not available on this device");
    } else if (error.message?.includes("authorization attempt failed")) {
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
  // Cleanup FCM token before sign out
  try {
    await FCMService.cleanup();
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

// Cache to prevent excessive Firestore reads during auth state changes
let userCache: { [uid: string]: { user: User; timestamp: number } } = {};
const CACHE_DURATION = 60000; // Increased to 60 seconds to reduce cache misses

// Debounce mechanism for auth state changes
let authDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let lastAuthState: {
  uid: string | null;
  emailVerified: boolean;
  displayName: string | null;
} | null = null;

// Auth State Observer
export const subscribeToAuthChanges = (
  callback: (user: User | null) => void
) => {
  return onAuthStateChanged(authService, async (firebaseUser) => {
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
    if (authDebounceTimer) {
      clearTimeout(authDebounceTimer);
    }

    // Debounce auth state changes (except for logout)
    if (!firebaseUser) {
      // Process logout immediately
      userCache = {};
      callback(null);
      return;
    }

    // For login/auth state updates, use a small debounce
    authDebounceTimer = setTimeout(async () => {
      if (firebaseUser) {
        // Check cache first to avoid excessive Firestore reads
        const cached = userCache[firebaseUser.uid];
        const now = Date.now();

        if (cached && now - cached.timestamp < CACHE_DURATION) {
          // Update the cached user with latest auth info (like emailVerified and displayName)
          logger.debug(
            "Using cached user, updating with latest Firebase data",
            {
              firebaseDisplayName: firebaseUser.displayName,
              cachedDisplayName: cached.user.displayName,
            }
          );

          // Prefer Firebase displayName if it exists, otherwise keep cached version
          const updatedUser = {
            ...cached.user,
            emailVerified: firebaseUser.emailVerified,
            displayName: firebaseUser.displayName || cached.user.displayName,
          };

          logger.debug("Final updated user", {
            displayName: updatedUser.displayName,
          });

          // Update the cache with the new data
          userCache[firebaseUser.uid] = { user: updatedUser, timestamp: now };

          callback(updatedUser);
        } else {
          const user = await convertFirebaseUser(firebaseUser);
          // Cache the user data
          userCache[firebaseUser.uid] = { user, timestamp: now };
          callback(user);

          // Initialize FCM for existing authenticated users
          try {
            await FCMService.initializeFCM();
          } catch (error) {
            logger.debug("FCM initialization failed in auth state observer", {
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }
      }
    }, 100); // 100ms debounce to group rapid auth state changes
  });
};
