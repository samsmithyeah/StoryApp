import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Firebase web SDK configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase Web SDK
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Get Firebase services
export const webAuth = getAuth(app);
export const webFirestore = getFirestore(app);
export const webFunctions = getFunctions(app);
export const webStorage = getStorage(app);

// For development - connect to emulators if running locally
if (__DEV__) {
  // Uncomment these if you're running Firebase emulators
  // connectAuthEmulator(webAuth, 'http://localhost:9099');
  // connectFirestoreEmulator(webFirestore, 'localhost', 8080);
  // connectFunctionsEmulator(webFunctions, 'localhost', 5001);
  // connectStorageEmulator(webStorage, 'localhost', 9199);
}

export default app;