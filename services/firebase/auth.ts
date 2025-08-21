import type { FirebaseAuthTypes } from "@react-native-firebase/auth";
import auth, {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "@react-native-firebase/auth";
import { doc, getDoc, setDoc } from "@react-native-firebase/firestore";
import { httpsCallable } from "@react-native-firebase/functions";
import { db } from "./config";
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
import { FCMService } from "../fcm";
import { authService, functionsService } from "./config";
import { creditsService } from "./credits";

// Convert Firebase User to our User type
const convertFirebaseUser = async (
  firebaseUser: FirebaseAuthTypes.User
): Promise<User> => {
  try {
    const userRef = doc(db, "users", firebaseUser.uid);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();

    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
      createdAt: userData?.createdAt?.toDate() || new Date(),
      isAdmin: userData?.isAdmin || false,
      emailVerified: firebaseUser.emailVerified,
    };
  } catch (error) {
    console.log(
      "Firestore error in convertFirebaseUser, using basic user data:",
      error instanceof Error ? error.message : String(error)
    );
    // Return basic user data if Firestore fails
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
      createdAt: new Date(),
      isAdmin: false,
      emailVerified: firebaseUser.emailVerified,
    };
  }
};

// Create user document in Firestore
const createUserDocument = async (user: FirebaseAuthTypes.User) => {
  try {
    const userRef = doc(db, "users", user.uid);
    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) {
      await setDoc(userRef, {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        createdAt: new Date(),
        children: [],
      });

      // Initialize free credits for new users
      await creditsService.initializeUserCredits(user.uid);
    } else {
      // Check if user has credits initialized (for existing users before credits system)
      const userCredits = await creditsService.getUserCredits(user.uid);
      if (!userCredits) {
        await creditsService.initializeUserCredits(user.uid);
      }
    }
  } catch (error) {
    console.log(
      "Failed to create user document in Firestore:",
      error instanceof Error ? error.message : String(error)
    );
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

  if (displayName) {
    await updateProfile(userCredential.user, { displayName });
  }

  // Check if this is a test account (for development only)
  const isTestAccount = __DEV__ && email.endsWith("@test.dreamweaver");

  if (!isTestAccount) {
    // Send email verification for real accounts
    try {
      await sendEmailVerification(userCredential.user);
    } catch (verificationError) {
      console.error("Failed to send email verification:", verificationError);
      Alert.alert(
        "Verification error",
        "We encountered an issue while sending the verification email. Please try sending it again.",
        [{ text: "OK" }]
      );
    }
  } else {
  }

  await createUserDocument(userCredential.user);

  // Initialize FCM for push notifications
  try {
    await FCMService.initializeFCM();
  } catch (error) {}

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
  } catch (error) {}

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

    // Initialize FCM for push notifications
    try {
      await FCMService.initializeFCM();
    } catch (error) {}

    return convertFirebaseUser(userCredential.user);
  } catch (error) {
    console.error("Google Sign-In error:", error);
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

    // Initialize FCM for push notifications
    try {
      await FCMService.initializeFCM();
    } catch (error) {}

    return convertFirebaseUser(userCredential.user);
  } catch (error: any) {
    console.error("Apple Sign-In error:", error);

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
      console.log(
        "Sign out error after deletion (this is expected):",
        signOutError
      );
    }
  } catch (error) {
    console.error("Error deleting user account:", error);
    throw error;
  }
};

// Cache to prevent excessive Firestore reads during auth state changes
let userCache: { [uid: string]: { user: User; timestamp: number } } = {};
const CACHE_DURATION = 60000; // Increased to 60 seconds to reduce cache misses

// Debounce mechanism for auth state changes
let authDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let lastAuthState: { uid: string | null; emailVerified: boolean } | null = null;

// Auth State Observer
export const subscribeToAuthChanges = (
  callback: (user: User | null) => void
) => {
  return onAuthStateChanged(authService, async (firebaseUser) => {
    // Check if this is a duplicate auth state change
    const currentAuthState = {
      uid: firebaseUser?.uid || null,
      emailVerified: firebaseUser?.emailVerified || false,
    };

    // Skip if auth state hasn't actually changed
    if (
      lastAuthState &&
      lastAuthState.uid === currentAuthState.uid &&
      lastAuthState.emailVerified === currentAuthState.emailVerified
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
          // Update the cached user with latest auth info (like emailVerified)
          const updatedUser = {
            ...cached.user,
            emailVerified: firebaseUser.emailVerified,
          };
          callback(updatedUser);
        } else {
          const user = await convertFirebaseUser(firebaseUser);
          // Cache the user data
          userCache[firebaseUser.uid] = { user, timestamp: now };
          callback(user);

          // Initialize FCM for existing authenticated users
          try {
            await FCMService.initializeFCM();
          } catch (error) {}
        }
      }
    }, 100); // 100ms debounce to group rapid auth state changes
  });
};
