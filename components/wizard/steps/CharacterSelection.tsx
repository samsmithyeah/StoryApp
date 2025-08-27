import { BorderRadius, Colors, Spacing, Typography } from "@/constants/Theme";
import { useSavedCharacters } from "@/hooks/useSavedCharacters";
import { useWizardStore } from "@/store/wizardStore";
import { Child } from "@/types/child.types";
import { SavedCharacter } from "@/types/savedCharacter.types";
import { StoryCharacter } from "@/types/story.types";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { OptionCard } from "../shared/OptionCard";
import { WizardContainer } from "../shared/WizardContainer";
import { WizardFooter } from "../shared/WizardFooter";
import { WizardStepHeader } from "../shared/WizardStepHeader";

interface CharacterSelectionProps {
  savedChildren: Child[];
  selectedChildren: string[];
  characters?: StoryCharacter[];
  onUpdate: (data: { characters: StoryCharacter[] }) => void;
  onNext: () => void;
  onBack: () => void;
  onCancel: () => void;
}

export const CharacterSelection: React.FC<CharacterSelectionProps> = ({
  savedChildren,
  selectedChildren,
  characters = [],
  onUpdate,
  onNext,
  onBack,
  onCancel,
}) => {
  const router = useRouter();
  const { savedCharacters } = useSavedCharacters();
  const {
    selectedCharacters,
    oneOffCharacters,
    mode,
    initializeCharacters,
    setMode,
    toggleChildCharacter,
    toggleSavedCharacter,
    toggleOneOffCharacter,
    getCharactersForStory,
    isChildSelected,
    isSavedCharacterSelected,
    isOneOffCharacterSelected,
  } = useWizardStore();

  // Track initialization state and dependencies efficiently
  const hasInitialized = useRef(false);
  const lastDepsRef = useRef<{
    charactersLength: number;
    selectedChildrenLength: number;
    savedChildrenLength: number;
    charactersHash: string;
    selectedChildrenHash: string;
    savedChildrenHash: string;
  } | null>(null);

  // Lightweight hash function for arrays
  const createHash = (arr: any[]) => {
    if (!arr) return "";
    return arr
      .map((item) =>
        typeof item === "object"
          ? `${item.id || item.childId || item.name || ""}:${Object.keys(item).length}`
          : String(item)
      )
      .join(",");
  };

  // Initialize wizard state when dependencies actually change
  useEffect(() => {
    const currentDeps = {
      charactersLength: characters?.length || 0,
      selectedChildrenLength: selectedChildren?.length || 0,
      savedChildrenLength: savedChildren?.length || 0,
      charactersHash: createHash(characters || []),
      selectedChildrenHash: createHash(selectedChildren || []),
      savedChildrenHash: createHash(savedChildren || []),
    };

    // Check if we need to initialize
    const shouldInitialize =
      !hasInitialized.current ||
      !lastDepsRef.current ||
      lastDepsRef.current.charactersLength !== currentDeps.charactersLength ||
      lastDepsRef.current.selectedChildrenLength !==
        currentDeps.selectedChildrenLength ||
      lastDepsRef.current.savedChildrenLength !==
        currentDeps.savedChildrenLength ||
      lastDepsRef.current.charactersHash !== currentDeps.charactersHash ||
      lastDepsRef.current.selectedChildrenHash !==
        currentDeps.selectedChildrenHash ||
      lastDepsRef.current.savedChildrenHash !== currentDeps.savedChildrenHash;

    if (shouldInitialize) {
      initializeCharacters(characters, selectedChildren, savedChildren);
      hasInitialized.current = true;
      lastDepsRef.current = currentDeps;
    }
  }, [characters, selectedChildren, savedChildren, initializeCharacters]);

  const handleToggleChild = (child: Child) => {
    toggleChildCharacter(child);
  };

  const handleToggleSavedCharacter = (savedChar: SavedCharacter) => {
    toggleSavedCharacter(savedChar);
  };

  const handleToggleOneOffCharacter = (charToToggle: StoryCharacter) => {
    toggleOneOffCharacter(charToToggle);
  };

  const handleEditOneOffCharacter = (
    character: StoryCharacter,
    index: number
  ) => {
    const [description, appearance] = character.description?.split("; ") || [
      "",
      "",
    ];
    router.push({
      pathname: "/saved-character-profile",
      params: {
        fromWizard: "true",
        tempCharIndex: index.toString(),
        name: character.name,
        description,
        appearance,
      },
    });
  };

  const handleEditSavedCharacter = (characterId: string) => {
    router.push(`/saved-character-profile?characterId=${characterId}`);
  };

  const handleAddNewCharacter = () => {
    router.push("/saved-character-profile?fromWizard=true");
  };

  const handleNext = () => {
    const charactersToSend = getCharactersForStory();
    onUpdate({ characters: charactersToSend });
    onNext();
  };

  const isNextDisabled = mode === "custom" && selectedCharacters.length === 0;

  const options = [
    {
      id: "surprise",
      title: "Surprise me!",
      description: "Let the AI create interesting characters for the story",
      icon: "sparkles",
    },
    {
      id: "custom",
      title: "I'll choose characters",
      description: "Select from saved children or create custom characters",
      icon: "person.fill",
    },
  ];

  return (
    <WizardContainer>
      <ScrollView style={styles.container}>
        <WizardStepHeader
          title="Who are the characters?"
          subtitle="Select from saved children or add custom characters"
          stepNumber={4}
          totalSteps={7}
          onBack={onBack}
          onCancel={onCancel}
        />
        <View style={styles.content}>
          <View style={styles.optionsContainer}>
            {options.map((option) => (
              <OptionCard
                key={option.id}
                option={option}
                isSelected={mode === option.id}
                onSelect={(optionId) =>
                  setMode(optionId as "surprise" | "custom")
                }
                style={styles.optionCardSpacing}
              />
            ))}
          </View>
          {mode === "custom" && (
            <>
              {savedChildren.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Your children</Text>
                  {savedChildren.map((child) => (
                    <TouchableOpacity
                      key={child.id}
                      style={[
                        styles.childOption,
                        isChildSelected(child.id) && styles.childOptionSelected,
                      ]}
                      onPress={() => handleToggleChild(child)}
                    >
                      <View style={styles.childInfo}>
                        <Text style={styles.childName}>{child.childName}</Text>
                      </View>
                      <Ionicons
                        name={
                          isChildSelected(child.id)
                            ? "checkmark-circle"
                            : "add-circle-outline"
                        }
                        size={24}
                        color={
                          isChildSelected(child.id)
                            ? Colors.primary
                            : Colors.textMuted
                        }
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Custom characters</Text>
                  <TouchableOpacity
                    onPress={handleAddNewCharacter}
                    style={styles.addSavedCharacterButton}
                  >
                    <Ionicons
                      name="add-circle-outline"
                      size={20}
                      color={Colors.primary}
                    />
                  </TouchableOpacity>
                </View>
                {oneOffCharacters.map((char, index) => {
                  const isSelected = isOneOffCharacterSelected(char);
                  return (
                    <TouchableOpacity
                      key={`one-off-${index}`}
                      style={[
                        styles.childOption,
                        isSelected && styles.childOptionSelected,
                      ]}
                      onPress={() => handleToggleOneOffCharacter(char)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.childInfo}>
                        <Text style={styles.childName}>{char.name}</Text>
                        {char.description && (
                          <Text
                            style={styles.characterDescription}
                            numberOfLines={1}
                          >
                            {char.description}
                          </Text>
                        )}
                      </View>
                      <View style={styles.characterActions}>
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            handleEditOneOffCharacter(char, index);
                          }}
                          style={styles.editIconButton}
                        >
                          <Ionicons
                            name="pencil"
                            size={16}
                            color={Colors.textMuted}
                          />
                        </TouchableOpacity>
                        <Ionicons
                          name={
                            isSelected
                              ? "checkmark-circle"
                              : "add-circle-outline"
                          }
                          size={24}
                          color={isSelected ? Colors.primary : Colors.textMuted}
                        />
                      </View>
                    </TouchableOpacity>
                  );
                })}
                {savedCharacters.map((savedChar) => (
                  <TouchableOpacity
                    key={savedChar.id}
                    style={[
                      styles.childOption,
                      isSavedCharacterSelected(savedChar) &&
                        styles.childOptionSelected,
                    ]}
                    onPress={() => handleToggleSavedCharacter(savedChar)}
                  >
                    <View style={styles.childInfo}>
                      <Text style={styles.childName}>{savedChar.name}</Text>
                      {savedChar.description && (
                        <Text
                          style={styles.characterDescription}
                          numberOfLines={1}
                        >
                          {savedChar.description}
                        </Text>
                      )}
                    </View>
                    <View style={styles.characterActions}>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          handleEditSavedCharacter(savedChar.id);
                        }}
                        style={styles.editIconButton}
                      >
                        <Ionicons
                          name="pencil"
                          size={16}
                          color={Colors.textMuted}
                        />
                      </TouchableOpacity>
                      <Ionicons
                        name={
                          isSavedCharacterSelected(savedChar)
                            ? "checkmark-circle"
                            : "add-circle-outline"
                        }
                        size={24}
                        color={
                          isSavedCharacterSelected(savedChar)
                            ? Colors.primary
                            : Colors.textMuted
                        }
                      />
                    </View>
                  </TouchableOpacity>
                ))}
                {savedCharacters.length === 0 &&
                  oneOffCharacters.length === 0 && (
                    <View style={styles.emptyStateContainer}>
                      <Text style={styles.emptyStateText}>
                        No custom characters yet. Create one to reuse across
                        stories!
                      </Text>
                    </View>
                  )}
              </View>
            </>
          )}
        </View>
      </ScrollView>
      <WizardFooter onNext={handleNext} nextDisabled={isNextDisabled} />
    </WizardContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.xl,
  },
  optionsContainer: {
    marginBottom: Spacing.screenPadding,
  },
  optionCardSpacing: {
    marginBottom: Spacing.md,
  },
  section: {
    marginBottom: Spacing.screenPadding,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.large,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  childOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.backgroundLight,
    borderRadius: BorderRadius.medium,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  childOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: "rgba(212, 175, 55, 0.1)",
  },
  childInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  childName: {
    fontSize: Typography.fontSize.medium,
    color: Colors.text,
    fontWeight: Typography.fontWeight.medium,
  },
  characterDescription: {
    fontSize: Typography.fontSize.small,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  characterActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  addSavedCharacterButton: {
    padding: Spacing.xs,
  },
  editIconButton: {
    padding: Spacing.xs,
  },
  emptyStateContainer: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.backgroundLight,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderStyle: "dashed",
  },
  emptyStateText: {
    fontSize: Typography.fontSize.small,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
});
