import { useEffect } from "react";
import { useSavedCharactersStore } from "../store/savedCharactersStore";
import { useAuth } from "./useAuth";

export const useSavedCharacters = () => {
  const { user } = useAuth();
  const {
    characters,
    loading,
    error,
    loadState,
    isInitialLoadComplete,
    loadCharacters,
    addCharacter,
    updateCharacter,
    deleteCharacter,
    setError,
    temporaryCharacter,
    addTemporaryCharacter,
    clearTemporaryCharacter,
  } = useSavedCharactersStore();

  useEffect(() => {
    if (user) {
      loadCharacters();
    }
  }, [user, loadCharacters]);

  const clearError = () => setError(null);

  return {
    savedCharacters: characters,
    loading,
    error,
    loadState,
    isInitialLoadComplete,
    addSavedCharacter: addCharacter,
    updateSavedCharacter: updateCharacter,
    deleteSavedCharacter: deleteCharacter,
    clearError,
    temporaryCharacter,
    addTemporaryCharacter,
    clearTemporaryCharacter,
  };
};
