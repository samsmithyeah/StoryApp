import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SettingsLinkItem } from "../ui/SettingsLinkItem";
import { Colors, Spacing, Typography } from "../../constants/Theme";
import type { SupportSectionProps } from "./types";

export function SupportSection({ onNavigate }: SupportSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Support & Legal</Text>
      <Text style={styles.sectionDescription}>
        Access help resources and legal information
      </Text>

      <SettingsLinkItem
        title="Privacy policy"
        description="How we handle your data"
        icon="shield"
        onPress={() => onNavigate("/privacy-policy")}
      />

      <SettingsLinkItem
        title="Terms of service"
        description="Terms and conditions"
        icon="doc.text"
        onPress={() => onNavigate("/terms-of-service")}
      />

      <SettingsLinkItem
        title="Help & support"
        description="Get help or contact us"
        icon="questionmark.circle"
        onPress={() => onNavigate("/help")}
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
  sectionDescription: {
    fontSize: Typography.fontSize.small,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
});
