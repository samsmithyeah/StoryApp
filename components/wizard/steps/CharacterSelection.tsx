import { BorderRadius, Colors, Spacing, Typography } from "@/constants/Theme";
import { useSavedCharacters } from "@/hooks/useSavedCharacters";
import { Child } from "@/types/child.types";
import { SavedCharacter } from "@/types/savedCharacter.types";
import { StoryCharacter } from "@/types/story.types";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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
  const { savedCharacters, temporaryCharacter, clearTemporaryCharacter } =
    useSavedCharacters();

  // This function correctly sets up the initial state from props
  const initializeCharacters = () => {
    if (characters && characters.length > 0) {
      return characters;
    }

    const childCharacters = selectedChildren
      .map((childId) => {
        const child = savedChildren.find((c) => c.id === childId);
        if (child) {
          return {
            name: child.childName,
            isChild: true,
            childId: child.id,
          } as StoryCharacter;
        }
        return null;
      })
      .filter((char): char is StoryCharacter => char !== null);

    return childCharacters;
  };

  const initialCharacters = initializeCharacters();

  // State for all temporary characters created in this session
  const [oneOffCharacters, setOneOffCharacters] = useState<StoryCharacter[]>(
    initialCharacters.filter((c) => c.isOneOff)
  );

  // Single source of truth for what is currently selected
  const [selectedCharacters, setSelectedCharacters] =
    useState<StoryCharacter[]>(initialCharacters);

  const [mode, setMode] = useState<"surprise" | "custom">(
    initialCharacters.length > 0 ? "custom" : "surprise"
  );

  // Track which character IDs existed when Firebase first loaded
  // This way we can detect truly NEW characters added during this session
  const initialCharacterIds = useRef<Set<string> | null>(null);
  const hasFirebaseLoaded = useRef(false);
  const lastKnownIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    const currentIds = new Set(savedCharacters.map((c) => c.id));

    // Wait for Firebase to actually load - we know it has loaded when either:
    // 1. We have characters, OR
    // 2. We've seen the effect run at least twice (initial empty + Firebase response)
    if (!hasFirebaseLoaded.current) {
      if (savedCharacters.length > 0) {
        // Firebase has loaded with characters
        initialCharacterIds.current = new Set(savedCharacters.map((c) => c.id));
        lastKnownIds.current = currentIds;
        hasFirebaseLoaded.current = true;
      } else if (lastKnownIds.current.size === 0) {
        // First run with empty array - Firebase might still be loading
        lastKnownIds.current = currentIds;
      } else {
        // Second run with empty array - Firebase has loaded but user has no saved characters
        initialCharacterIds.current = new Set();
        lastKnownIds.current = currentIds;
        hasFirebaseLoaded.current = true;
      }
      return;
    }

    // Check if there are any truly NEW characters (not in initial Firebase load)
    const newCharacterIds = Array.from(currentIds).filter(
      (id) => !initialCharacterIds.current?.has(id)
    );

    if (newCharacterIds.length > 0) {
      // Find the actual character objects for the new IDs
      const newCharacters = savedCharacters.filter((char) =>
        newCharacterIds.includes(char.id)
      );
      const newestCharacter = newCharacters[0]; // They're sorted by creation date

      const newStoryCharacter: StoryCharacter = {
        name: newestCharacter.name,
        description: newestCharacter.description,
        isChild: false,
      };

      setSelectedCharacters((prev) => {
        const isAlreadySelected = prev.some(
          (char) => char.name === newStoryCharacter.name && !char.isChild
        );
        if (!isAlreadySelected) {
          setMode("custom");
          return [...prev, newStoryCharacter];
        }
        return prev;
      });

      // Update our tracking to include these new characters
      newCharacterIds.forEach((id) => initialCharacterIds.current?.add(id));
    }

    lastKnownIds.current = currentIds;
  }, [savedCharacters]);

  useEffect(() => {
    if (temporaryCharacter) {
      const { character, indexToUpdate, removeIndex } = temporaryCharacter;
      if (removeIndex !== undefined) {
        // Remove a temp character (when it's converted to saved)
        const charToRemove = oneOffCharacters[removeIndex];
        setOneOffCharacters((prev) =>
          prev.filter((_, index) => index !== removeIndex)
        );
        setSelectedCharacters((prev) => prev.filter((c) => c !== charToRemove));
      } else if (indexToUpdate !== undefined) {
        // This is an EDIT of an existing one-off character
        const oldChar = oneOffCharacters[indexToUpdate];
        setOneOffCharacters((prev) => {
          const updated = [...prev];
          updated[indexToUpdate] = character;
          return updated;
        });
        setSelectedCharacters((prev) =>
          prev.map((c) => (c === oldChar ? character : c))
        );
      } else {
        // This is a NEW one-off character
        setOneOffCharacters((prev) => [...prev, character]);
        setSelectedCharacters((prev) => [...prev, character]);
        setMode("custom");
      }
      clearTemporaryCharacter();
    }
  }, [temporaryCharacter, clearTemporaryCharacter, oneOffCharacters]);

  const handleToggleChild = (child: Child) => {
    setSelectedCharacters((prev) => {
      const isSelected = prev.some(
        (char) => char.isChild && char.childId === child.id
      );
      if (isSelected) {
        return prev.filter(
          (char) => !(char.isChild && char.childId === child.id)
        );
      } else {
        return [
          ...prev,
          { name: child.childName, isChild: true, childId: child.id },
        ];
      }
    });
  };

  const handleToggleSavedCharacter = (savedChar: SavedCharacter) => {
    setSelectedCharacters((prev) => {
      const isSelected = prev.some(
        (char) =>
          !char.isChild &&
          char.name === savedChar.name &&
          char.description === savedChar.description &&
          char.appearance === savedChar.appearance
      );
      if (isSelected) {
        return prev.filter(
          (char) =>
            !(
              !char.isChild &&
              char.name === savedChar.name &&
              char.description === savedChar.description &&
              char.appearance === savedChar.appearance
            )
        );
      } else {
        return [
          ...prev,
          {
            name: savedChar.name,
            description: savedChar.description,
            appearance: savedChar.appearance,
            isChild: false,
          },
        ];
      }
    });
  };

  const handleToggleOneOffCharacter = (charToToggle: StoryCharacter) => {
    setSelectedCharacters((prev) => {
      const isSelected = prev.some((char) => char === charToToggle);
      if (isSelected) {
        return prev.filter((char) => char !== charToToggle);
      } else {
        return [...prev, charToToggle];
      }
    });
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

  const isCharacterSelected = (charToFind: StoryCharacter) => {
    return selectedCharacters.some((char) => char === charToFind);
  };

  const isSavedCharacterSelected = (savedChar: SavedCharacter) => {
    return selectedCharacters.some(
      (char) =>
        !char.isChild &&
        !char.isOneOff &&
        char.name === savedChar.name &&
        char.description === savedChar.description &&
        char.appearance === savedChar.appearance
    );
  };

  const handleNext = () => {
    const charactersToSend = mode === "surprise" ? [] : selectedCharacters;
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

  const isChildSelected = (childId: string) => {
    return selectedCharacters.some(
      (char) => char.isChild && char.childId === childId
    );
  };

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
                  const isSelected = isCharacterSelected(char);
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
