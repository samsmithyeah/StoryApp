import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useRef } from "react";
import { logger } from "@/utils/logger";
import { Analytics } from "@/utils/analytics";
import {
  Alert,
  ImageBackground,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { toastConfig } from "@/components/ui/CustomToast";
import { SavedCharacterForm } from "../components/settings/SavedCharacterForm";
import { Colors, Spacing, Typography } from "../constants/Theme";
import { useSavedCharacters } from "../hooks/useSavedCharacters";
import { useWizardStore } from "../store/wizardStore";
import { SavedCharacter } from "../types/savedCharacter.types";
import { StoryCharacter } from "../types/story.types";

export default function SavedCharacterProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    characterId?: string;
    fromWizard?: string;
    tempCharIndex?: string;
    name?: string;
    description?: string;
    appearance?: string;
  }>();
  const { savedCharacters, loading, addSavedCharacter, updateSavedCharacter } =
    useSavedCharacters();
  const {
    oneOffCharacters,
    addOneOffCharacter,
    updateOneOffCharacter,
    removeOneOffCharacter,
    addSavedCharacterToSelection,
  } = useWizardStore();
  const formRef = useRef<{
    handleSave: () => void;
    hasUnsavedChanges: () => boolean;
  }>(null);

  const character = params.characterId
    ? savedCharacters?.find((c) => c.id === params.characterId)
    : params.tempCharIndex // If it's a temp character, build it from params
      ? {
          name: params.name,
          description: params.description,
          appearance: params.appearance,
        }
      : undefined;

  const handleSave = async (
    characterData: Omit<SavedCharacter, "id" | "createdAt" | "updatedAt">,
    shouldSave: boolean = true
  ) => {
    try {
      if (params.characterId && character) {
        await updateSavedCharacter(params.characterId, characterData);
      } else if (params.tempCharIndex) {
        // Editing a temp character
        const tempCharIndex = parseInt(params.tempCharIndex, 10);
        if (
          isNaN(tempCharIndex) ||
          tempCharIndex < 0 ||
          tempCharIndex >= oneOffCharacters.length
        ) {
          throw new Error("Invalid temp character index");
        }

        if (shouldSave) {
          // Save permanently and remove the temp character
          const newSavedChar = await addSavedCharacter(characterData);

          // Track character created (converting temp to saved)
          Analytics.logCharacterCreated({
            character_type: "custom",
            creation_method: "wizard",
          });

          removeOneOffCharacter(tempCharIndex);
          addSavedCharacterToSelection(newSavedChar);
        } else {
          // Just update the temp character
          const fullDescription = [
            characterData.description,
            characterData.appearance,
          ]
            .filter(Boolean)
            .join("; ");

          const tempChar: StoryCharacter = {
            name: characterData.name,
            description: fullDescription || undefined,
            isChild: false,
            isOneOff: true,
          };

          updateOneOffCharacter(tempCharIndex, tempChar);
        }
      } else if (shouldSave) {
        const newSavedChar = await addSavedCharacter(characterData);

        // Track character created (new saved character)
        Analytics.logCharacterCreated({
          character_type: "custom",
          creation_method: params.fromWizard === "true" ? "wizard" : "manual",
        });

        if (params.fromWizard === "true") {
          addSavedCharacterToSelection(newSavedChar);
        }
      } else {
        // Creating a new temp character
        const fullDescription = [
          characterData.description,
          characterData.appearance,
        ]
          .filter(Boolean)
          .join("; ");

        const tempChar: StoryCharacter = {
          name: characterData.name,
          description: fullDescription || undefined,
          isChild: false,
          isOneOff: true,
        };

        addOneOffCharacter(tempChar);
      }

      router.back();
    } catch (error) {
      logger.error("Save character error", error);
    }
  };

  const handleCancel = () => {
    const hasChanges = formRef.current?.hasUnsavedChanges();

    if (hasChanges) {
      Alert.alert(
        "Discard changes?",
        "You have unsaved changes. Are you sure you want to discard them?",
        [
          {
            text: "Keep editing",
            style: "cancel",
          },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => router.back(),
          },
        ]
      );
    } else {
      router.back();
    }
  };

  return (
    <ImageBackground
      source={require("../assets/images/background-landscape.png")}
      resizeMode="cover"
      style={styles.container}
    >
      <LinearGradient
        colors={[Colors.backgroundGradientStart, Colors.backgroundGradientEnd]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={handleCancel}>
            <Text style={styles.headerButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{""}</Text>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => formRef.current?.handleSave()}
            disabled={loading}
          >
            <Text
              style={[styles.headerButtonText, loading && styles.disabledText]}
            >
              Save
            </Text>
          </TouchableOpacity>
        </View>

        <SavedCharacterForm
          ref={formRef}
          character={character as SavedCharacter}
          onSave={handleSave}
          onCancel={handleCancel}
          showCancelButton={false}
          loading={loading}
          showSaveToggle={params.fromWizard === "true"}
          defaultSaveToggle={!params.tempCharIndex}
        />
      </SafeAreaView>
      <Toast config={toastConfig} />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing.md,
    paddingTop: Platform.select({
      android: (StatusBar.currentHeight || 0) + Spacing.md,
      ios: Spacing.md,
    }),
  },
  headerButton: {
    padding: Spacing.sm,
    minWidth: 60,
  },
  headerButtonText: {
    fontSize: Typography.fontSize.medium,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.primary,
    textAlign: "center",
  },
  disabledText: {
    opacity: 0.5,
  },
  headerTitle: {
    flex: 1,
    fontSize: Typography.fontSize.h3,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary,
    textAlign: "center",
    fontFamily: Typography.fontFamily.primary,
  },
});
