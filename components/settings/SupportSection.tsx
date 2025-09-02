import React from "react";
import { StyleSheet, View } from "react-native";
import { Colors, Spacing, Typography } from "../../constants/Theme";
import { SettingsLinkItem } from "../ui/SettingsLinkItem";
import type { SupportSectionProps } from "./types";

export function SupportSection({ onNavigate }: SupportSectionProps) {
  return (
    <View style={styles.section}>
      <SettingsLinkItem
        title="Privacy policy"
        description="How we handle your data"
        icon="shield"
        onPress={() => onNavigate("/(tabs)/settings/privacy-policy")}
      />

      <SettingsLinkItem
        title="Terms of service"
        description="Terms and conditions"
        icon="doc.text"
        onPress={() => onNavigate("/(tabs)/settings/terms-of-service")}
      />

      <SettingsLinkItem
        title="Help & support"
        description="Get help or contact us"
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
