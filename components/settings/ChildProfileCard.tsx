import React from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Colors, Shadows, Spacing, Typography } from "../../constants/Theme";
import { Child } from "../../types/child.types";
import { IconSymbol } from "../ui/IconSymbol";

interface ChildProfileCardProps {
  child: Child;
  onEdit: (child: Child) => void;
  onDelete: (childId: string) => void;
}

export const ChildProfileCard: React.FC<ChildProfileCardProps> = ({
  child,
  onEdit,
  onDelete,
}) => {
  const handleDelete = () => {
    Alert.alert(
      "Delete profile",
      `Are you sure you want to delete ${child.childName}'s profile? This action cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onDelete(child.id),
        },
      ]
    );
  };

  const calculateAge = (dateOfBirth: Date) => {
    const today = new Date();
    const age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();

    // For month/year dates, we only check if the birth month has passed this year
    return monthDiff < 0 ? age - 1 : age;
  };

  const getAgeText = (dateOfBirth?: Date) => {
    if (!dateOfBirth) return "";
    const age = calculateAge(dateOfBirth);
    if (age === 1) return "1 year old";
    return `${age} years old`;
  };

  const getAppearanceDetails = () => {
    const details: string[] = [];
    if (child.hairColor) details.push(`${child.hairColor} hair`);
    if (child.eyeColor) details.push(`${child.eyeColor} eyes`);
    if (child.skinColor) details.push(`${child.skinColor} skin`);
    if (child.hairStyle) details.push(`${child.hairStyle} style`);
    if (child.appearanceDetails) details.push(child.appearanceDetails);
    return details.join(", ");
  };

  const hasAppearanceDetails = () => {
    return !!(
      child.hairColor ||
      child.eyeColor ||
      child.skinColor ||
      child.hairStyle ||
      child.appearanceDetails
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase())
      .join("")
      .substring(0, 2);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {getInitials(child.childName)}
            </Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{child.childName}</Text>
            {child.dateOfBirth && (
              <Text style={styles.age}>{getAgeText(child.dateOfBirth)}</Text>
            )}
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onEdit(child)}
          >
            <IconSymbol name="pencil" size={18} color={Colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDelete}
          >
            <IconSymbol name="trash" size={18} color={Colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      {child.childPreferences && (
        <View style={styles.preferences}>
          <Text style={styles.preferencesLabel}>Likes:</Text>
          <Text style={styles.preferencesText}>{child.childPreferences}</Text>
        </View>
      )}

      {hasAppearanceDetails() && (
        <View style={styles.appearance}>
          <Text style={styles.appearanceLabel}>Appearance:</Text>
          <Text style={styles.appearanceText}>{getAppearanceDetails()}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 2,
    borderColor: Colors.cardBorder,
    borderRadius: 18,
    backgroundColor: Colors.cardBackground,
    overflow: "hidden",
    ...Shadows.glow,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  avatarContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  avatarText: {
    fontSize: Typography.fontSize.large,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textDark,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: Typography.fontSize.large,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text,
    marginBottom: 2,
  },
  age: {
    fontSize: Typography.fontSize.small,
    color: Colors.textSecondary,
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
  },
  deleteButton: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  preferences: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: Spacing.sm,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.2)",
  },
  preferencesLabel: {
    fontSize: Typography.fontSize.tiny,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary,
    textTransform: "uppercase",
    letterSpacing: Typography.letterSpacing.wide,
    marginBottom: Spacing.xs,
  },
  preferencesText: {
    fontSize: Typography.fontSize.small,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  appearance: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: Spacing.sm,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.2)",
  },
  appearanceLabel: {
    fontSize: Typography.fontSize.tiny,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary,
    textTransform: "uppercase",
    letterSpacing: Typography.letterSpacing.wide,
    marginBottom: Spacing.xs,
  },
  appearanceText: {
    fontSize: Typography.fontSize.small,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
