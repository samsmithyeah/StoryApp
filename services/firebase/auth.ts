import type { FirebaseAuthTypes } from "@react-native-firebase/auth";
import auth, {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "@react-native-firebase/auth";
import { doc, getDoc, setDoc } from "@react-native-firebase/firestore";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import * as AppleAuthentication from "expo-apple-authentication";
import { Platform } from "react-native";
import {
  LoginCredentials,
  SignUpCredentials,
  User,
} from "../../types/auth.types";
import { authService, db } from "./config";

// Convert Firebase User to our User type
const convertFirebaseUser = async (
  firebaseUser: FirebaseAuthTypes.User
): Promise<User> => {
  try {
    const userDocRef = doc(db, "users", firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);
    const userData = userDoc.data();

    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
      createdAt: userData?.createdAt?.toDate() || new Date(),
      isAdmin: userData?.isAdmin || false,
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
    };
  }
};

// Create user document in Firestore
const createUserDocument = async (user: FirebaseAuthTypes.User) => {
  try {
    const userDocRef = doc(db, "users", user.uid);
    const userSnapshot = await getDoc(userDocRef);

    if (!userSnapshot.exists()) {
      await setDoc(userDocRef, {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        createdAt: new Date(),
        children: [],
      });
      console.log("User document created in Firestore");
    } else {
      console.log("User document already exists");
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
export const configureGoogleSignIn = (webClientId: string) => {
  console.log("Configuring Google Sign-In with webClientId:", webClientId);
  GoogleSignin.configure({
    webClientId,
    offlineAccess: true,
    scopes: ["openid", "profile", "email"],
  });
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

  await createUserDocument(userCredential.user);
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
  return convertFirebaseUser(userCredential.user);
};

// Google Sign-In
export const signInWithGoogle = async (): Promise<User> => {
  try {
    console.log("Starting Google Sign-In...");

    // Check if your device supports Google Play
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    console.log("Google Play services available");

    // Get the users ID token
    console.log("Attempting to sign in with Google...");
    const result = await GoogleSignin.signIn();
    console.log("Google Sign-In result:", result);

    // Extract idToken from the result data
    const idToken = (result as any).data?.idToken || (result as any).idToken;
    if (!idToken) {
      throw new Error("No ID token received from Google Sign-In");
    }

    console.log("Got ID token, creating Firebase credential...");
    // Create a Google credential with the token
    const googleCredential = GoogleAuthProvider.credential(idToken);
    console.log("Created Google credential");

    // Sign-in the user with the credential
    const userCredential = await signInWithCredential(
      authService,
      googleCredential
    );
    console.log("Firebase sign-in successful");

    await createUserDocument(userCredential.user);
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
    console.log("Starting Apple Sign-In...");

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

    console.log("Apple authentication successful:", credential);

    if (!credential.identityToken) {
      throw new Error("Apple Sign-In did not return an identity token");
    }

    // Create Firebase credential for Apple Sign-In
    const firebaseCredential = auth.AppleAuthProvider.credential(
      credential.identityToken,
      (credential as any).nonce || undefined
    );

    console.log("Created Firebase credential for Apple");

    // Sign in to Firebase
    const userCredential = await signInWithCredential(
      authService,
      firebaseCredential
    );
    console.log("Firebase Apple sign-in successful");

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
        console.log("Updated user profile with Apple name:", displayName);
      }
    }

    await createUserDocument(userCredential.user);
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

// Sign Out
export const signOutUser = async (): Promise<void> => {
  await GoogleSignin.signOut();
  await signOut(authService);
};

// Auth State Observer
export const subscribeToAuthChanges = (
  callback: (user: User | null) => void
) => {
  return onAuthStateChanged(authService, async (firebaseUser) => {
    console.log(
      "Auth state changed:",
      firebaseUser ? "User logged in" : "User logged out"
    );
    if (firebaseUser) {
      console.log("Firebase user:", firebaseUser.uid, firebaseUser.email);
      const user = await convertFirebaseUser(firebaseUser);
      console.log("Converted user:", user);
      callback(user);
    } else {
      console.log("No user - showing login screen");
      callback(null);
    }
  });
};
