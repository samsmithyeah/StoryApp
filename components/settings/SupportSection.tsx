import React from "react";
import { StyleSheet, View } from "react-native";
import { Colors, Spacing, Typography } from "../../constants/Theme";
import { SettingsMenuItem } from "./SettingsMenuItem";
import type { SupportSectionProps } from "./types";

export function SupportSection({ onNavigate }: SupportSectionProps) {
  return (
    <View style={styles.section}>
      <SettingsMenuItem
        title="Privacy policy"
        subtitle="How we handle your data"
        icon="shield"
        onPress={() => onNavigate("/(tabs)/settings/privacy-policy")}
      />

      <SettingsMenuItem
        title="Terms of service"
        subtitle="Terms and conditions"
        icon="doc.text"
        onPress={() => onNavigate("/(tabs)/settings/terms-of-service")}
      />

      <SettingsMenuItem
        title="Help & support"
        subtitle="Get help or contact us"
        icon="questionmark.circle"
        onPress={() => onNavigate("/(tabs)/settings/help")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.xxxl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary,
    marginBottom: Spacing.xs,
    fontFamily: Typography.fontFamily.primary,
  },
});
