import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { IconSymbol } from "../ui/IconSymbol";
import { Colors, Spacing, Typography } from "../../constants/Theme";
import type { ErrorContainerProps } from "./types";

export function ErrorContainer({ error, onClearError }: ErrorContainerProps) {
  if (!error) return null;

  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity onPress={onClearError}>
        <IconSymbol name="xmark.circle" size={20} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    marginBottom: Spacing.screenPadding,
  },
  errorText: {
    flex: 1,
    fontSize: Typography.fontSize.small,
    color: Colors.error,
  },
});
