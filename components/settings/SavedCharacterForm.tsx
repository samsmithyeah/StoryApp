import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { Colors, Spacing, Typography } from "../../constants/Theme";
import { SavedCharacter } from "../../types/savedCharacter.types";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

const { width } = Dimensions.get("window");
const _isTablet = width >= 768;

interface SavedCharacterFormProps {
  character?: SavedCharacter;
  onSave: (
    character: Omit<SavedCharacter, "id" | "createdAt" | "updatedAt">,
    shouldSave?: boolean
  ) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  submitButtonText?: string;
  showCancelButton?: boolean;
  cancelButtonText?: string;
  cancelAsLink?: boolean;
  title?: string;
  showSaveToggle?: boolean;
  defaultSaveToggle?: boolean;
}

export const SavedCharacterForm = forwardRef<
  {
    handleSave: () => void;
    hasUnsavedChanges: () => boolean;
  },
  SavedCharacterFormProps
>((props, ref) => {
  const {
    character,
    onSave,
    onCancel,
    loading = false,
    submitButtonText = "Save character",
    showCancelButton = false,
    cancelButtonText = "Cancel",
    cancelAsLink = false,
    title,
    showSaveToggle = false,
    defaultSaveToggle = true,
  } = props;

  const [name, setName] = useState(character?.name || "");
  const [description, setDescription] = useState(character?.description || "");
  const [appearance, setAppearance] = useState(character?.appearance || "");
  const [shouldSaveForReuse, setShouldSaveForReuse] =
    useState(defaultSaveToggle);
  const [errors, setErrors] = useState<{
    name?: string;
  }>({});

  const isEditing = !!character;

  // Track initial values for detecting changes
  const initialValues = useRef({
    name: character?.name || "",
    description: character?.description || "",
    appearance: character?.appearance || "",
  });

  const hasUnsavedChanges = () => {
    return (
      name.trim() !== initialValues.current.name ||
      description.trim() !== initialValues.current.description ||
      appearance.trim() !== initialValues.current.appearance
    );
  };

  useImperativeHandle(ref, () => ({
    handleSave,
    hasUnsavedChanges,
  }));

  useEffect(() => {
    if (character) {
      setName(character.name);
      setDescription(character.description || "");
      setAppearance(character.appearance || "");

      // Update initial values when character changes
      initialValues.current = {
        name: character.name,
        description: character.description || "",
        appearance: character.appearance || "",
      };
    } else {
      // Reset for new character
      initialValues.current = {
        name: "",
        description: "",
        appearance: "",
      };
    }
  }, [character]);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!name.trim()) {
      newErrors.name = "Please enter the character's name";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const characterData: Omit<
      SavedCharacter,
      "id" | "createdAt" | "updatedAt"
    > = {
      name: name.trim(),
      ...(description.trim() && { description: description.trim() }),
      ...(appearance.trim() && { appearance: appearance.trim() }),
    };

    try {
      await onSave(characterData, showSaveToggle ? shouldSaveForReuse : true);
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to save character"
      );
    }
  };

  const handleNameChange = (text: string) => {
    setName(text);
    if (errors.name) {
      setErrors((prev) => ({ ...prev, name: undefined }));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>
            {title || (isEditing ? "Edit character" : "Add a new character")}
          </Text>
          <Text style={styles.subtitle}>
            {isEditing
              ? "Update your character's information"
              : "Create a reusable character for your stories"}
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.fieldContainer}>
            <Input
              label="Character name"
              placeholder="Enter character name"
              value={name}
              onChangeText={handleNameChange}
              leftIcon="person.fill"
              autoCapitalize="words"
              error={errors.name}
            />
          </View>

          <View style={styles.fieldContainer}>
            <Input
              label="Description"
              placeholder="Brief description of the character"
              value={description}
              onChangeText={setDescription}
              leftIcon="text.bubble.fill"
              multiline
              numberOfLines={3}
              style={styles.textAreaInput}
              optional
            />
          </View>

          <View style={styles.fieldContainer}>
            <Input
              label="Appearance"
              placeholder="Physical description (e.g., red hair, green eyes, tall)"
              value={appearance}
              onChangeText={setAppearance}
              leftIcon="sparkles"
              multiline
              numberOfLines={3}
              style={styles.textAreaInput}
              optional
            />
          </View>

          {showSaveToggle && (
            <View style={styles.toggleContainer}>
              <View style={styles.toggleContent}>
                <View style={styles.toggleInfo}>
                  <Text style={styles.toggleLabel}>Save for future use</Text>
                  <Text style={styles.toggleDescription}>
                    Save this character to reuse in other stories
                  </Text>
                </View>
                <Switch
                  value={shouldSaveForReuse}
                  onValueChange={setShouldSaveForReuse}
                  trackColor={{
                    false: Colors.borderLight,
                    true: Colors.primaryLight,
                  }}
                  thumbColor={
                    shouldSaveForReuse ? Colors.primary : Colors.textMuted
                  }
                />
              </View>
            </View>
          )}
        </View>

        {showCancelButton && (
          <View style={styles.actions}>
            <Button
              title={
                submitButtonText ||
                (isEditing ? "Update character" : "Add character")
              }
              onPress={handleSave}
              loading={loading}
              variant="primary"
              style={styles.fullWidthButton}
            />

            {cancelAsLink ? (
              <Text style={styles.cancelLink} onPress={onCancel}>
                {cancelButtonText}
              </Text>
            ) : (
              <Button
                title={cancelButtonText}
                onPress={onCancel}
                variant="outline"
                style={styles.cancelButton}
              />
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
});

SavedCharacterForm.displayName = "SavedCharacterForm";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.screenPadding,
  },
  header: {
    marginBottom: Spacing.xxxl,
    alignItems: "center",
  },
  title: {
    fontSize: Typography.fontSize.h2,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    marginBottom: Spacing.sm,
    textAlign: "center",
    fontFamily: Typography.fontFamily.primary,
  },
  subtitle: {
    fontSize: Typography.fontSize.medium,
    color: Colors.textSecondary,
    lineHeight: 24,
    textAlign: "center",
  },
  form: {
    flex: 1,
    marginBottom: Spacing.xxxl,
  },
  fieldContainer: {
    marginBottom: Spacing.xxl,
  },
  textAreaInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  actions: {
    flexDirection: "column",
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
  },
  fullWidthButton: {
    flex: 1,
  },
  cancelLink: {
    fontSize: Typography.fontSize.small,
    color: Colors.primary,
    textAlign: "center",
    marginTop: Spacing.md,
    textDecorationLine: "underline",
    opacity: 0.8,
  },
  toggleContainer: {
    marginBottom: Spacing.xxl,
  },
  toggleContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.2)",
  },
  toggleInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  toggleLabel: {
    fontSize: Typography.fontSize.medium,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  toggleDescription: {
    fontSize: Typography.fontSize.small,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
