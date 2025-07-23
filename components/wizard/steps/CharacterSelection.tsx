import { BorderRadius, Colors, Spacing, Typography } from "@/constants/Theme";
import { Child } from "@/types/child.types";
import { StoryCharacter } from "@/types/story.types";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { OptionCard } from "../shared/OptionCard";
import { WizardContainer } from "../shared/WizardContainer";
import { WizardFooter } from "../shared/WizardFooter";
import { WizardStepHeader } from "../shared/WizardStepHeader";

interface CharacterSelectionProps {
  savedChildren: Child[];
  characters?: StoryCharacter[];
  onUpdate: (data: { characters: StoryCharacter[] }) => void;
  onNext: () => void;
  onBack: () => void;
  onCancel: () => void;
}

export const CharacterSelection: React.FC<CharacterSelectionProps> = ({
  savedChildren,
  characters = [],
  onUpdate,
  onNext,
  onBack,
  onCancel,
}) => {
  const [mode, setMode] = useState<"surprise" | "custom">(
    characters.length > 0 ? "custom" : "surprise"
  );
  const [selectedCharacters, setSelectedCharacters] =
    useState<StoryCharacter[]>(characters);
  const [newCharacterName, setNewCharacterName] = useState("");
  const [newCharacterDescription, setNewCharacterDescription] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const handleToggleChild = (child: Child) => {
    const existingIndex = selectedCharacters.findIndex(
      (char) => char.isChild && char.childId === child.id
    );

    if (existingIndex >= 0) {
      setSelectedCharacters(
        selectedCharacters.filter((_, i) => i !== existingIndex)
      );
    } else {
      setSelectedCharacters([
        ...selectedCharacters,
        {
          name: child.childName,
          isChild: true,
          childId: child.id,
        },
      ]);
    }
  };

  const handleAddCustomCharacter = () => {
    if (newCharacterName.trim()) {
      setSelectedCharacters([
        ...selectedCharacters,
        {
          name: newCharacterName.trim(),
          description: newCharacterDescription.trim() || undefined,
          isChild: false,
        },
      ]);
      setNewCharacterName("");
      setNewCharacterDescription("");
      setShowAddForm(false);
    }
  };

  const handleRemoveCharacter = (index: number) => {
    setSelectedCharacters(selectedCharacters.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    onUpdate({ characters: mode === "surprise" ? [] : selectedCharacters });
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
                  <Text style={styles.sectionTitle}>Saved children</Text>
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
                <Text style={styles.sectionTitle}>Custom characters</Text>

                {selectedCharacters
                  .filter((char) => !char.isChild)
                  .map((character, index) => (
                    <View key={index} style={styles.characterItem}>
                      <View style={styles.characterInfo}>
                        <Text style={styles.characterName}>
                          {character.name}
                        </Text>
                        {character.description && (
                          <Text style={styles.characterDescription}>
                            {character.description}
                          </Text>
                        )}
                      </View>
                      <TouchableOpacity
                        onPress={() =>
                          handleRemoveCharacter(
                            selectedCharacters.findIndex((c) => c === character)
                          )
                        }
                      >
                        <Ionicons
                          name="close-circle"
                          size={24}
                          color={Colors.error}
                        />
                      </TouchableOpacity>
                    </View>
                  ))}

                {!showAddForm ? (
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setShowAddForm(true)}
                  >
                    <Ionicons
                      name="add-circle-outline"
                      size={24}
                      color={Colors.primary}
                    />
                    <Text style={styles.addButtonText}>
                      Add custom character
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.addForm}>
                    <TextInput
                      style={styles.input}
                      placeholder="Character name"
                      placeholderTextColor={Colors.textMuted}
                      value={newCharacterName}
                      onChangeText={setNewCharacterName}
                    />
                    <TextInput
                      style={[styles.input, styles.descriptionInput]}
                      placeholder="Description (optional)"
                      placeholderTextColor={Colors.textMuted}
                      value={newCharacterDescription}
                      onChangeText={setNewCharacterDescription}
                      multiline
                      numberOfLines={3}
                    />
                    <View style={styles.formButtons}>
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => {
                          setShowAddForm(false);
                          setNewCharacterName("");
                          setNewCharacterDescription("");
                        }}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.saveButton,
                          !newCharacterName.trim() && styles.saveButtonDisabled,
                        ]}
                        onPress={handleAddCustomCharacter}
                        disabled={!newCharacterName.trim()}
                      >
                        <Text style={styles.saveButtonText}>Add</Text>
                      </TouchableOpacity>
                    </View>
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
    paddingBottom: 100,
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
  },
  childName: {
    fontSize: Typography.fontSize.medium,
    color: Colors.text,
    fontWeight: Typography.fontWeight.medium,
  },
  characterItem: {
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
  characterInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  characterName: {
    fontSize: Typography.fontSize.medium,
    color: Colors.text,
    fontWeight: Typography.fontWeight.medium,
  },
  characterDescription: {
    fontSize: Typography.fontSize.small,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.backgroundLight,
    borderRadius: BorderRadius.medium,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: "dashed",
  },
  addButtonText: {
    fontSize: Typography.fontSize.medium,
    color: Colors.primary,
    marginLeft: Spacing.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  addForm: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: BorderRadius.medium,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: Spacing.sm,
    padding: Spacing.md,
    fontSize: Typography.fontSize.medium,
    color: Colors.text,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  descriptionInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  formButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Spacing.md,
  },
  cancelButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm + 2,
  },
  cancelButtonText: {
    fontSize: Typography.fontSize.medium,
    color: Colors.textMuted,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Spacing.sm,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.textMuted,
  },
  saveButtonText: {
    fontSize: Typography.fontSize.medium,
    color: Colors.textDark,
    fontWeight: Typography.fontWeight.semibold,
  },
});
