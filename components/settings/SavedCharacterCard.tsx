import React from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors, Shadows, Spacing, Typography } from "../../constants/Theme";
import { SavedCharacter } from "../../types/savedCharacter.types";
import { IconSymbol } from "../ui/IconSymbol";

interface SavedCharacterCardProps {
  character: SavedCharacter;
  onEdit: (character: SavedCharacter) => void;
  onDelete: (characterId: string) => void;
}

export const SavedCharacterCard: React.FC<SavedCharacterCardProps> = ({
  character,
  onEdit,
  onDelete,
}) => {
  const handleDelete = () => {
    Alert.alert(
      "Delete character",
      `Are you sure you want to delete ${character.name}? This action cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onDelete(character.id),
        },
      ]
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
            <Text style={styles.avatarText}>{getInitials(character.name)}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{character.name}</Text>
            {character.description && (
              <Text style={styles.description} numberOfLines={1}>
                {character.description}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onEdit(character)}
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

      {character.appearance && (
        <View style={styles.detail}>
          <Text style={styles.detailLabel}>Appearance:</Text>
          <Text style={styles.detailText}>{character.appearance}</Text>
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
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
    ...Platform.select({
      android: {
        ...Shadows.glow,
      },
      ios: {},
    }),
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
  description: {
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
  detail: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: Spacing.sm,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.2)",
  },
  detailLabel: {
    fontSize: Typography.fontSize.tiny,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary,
    textTransform: "uppercase",
    letterSpacing: Typography.letterSpacing.wide,
    marginBottom: Spacing.xs,
  },
  detailText: {
    fontSize: Typography.fontSize.small,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
