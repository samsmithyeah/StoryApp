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
  Text,
  View,
} from "react-native";
import { ContentLimits } from "../../constants/ContentLimits";
import { Colors, Spacing, Typography } from "../../constants/Theme";
import { Child } from "../../types/child.types";
import {
  filterContent,
  getFilterErrorMessage,
} from "../../utils/contentFilter";
import { Input } from "../ui/Input";
import { MonthYearPicker } from "../ui/MonthYearPicker";

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

interface ChildProfileFormProps {
  child?: Child;
  onSave: (child: Omit<Child, "id">) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  title?: string;
  contentBottomPadding?: number;
}

export const ChildProfileForm = forwardRef<
  {
    handleSave: () => void;
    hasUnsavedChanges: () => boolean;
    getChildName: () => string;
  },
  ChildProfileFormProps
>((props, ref) => {
  const { child, onSave, title, contentBottomPadding = 120 } = props;

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

  const initialValues = useRef({
    childName: child?.childName || "",
    dateOfBirth: child?.dateOfBirth,
    childPreferences: child?.childPreferences || "",
    hairColor: child?.hairColor || "",
    eyeColor: child?.eyeColor || "",
    skinColor: child?.skinColor || "",
    hairStyle: child?.hairStyle || "",
    appearanceDetails: child?.appearanceDetails || "",
  });

  const hasUnsavedChanges = () => {
    return (
      childName.trim() !== initialValues.current.childName ||
      dateOfBirth !== initialValues.current.dateOfBirth ||
      childPreferences.trim() !== initialValues.current.childPreferences ||
      hairColor.trim() !== initialValues.current.hairColor ||
      eyeColor.trim() !== initialValues.current.eyeColor ||
      skinColor.trim() !== initialValues.current.skinColor ||
      hairStyle.trim() !== initialValues.current.hairStyle ||
      appearanceDetails.trim() !== initialValues.current.appearanceDetails
    );
  };

  useImperativeHandle(ref, () => ({
    handleSave,
    hasUnsavedChanges,
    getChildName: () => childName.trim(),
  }));

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

      initialValues.current = {
        childName: child.childName,
        dateOfBirth: child.dateOfBirth,
        childPreferences: child.childPreferences || "",
        hairColor: child.hairColor || "",
        eyeColor: child.eyeColor || "",
        skinColor: child.skinColor || "",
        hairStyle: child.hairStyle || "",
        appearanceDetails: child.appearanceDetails || "",
      };
    } else {
      initialValues.current = {
        childName: "",
        dateOfBirth: undefined,
        childPreferences: "",
        hairColor: "",
        eyeColor: "",
        skinColor: "",
        hairStyle: "",
        appearanceDetails: "",
      };
    }
  }, [child]);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!childName.trim()) {
      newErrors.childName = "Please enter the child's name";
    } else {
      // Check for inappropriate content in name
      const nameFilter = filterContent(childName, true);
      if (!nameFilter.isAppropriate) {
        newErrors.childName = "Please use an appropriate name";
      }
    }

    if (dateOfBirth) {
      const today = new Date();
      const age = today.getFullYear() - dateOfBirth.getFullYear();
      const monthDiff = today.getMonth() - dateOfBirth.getMonth();
      const actualAge = monthDiff < 0 ? age - 1 : age;

      if (actualAge < 0 || actualAge > 18) {
        newErrors.dateOfBirth = "Child must be between 0 and 18 years old";
      }
    }

    // Check preferences for inappropriate content
    if (childPreferences.trim()) {
      const preferencesFilter = filterContent(childPreferences);
      if (!preferencesFilter.isAppropriate) {
        newErrors.childPreferences = getFilterErrorMessage(
          preferencesFilter.reason
        );
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: contentBottomPadding },
        ]}
        keyboardShouldPersistTaps="always"
        nestedScrollEnabled
      >
        <View style={styles.header}>
          <Text style={styles.title}>
            {title || (isEditing ? "Edit profile" : "Add a new child")}
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
              onChangeText={setChildName}
              leftIcon="person.fill"
              autoCapitalize="words"
              error={errors.childName}
              maxLength={ContentLimits.CHILD_NAME_MAX_LENGTH}
            />
          </View>

          <View style={styles.fieldContainer}>
            <MonthYearPicker
              label="Birth month & year"
              placeholder="Select your child's birth month and year"
              value={dateOfBirth}
              onChange={setDateOfBirth}
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
              onChangeText={setChildPreferences}
              leftIcon="heart.fill"
              style={styles.preferencesInput}
              error={errors.childPreferences}
              optional
              multiline
              numberOfLines={3}
              maxLength={ContentLimits.CHILD_PREFERENCES_MAX_LENGTH}
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
});

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
});

ChildProfileForm.displayName = "ChildProfileForm";
