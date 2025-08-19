import React from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import {
  Colors,
  CommonStyles,
  Spacing,
  Typography,
} from "../../constants/Theme";
import type { SettingsHeaderProps } from "./types";

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

export function SettingsHeader(_props: SettingsHeaderProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>
        Manage your family and app preferences
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: Spacing.xxxl,
    alignItems: "center",
  },
  title: {
    ...CommonStyles.brandTitle,
    fontSize: isTablet
      ? Typography.fontSize.h1Tablet
      : Typography.fontSize.h1Phone,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    fontSize: Typography.fontSize.medium,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
});
