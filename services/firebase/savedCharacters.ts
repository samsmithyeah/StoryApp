import {
  doc,
  getDoc,
  updateDoc,
} from "@react-native-firebase/firestore";
import { authService, db } from "./config";
import { SavedCharacter } from "../../types/savedCharacter.types";

// Get saved characters for the current user
export const getSavedCharacters = async (): Promise<SavedCharacter[]> => {
  const user = authService.currentUser;
  if (!user) throw new Error("User not authenticated");

  const userDocRef = doc(db, "users", user.uid);
  const userDoc = await getDoc(userDocRef);
  const userData = userDoc.data();

  const savedCharacters = userData?.savedCharacters || [];

  // Convert Firestore timestamps back to Date objects and sort by createdAt desc
  return savedCharacters
    .map((character: any) => ({
      ...character,
      createdAt: character.createdAt?.toDate
        ? character.createdAt.toDate()
        : new Date(character.createdAt),
      updatedAt: character.updatedAt?.toDate
        ? character.updatedAt.toDate()
        : new Date(character.updatedAt),
    }))
    .sort((a: SavedCharacter, b: SavedCharacter) => b.createdAt.getTime() - a.createdAt.getTime());
};

// Add a new saved character
export const addSavedCharacter = async (
  character: Omit<SavedCharacter, "id" | "createdAt" | "updatedAt">
): Promise<SavedCharacter> => {
  const user = authService.currentUser;
  if (!user) throw new Error("User not authenticated");

  const now = new Date();
  const newCharacter: SavedCharacter = {
    ...character,
    id: Date.now().toString(), // Simple ID generation
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
};

// Update an existing saved character
export const updateSavedCharacter = async (
  characterId: string,
  updates: Partial<Omit<SavedCharacter, "id" | "createdAt" | "updatedAt">>
): Promise<void> => {
  const user = authService.currentUser;
  if (!user) throw new Error("User not authenticated");

  const userDocRef = doc(db, "users", user.uid);
  const userDoc = await getDoc(userDocRef);
  const userData = userDoc.data();
  const currentCharacters = userData?.savedCharacters || [];

  const updatedCharacters = currentCharacters.map((character: SavedCharacter) =>
    character.id === characterId 
      ? { ...character, ...updates, updatedAt: new Date() } 
      : character
  );

  await updateDoc(userDocRef, {
    savedCharacters: updatedCharacters,
  });
};

// Delete a saved character
export const deleteSavedCharacter = async (
  characterId: string
): Promise<void> => {
  const user = authService.currentUser;
  if (!user) throw new Error("User not authenticated");

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
};