import React from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import {
  Colors,
  CommonStyles,
  Spacing,
  Typography,
} from "../../constants/Theme";
import { BackButton } from "../ui/BackButton";
import type { SettingsHeaderProps } from "./types";

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

export function SettingsHeader({
  title = "Settings",
  subtitle = "Manage your family and app preferences",
  showBackButton = false,
}: SettingsHeaderProps) {
  return (
    <View style={styles.header}>
      {showBackButton && (
        <View style={styles.backButtonContainer}>
          <BackButton />
        </View>
      )}
      <View
        style={[styles.content, showBackButton && styles.contentWithBackButton]}
      >
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: Spacing.xxxl,
    alignItems: "center",
  },
  backButtonContainer: {
    position: "absolute",
    left: 0,
    top: 0,
    zIndex: 1,
  },
  content: {
    alignItems: "center",
  },
  contentWithBackButton: {
    paddingLeft: 40, // Make room for the back button
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
