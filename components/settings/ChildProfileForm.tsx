import React, { useEffect, useState } from "react";
import {
  Alert,
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

interface ChildProfileFormProps {
  child?: Child;
  onSave: (child: Omit<Child, "id">) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  submitButtonText?: string;
  showCancelButton?: boolean;
  cancelButtonText?: string;
}

export const ChildProfileForm: React.FC<ChildProfileFormProps> = ({
  child,
  onSave,
  onCancel,
  loading = false,
  submitButtonText = "Save Child",
  showCancelButton = false,
  cancelButtonText = "Cancel",
}) => {
  const [childName, setChildName] = useState(child?.childName || "");
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(
    child?.dateOfBirth
  );
  const [childPreferences, setChildPreferences] = useState(
    child?.childPreferences || ""
  );

  const isEditing = !!child;

  useEffect(() => {
    if (child) {
      setChildName(child.childName);
      setDateOfBirth(child.dateOfBirth);
      setChildPreferences(child.childPreferences);
    }
  }, [child]);

  const validateForm = () => {
    if (!childName.trim()) {
      Alert.alert("Error", "Please enter the child's name");
      return false;
    }

    if (!dateOfBirth) {
      Alert.alert("Error", "Please select the child's date of birth");
      return false;
    }

    const today = new Date();
    const age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();
    const dayDiff = today.getDate() - dateOfBirth.getDate();

    // Check if birthday hasn't occurred this year
    const actualAge =
      monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

    if (actualAge < 0 || actualAge > 18) {
      Alert.alert("Error", "Child must be between 0 and 18 years old");
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const childData = {
      childName: childName.trim(),
      dateOfBirth: dateOfBirth!,
      childPreferences: childPreferences.trim(),
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
            {isEditing ? "Edit Profile" : "Add New Child"}
          </Text>
          <Text style={styles.subtitle}>
            {isEditing
              ? "Update your child's information"
              : "Tell us about your little one to create personalized stories"}
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Child's name"
            placeholder="Enter your child's name"
            value={childName}
            onChangeText={setChildName}
            leftIcon="person.fill"
            autoCapitalize="words"
          />

          <DatePicker
            label="Date of birth"
            placeholder="Select your child's date of birth"
            value={dateOfBirth}
            onChange={setDateOfBirth}
            leftIcon="calendar"
            maximumDate={new Date()}
            minimumDate={new Date(new Date().getFullYear() - 18, 0, 1)}
          />

          <View style={styles.preferencesContainer}>
            <Input
              label="Interests & preferences"
              placeholder="What does your child love? (e.g., dinosaurs, princesses, space, animals)"
              value={childPreferences}
              onChangeText={setChildPreferences}
              leftIcon="heart.fill"
              style={styles.preferencesInput}
            />
            <Text style={styles.preferencesHint}>
              This helps us create more personalized and engaging stories that
              your child will love!
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          {showCancelButton && (
            <Button
              title={cancelButtonText}
              onPress={onCancel}
              variant="outline"
              style={styles.cancelButton}
            />
          )}

          <Button
            title={
              submitButtonText || (isEditing ? "Update profile" : "Add child")
            }
            onPress={handleSave}
            loading={loading}
            variant="primary"
            style={
              showCancelButton ? styles.saveButton : styles.fullWidthButton
            }
          />
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
    paddingBottom: 40,
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
  actions: {
    flexDirection: "row",
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
});
