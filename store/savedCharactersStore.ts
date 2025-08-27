import { create } from "zustand";
import {
  addSavedCharacter as addSavedCharacterService,
  deleteSavedCharacter as deleteSavedCharacterService,
  getSavedCharacters,
  updateSavedCharacter as updateSavedCharacterService,
} from "../services/firebase/savedCharacters";
import {
  SavedCharacter,
  SavedCharactersState,
} from "../types/savedCharacter.types";
import { StoryCharacter } from "../types/story.types";

interface TemporaryCharacterPayload {
  character: StoryCharacter;
  indexToUpdate?: number;
  removeIndex?: number;
}

type LoadState = "idle" | "loading" | "loaded" | "error";

interface SavedCharactersStore extends SavedCharactersState {
  loadState: LoadState;
  isInitialLoadComplete: boolean;
  loadCharacters: () => Promise<void>;
  addCharacter: (
    character: Omit<SavedCharacter, "id" | "createdAt" | "updatedAt">
  ) => Promise<SavedCharacter>;
  updateCharacter: (
    characterId: string,
    updates: Partial<Omit<SavedCharacter, "id" | "createdAt" | "updatedAt">>
  ) => Promise<void>;
  deleteCharacter: (characterId: string) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  temporaryCharacter: TemporaryCharacterPayload | null;
  addTemporaryCharacter: (payload: TemporaryCharacterPayload) => void;
  clearTemporaryCharacter: () => void;
}

export const useSavedCharactersStore = create<SavedCharactersStore>(
  (set, get) => ({
    characters: [],
    loading: false,
    error: null,
    loadState: "idle" as LoadState,
    isInitialLoadComplete: false,
    temporaryCharacter: null,

    loadCharacters: async () => {
      try {
        set({ loading: true, error: null, loadState: "loading" });
        const characters = await getSavedCharacters();
        set({
          characters,
          loading: false,
          loadState: "loaded",
          isInitialLoadComplete: true,
        });
      } catch (error) {
        set({
          error:
            error instanceof Error
              ? error.message
              : "Failed to load saved characters",
          loading: false,
          loadState: "error",
          isInitialLoadComplete: true,
        });
      }
    },

    addCharacter: async (character) => {
      try {
        set({ loading: true, error: null });
        const newCharacter = await addSavedCharacterService(character);
        const currentCharacters = get().characters;
        const updatedCharacters = [newCharacter, ...currentCharacters].sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
        );
        set({
          characters: updatedCharacters,
          loading: false,
        });
        return newCharacter;
      } catch (error) {
        set({
          error:
            error instanceof Error
              ? error.message
              : "Failed to add saved character",
          loading: false,
        });
        throw error;
      }
    },

    updateCharacter: async (characterId, updates) => {
      try {
        set({ loading: true, error: null });
        await updateSavedCharacterService(characterId, updates);
        const currentCharacters = get().characters;
        const updatedCharacters = currentCharacters
          .map((character) =>
            character.id === characterId
              ? { ...character, ...updates, updatedAt: new Date() }
              : character
          )
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        set({
          characters: updatedCharacters,
          loading: false,
        });
      } catch (error) {
        set({
          error:
            error instanceof Error
              ? error.message
              : "Failed to update saved character",
          loading: false,
        });
      }
    },

    deleteCharacter: async (characterId) => {
      try {
        set({ loading: true, error: null });
        await deleteSavedCharacterService(characterId);
        const currentCharacters = get().characters;
        const filteredCharacters = currentCharacters.filter(
          (character) => character.id !== characterId
        );
        set({
          characters: filteredCharacters,
          loading: false,
        });
      } catch (error) {
        set({
          error:
            error instanceof Error
              ? error.message
              : "Failed to delete saved character",
          loading: false,
        });
      }
    },

    addTemporaryCharacter: (payload: TemporaryCharacterPayload) => {
      set({ temporaryCharacter: payload });
    },

    clearTemporaryCharacter: () => {
      set({ temporaryCharacter: null });
    },

    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
  })
);
