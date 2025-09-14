import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Colors, Spacing, Typography } from "../../constants/Theme";
import { Button } from "../ui/Button";
import { IconSymbol } from "../ui/IconSymbol";
import { ChildProfileCard } from "./ChildProfileCard";
import { ErrorContainer } from "./ErrorContainer";
import type { ChildrenSectionProps } from "./types";

export function ChildrenSection({
  children,
  error,
  onClearError,
  onAddChild,
  onEditChild,
  onDeleteChild,
}: ChildrenSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionDescription}>
        We use this information to tailor the stories for each child, and to
        make the illustrations match their appearance if they feature in the
        stories!
      </Text>

      <ErrorContainer error={error} onClearError={onClearError} />

      {children.length === 0 ? (
        <View style={styles.emptyState}>
          <IconSymbol name="figure.child.circle" size={64} color="#D1D5DB" />
          <Text style={styles.emptyStateTitle}>No children added yet</Text>
          <Text style={styles.emptyStateText}>
            Add your first child to start creating magical personalized stories
          </Text>
        </View>
      ) : (
        <View style={styles.childrenList}>
          {children.map((child) => (
            <ChildProfileCard
              key={child.id}
              child={child}
              onEdit={onEditChild}
              onDelete={onDeleteChild}
            />
          ))}
        </View>
      )}

      <Button
        title={children.length === 0 ? "Add a child" : "Add another child"}
        onPress={onAddChild}
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
