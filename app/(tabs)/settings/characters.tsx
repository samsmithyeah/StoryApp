import { useRouter } from "expo-router";
import React from "react";
import { SafeAreaView, ScrollView, StyleSheet } from "react-native";
import Toast from "react-native-toast-message";
import { BackgroundContainer } from "@/components/shared/BackgroundContainer";
import { StarsDecorations } from "@/components/credits/StarsDecorations";
import { SavedCharactersSection } from "@/components/settings/SavedCharactersSection";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Spacing } from "@/constants/Theme";
import { useSavedCharacters } from "@/hooks/useSavedCharacters";
import { SavedCharacter } from "@/types/savedCharacter.types";

export default function CharactersSettingsScreen() {
  const router = useRouter();
  const {
    savedCharacters,
    loading: _savedCharsLoading,
    error: savedCharsError,
    deleteSavedCharacter,
    clearError: clearSavedCharsError,
  } = useSavedCharacters();

  const handleAddSavedCharacter = () => {
    router.push("/saved-character-profile");
  };

  const handleEditSavedCharacter = (character: SavedCharacter) => {
    router.push(`/saved-character-profile?characterId=${character.id}`);
  };

  const handleDeleteSavedCharacter = async (characterId: string) => {
    try {
      await deleteSavedCharacter(characterId);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to delete saved character",
        visibilityTime: 3000,
      });
    }
  };

  return (
    <BackgroundContainer showDecorations={false}>
      <StarsDecorations />

      <ScreenHeader title="Saved characters" />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          contentInsetAdjustmentBehavior="automatic"
        >
          <SavedCharactersSection
            savedCharacters={savedCharacters}
            error={savedCharsError}
            onClearError={clearSavedCharsError}
            onAddCharacter={handleAddSavedCharacter}
            onEditCharacter={handleEditSavedCharacter}
            onDeleteCharacter={handleDeleteSavedCharacter}
          />
        </ScrollView>
      </SafeAreaView>
    </BackgroundContainer>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing.screenPadding,
  },
});
