import { getApp, getApps, initializeApp } from "@react-native-firebase/app";
import { getAuth } from "@react-native-firebase/auth";
import { getFirestore } from "@react-native-firebase/firestore";
import { getFunctions } from "@react-native-firebase/functions";
import { getStorage } from "@react-native-firebase/storage";

// Initialize Firebase app if not already initialized
let app;
if (getApps().length === 0) {
  app = initializeApp({
    apiKey: "default",
    authDomain: "default",
    databaseURL: "default",
    projectId: "default",
    storageBucket: "default",
    messagingSenderId: "default",
    appId: "default",
  });
} else {
  app = getApp();
}

// Get Firebase services using modular API
export const authService = getAuth();
export const db = getFirestore();
export const functionsService = getFunctions(undefined, "us-central1");
export const storageService = getStorage();

// For development, you might want to use emulator
// if (__DEV__) {
//   try {
//     functionsService.useEmulator('localhost', 5001);
//     console.log('Using Firebase Functions emulator');
//   } catch (error) {
//     console.log('Functions emulator not available, using production');
//   }
// }
