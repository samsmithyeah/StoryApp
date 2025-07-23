import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Colors, Spacing, Typography } from "../../constants/Theme";
import { Child } from "../../types/child.types";
import { Button } from "../ui/Button";
import { DatePicker } from "../ui/DatePicker";
import { Input } from "../ui/Input";

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

interface ChildProfileFormProps {
  child?: Child;
  onSave: (child: Omit<Child, "id">) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  submitButtonText?: string;
  showCancelButton?: boolean;
  cancelButtonText?: string;
  cancelAsLink?: boolean;
  title?: string;
}

export const ChildProfileForm: React.FC<ChildProfileFormProps> = ({
  child,
  onSave,
  onCancel,
  loading = false,
  submitButtonText = "Save child",
  showCancelButton = false,
  cancelButtonText = "Cancel",
  cancelAsLink = false,
  title,
}) => {
  const [childName, setChildName] = useState(child?.childName || "");
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(
    child?.dateOfBirth
  );
  const [childPreferences, setChildPreferences] = useState(
    child?.childPreferences || ""
  );
  const [hairColor, setHairColor] = useState(child?.hairColor || "");
  const [eyeColor, setEyeColor] = useState(child?.eyeColor || "");
  const [skinColor, setSkinColor] = useState(child?.skinColor || "");
  const [hairStyle, setHairStyle] = useState(child?.hairStyle || "");
  const [appearanceDetails, setAppearanceDetails] = useState(
    child?.appearanceDetails || ""
  );
  const [errors, setErrors] = useState<{
    childName?: string;
    dateOfBirth?: string;
    childPreferences?: string;
  }>({});

  const isEditing = !!child;

  useEffect(() => {
    if (child) {
      setChildName(child.childName);
      setDateOfBirth(child.dateOfBirth);
      setChildPreferences(child.childPreferences || "");
      setHairColor(child.hairColor || "");
      setEyeColor(child.eyeColor || "");
      setSkinColor(child.skinColor || "");
      setHairStyle(child.hairStyle || "");
      setAppearanceDetails(child.appearanceDetails || "");
    }
  }, [child]);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!childName.trim()) {
      newErrors.childName = "Please enter the child's name";
    }

    // Date of birth validation - only if provided
    if (dateOfBirth) {
      const today = new Date();
      const age = today.getFullYear() - dateOfBirth.getFullYear();
      const monthDiff = today.getMonth() - dateOfBirth.getMonth();
      const dayDiff = today.getDate() - dateOfBirth.getDate();

      // Check if birthday hasn't occurred this year
      const actualAge =
        monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

      if (actualAge < 0 || actualAge > 18) {
        newErrors.dateOfBirth = "Child must be between 0 and 18 years old";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const childData: Omit<Child, "id"> = {
      childName: childName.trim(),
      ...(dateOfBirth && { dateOfBirth }),
      ...(childPreferences.trim() && {
        childPreferences: childPreferences.trim(),
      }),
      ...(hairColor.trim() && { hairColor: hairColor.trim() }),
      ...(eyeColor.trim() && { eyeColor: eyeColor.trim() }),
      ...(skinColor.trim() && { skinColor: skinColor.trim() }),
      ...(hairStyle.trim() && { hairStyle: hairStyle.trim() }),
      ...(appearanceDetails.trim() && {
        appearanceDetails: appearanceDetails.trim(),
      }),
    };

    try {
      await onSave(childData);
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to save child profile"
      );
    }
  };

  const handleChildNameChange = (text: string) => {
    setChildName(text);
    if (errors.childName) {
      setErrors((prev) => ({ ...prev, childName: undefined }));
    }
  };

  const handleDateOfBirthChange = (date: Date) => {
    setDateOfBirth(date);
    if (errors.dateOfBirth) {
      setErrors((prev) => ({ ...prev, dateOfBirth: undefined }));
    }
  };

  const handleChildPreferencesChange = (text: string) => {
    setChildPreferences(text);
    if (errors.childPreferences) {
      setErrors((prev) => ({ ...prev, childPreferences: undefined }));
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
            {title || (isEditing ? "Edit profile" : "Add new child")}
          </Text>
          <Text style={styles.subtitle}>
            {isEditing
              ? "Update your child's information"
              : "Tell us about your little one to create personalized stories"}
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.fieldContainer}>
            <Input
              label="Child's name"
              placeholder="Enter your child's name"
              value={childName}
              onChangeText={handleChildNameChange}
              leftIcon="person.fill"
              autoCapitalize="words"
              error={errors.childName}
            />
          </View>

          <View style={styles.fieldContainer}>
            <DatePicker
              label="Date of birth"
              placeholder="Select your child's date of birth"
              value={dateOfBirth}
              onChange={handleDateOfBirthChange}
              leftIcon="calendar"
              maximumDate={new Date()}
              minimumDate={new Date(new Date().getFullYear() - 18, 0, 1)}
              error={errors.dateOfBirth}
              optional
            />
          </View>

          <View style={styles.preferencesContainer}>
            <Input
              label="Interests & preferences"
              placeholder="What does your child love? (e.g., dinosaurs, princesses, space, animals)"
              value={childPreferences}
              onChangeText={handleChildPreferencesChange}
              leftIcon="heart.fill"
              style={styles.preferencesInput}
              error={errors.childPreferences}
              optional
            />
            <Text style={styles.preferencesHint}>
              This helps us create more personalized and engaging stories that
              your child will love!
            </Text>
          </View>

          <View style={styles.sectionDivider}>
            <Text style={styles.sectionTitle}>Appearance</Text>
            <Text style={styles.sectionSubtitle}>
              Help us create more accurate illustrations
            </Text>
          </View>

          <View style={styles.appearanceRow}>
            <View
              style={[
                styles.halfFieldContainer,
                !isTablet && styles.fullFieldContainer,
              ]}
            >
              <Input
                label="Hair color"
                placeholder="e.g., Brown, Black"
                value={hairColor}
                onChangeText={setHairColor}
                leftIcon="paintbrush.fill"
                optional
              />
            </View>
            {isTablet && (
              <View style={styles.halfFieldContainer}>
                <Input
                  label="Eye color"
                  placeholder="e.g., Blue, Brown"
                  value={eyeColor}
                  onChangeText={setEyeColor}
                  leftIcon="eye.fill"
                  optional
                />
              </View>
            )}
          </View>

          {!isTablet && (
            <View style={styles.fieldContainer}>
              <Input
                label="Eye color"
                placeholder="e.g., Blue, Brown"
                value={eyeColor}
                onChangeText={setEyeColor}
                leftIcon="eye.fill"
                optional
              />
            </View>
          )}

          <View style={styles.appearanceRow}>
            <View
              style={[
                styles.halfFieldContainer,
                !isTablet && styles.fullFieldContainer,
              ]}
            >
              <Input
                label="Skin color"
                placeholder="e.g., Fair, Olive"
                value={skinColor}
                onChangeText={setSkinColor}
                leftIcon="person.fill"
                optional
              />
            </View>
            {isTablet && (
              <View style={styles.halfFieldContainer}>
                <Input
                  label="Hair style"
                  placeholder="e.g., Curly, Short"
                  value={hairStyle}
                  onChangeText={setHairStyle}
                  leftIcon="scissors"
                  optional
                />
              </View>
            )}
          </View>

          {!isTablet && (
            <View style={styles.fieldContainer}>
              <Input
                label="Hair style"
                placeholder="e.g., Curly, Short"
                value={hairStyle}
                onChangeText={setHairStyle}
                leftIcon="scissors"
                optional
              />
            </View>
          )}

          <View style={styles.fieldContainer}>
            <Input
              label="Other appearance details"
              placeholder="Any other distinctive features (e.g., glasses, freckles)"
              value={appearanceDetails}
              onChangeText={setAppearanceDetails}
              leftIcon="sparkles"
              multiline
              numberOfLines={3}
              style={styles.textAreaInput}
              optional
            />
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            title={
              submitButtonText || (isEditing ? "Update profile" : "Add child")
            }
            onPress={handleSave}
            loading={loading}
            variant="primary"
            style={styles.fullWidthButton}
          />

          {showCancelButton &&
            (cancelAsLink ? (
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
            ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

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
    paddingVertical: Spacing.screenPadding,
    paddingBottom: 80,
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
  preferencesContainer: {
    marginBottom: Spacing.lg,
  },
  preferencesInput: {
    marginBottom: Spacing.sm,
  },
  preferencesHint: {
    fontSize: Typography.fontSize.tiny,
    color: Colors.primary,
    lineHeight: 16,
    marginLeft: Spacing.xs,
    opacity: 0.8,
  },
  sectionDivider: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.large,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    fontSize: Typography.fontSize.small,
    color: Colors.textSecondary,
  },
  appearanceRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  halfFieldContainer: {
    flex: 1,
  },
  fullFieldContainer: {
    flex: 1,
    marginRight: 0,
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
  saveButton: {
    flex: 2,
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
});
