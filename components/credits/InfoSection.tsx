import { IconSymbol } from "@/components/ui/IconSymbol";
import { BorderRadius, Colors, Spacing, Typography } from "@/constants/Theme";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { InfoSectionProps } from "./types";

export function InfoSection({}: InfoSectionProps) {
  return (
    <View style={styles.infoContainer}>
      <IconSymbol
        name="info.circle"
        size={16}
        color={Colors.textSecondary}
      />
      <Text style={styles.infoText}>
        Each credit enables you to generate 1 page of a story.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  infoContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.medium,
    marginBottom: Spacing.xl,
  },
  infoText: {
    fontSize: Typography.fontSize.small,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
    lineHeight: 18,
  },
});