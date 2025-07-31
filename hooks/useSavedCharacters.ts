import { useEffect } from "react";
import { useSavedCharactersStore } from "../store/savedCharactersStore";
import { useAuth } from "./useAuth";

export const useSavedCharacters = () => {
  const { user } = useAuth();
  const {
    characters,
    loading,
    error,
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
    addSavedCharacter: addCharacter,
    updateSavedCharacter: updateCharacter,
    deleteSavedCharacter: deleteCharacter,
    clearError,
    temporaryCharacter,
    addTemporaryCharacter,
    clearTemporaryCharacter,
  };
};
