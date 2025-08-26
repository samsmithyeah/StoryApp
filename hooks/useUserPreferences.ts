import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "@react-native-firebase/firestore";
import { db } from "../services/firebase/config";
import { useAuth } from "./useAuth";
import { logger } from "../utils/logger";

// Note: Firestore security rules must allow read/write access to:
// users/{userId}/preferences/{document}
// Example rule:
// match /users/{userId}/preferences/{document} {
//   allow read, write: if request.auth != null && request.auth.uid == userId;
// }

export interface UserPreferences {
  // Model preferences
  textModel: "gpt-4o" | "gemini-2.5-pro";
  coverImageModel:
    | "gemini-2.0-flash-preview-image-generation"
    | "dall-e-3"
    | "gpt-image-1";
  pageImageModel: "flux" | "gemini" | "gpt-image-1";
  // Model generation settings
  temperature: number; // 0.0 to 2.0, controls randomness/creativity
  geminiThinkingBudget: number; // -1 for dynamic, 128-32768 for fixed budget
}

const DEFAULT_PREFERENCES: UserPreferences = {
  textModel: "gemini-2.5-pro",
  coverImageModel: "gpt-image-1",
  pageImageModel: "gemini",
  temperature: 0.9,
  geminiThinkingBudget: -1, // Dynamic thinking
};

export const useUserPreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] =
    useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setPreferences(DEFAULT_PREFERENCES);
      setLoading(false);
      return;
    }

    const loadPreferences = async () => {
      try {
        setLoading(true);
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          // Extract preferences from user document
          const userPreferences = data?.preferences as UserPreferences;
          if (userPreferences) {
            setPreferences({ ...DEFAULT_PREFERENCES, ...userPreferences });
          } else {
            setPreferences(DEFAULT_PREFERENCES);
          }
        } else {
          // User document doesn't exist yet
          setPreferences(DEFAULT_PREFERENCES);
        }
      } catch (err) {
        logger.error("Error loading preferences", err);
        setError("Failed to load preferences");
        setPreferences(DEFAULT_PREFERENCES);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [user]);

  const updatePreferences = async (
    newPreferences: Partial<UserPreferences>
  ) => {
    if (!user) {
      setError("User must be logged in to update preferences");
      return;
    }

    try {
      const updatedPreferences = { ...preferences, ...newPreferences };
      const docRef = doc(db, "users", user.uid);

      try {
        // Try to update the preferences field in the user document
        await updateDoc(docRef, {
          preferences: updatedPreferences,
          updatedAt: serverTimestamp(),
        });
      } catch (updateError: any) {
        // If update fails (document doesn't exist), create it with set
        if (updateError.code === "not-found") {
          await setDoc(
            docRef,
            {
              preferences: updatedPreferences,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        } else {
          throw updateError;
        }
      }
      setPreferences(updatedPreferences);
      setError(null);
    } catch (err) {
      logger.error("Error updating preferences", err);
      setError("Failed to update preferences");
    }
  };

  return {
    preferences,
    loading,
    error,
    updatePreferences,
  };
};
