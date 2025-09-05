import { doc, getDoc, updateDoc } from "@react-native-firebase/firestore";
import { SavedCharacter } from "../../types/savedCharacter.types";
import { authService, db } from "./config";
import { handleAuthStateMismatch } from "./utils";

// Get saved characters for the current user
export const getSavedCharacters = async (): Promise<SavedCharacter[]> => {
  const user = authService.currentUser;
  if (!user) throw new Error("User not authenticated");

  try {
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);
    const userData = userDoc.data();

    const savedCharacters = userData?.savedCharacters || [];

    // Convert Firestore timestamps back to Date objects and sort by createdAt desc
    return savedCharacters
      .map((character: any) => ({
        ...character,
        createdAt: character.createdAt
          ? character.createdAt.toDate
            ? character.createdAt.toDate()
            : new Date(character.createdAt)
          : undefined,
        updatedAt: character.updatedAt
          ? character.updatedAt.toDate
            ? character.updatedAt.toDate()
            : new Date(character.updatedAt)
          : undefined,
      }))
      .sort((a: SavedCharacter, b: SavedCharacter) => {
        if (!a.createdAt && !b.createdAt) return 0;
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
  } catch (error) {
    await handleAuthStateMismatch(error, "getSavedCharacters");
    return []; // This line will never be reached due to the throw above, but keeps TypeScript happy
  }
};

// Add a new saved character
export const addSavedCharacter = async (
  character: Omit<SavedCharacter, "id" | "createdAt" | "updatedAt">
): Promise<SavedCharacter> => {
  const user = authService.currentUser;
  if (!user) throw new Error("User not authenticated");

  try {
    const now = new Date();
    const newCharacter: SavedCharacter = {
      ...character,
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, // More robust ID generation
      createdAt: now,
      updatedAt: now,
    };

    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);
    const userData = userDoc.data();
    const currentCharacters = userData?.savedCharacters || [];

    await updateDoc(userDocRef, {
      savedCharacters: [...currentCharacters, newCharacter],
    });

    return newCharacter;
  } catch (error) {
    await handleAuthStateMismatch(error, "addSavedCharacter");
    throw error; // Re-throw after handling auth mismatch
  }
};

// Update an existing saved character
export const updateSavedCharacter = async (
  characterId: string,
  updates: Partial<Omit<SavedCharacter, "id" | "createdAt" | "updatedAt">>
): Promise<void> => {
  const user = authService.currentUser;
  if (!user) throw new Error("User not authenticated");

  try {
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);
    const userData = userDoc.data();
    const currentCharacters = userData?.savedCharacters || [];

    const updatedCharacters = currentCharacters.map(
      (character: SavedCharacter) =>
        character.id === characterId
          ? { ...character, ...updates, updatedAt: new Date() }
          : character
    );

    await updateDoc(userDocRef, {
      savedCharacters: updatedCharacters,
    });
  } catch (error) {
    await handleAuthStateMismatch(error, "updateSavedCharacter");
    throw error; // Re-throw after handling auth mismatch
  }
};

// Delete a saved character
export const deleteSavedCharacter = async (
  characterId: string
): Promise<void> => {
  const user = authService.currentUser;
  if (!user) throw new Error("User not authenticated");

  try {
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);
    const userData = userDoc.data();
    const currentCharacters = userData?.savedCharacters || [];

    const filteredCharacters = currentCharacters.filter(
      (character: SavedCharacter) => character.id !== characterId
    );

    await updateDoc(userDocRef, {
      savedCharacters: filteredCharacters,
    });
  } catch (error) {
    await handleAuthStateMismatch(error, "deleteSavedCharacter");
    throw error; // Re-throw after handling auth mismatch
  }
};
