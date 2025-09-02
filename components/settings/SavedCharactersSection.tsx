import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Colors, Spacing, Typography } from "../../constants/Theme";
import { Button } from "../ui/Button";
import { IconSymbol } from "../ui/IconSymbol";
import { ErrorContainer } from "./ErrorContainer";
import { SavedCharacterCard } from "./SavedCharacterCard";
import type { SavedCharactersSectionProps } from "./types";

export function SavedCharactersSection({
  savedCharacters,
  error,
  onClearError,
  onAddCharacter,
  onEditCharacter,
  onDeleteCharacter,
}: SavedCharactersSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionDescription}>
        Manage your story characters. You will be able to select these
        characters to feature in your stories.
      </Text>

      <ErrorContainer error={error} onClearError={onClearError} />

      {savedCharacters.length === 0 ? (
        <View style={styles.emptyState}>
          <IconSymbol name="person.2.circle" size={64} color="#D1D5DB" />
          <Text style={styles.emptyStateTitle}>No saved characters yet</Text>
          <Text style={styles.emptyStateText}>
            Create characters that can be reused across multiple stories
          </Text>
        </View>
      ) : (
        <View style={styles.childrenList}>
          {savedCharacters.map((character) => (
            <SavedCharacterCard
              key={character.id}
              character={character}
              onEdit={onEditCharacter}
              onDelete={onDeleteCharacter}
            />
          ))}
        </View>
      )}

      <Button
        title={
          savedCharacters.length === 0
            ? "Create a character"
            : "Create another character"
        }
        onPress={onAddCharacter}
        leftIcon="plus"
        variant="outline"
        style={styles.addButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.xxxl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary,
    marginBottom: Spacing.xs,
    fontFamily: Typography.fontFamily.primary,
  },
  sectionDescription: {
    fontSize: Typography.fontSize.medium,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing.huge,
    paddingHorizontal: Spacing.screenPadding,
  },
  emptyStateTitle: {
    fontSize: Typography.fontSize.large,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyStateText: {
    fontSize: Typography.fontSize.small,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  childrenList: {
    marginBottom: Spacing.lg,
  },
  addButton: {
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: "dashed",
  },
});
