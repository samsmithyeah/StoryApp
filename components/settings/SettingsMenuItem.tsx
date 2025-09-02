import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  Colors,
  Spacing,
  Typography,
  Shadows,
  BorderRadius,
} from "../../constants/Theme";

export interface SettingsMenuItemProps {
  title: string;
  subtitle?: string;
  iconName: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  showChevron?: boolean;
}

export function SettingsMenuItem({
  title,
  subtitle,
  iconName,
  onPress,
  showChevron = true,
}: SettingsMenuItemProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.iconContainer}>
        <Ionicons name={iconName} size={24} color={Colors.primary} />
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      {showChevron && (
        <Ionicons
          name="chevron-forward"
          size={20}
          color={Colors.textSecondary}
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 80, // Fixed height for consistency
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderColor: Colors.cardBorder,
    marginBottom: Spacing.lg,
    ...Shadows.glow,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.cardActionBackground,
    borderWidth: 1,
    borderColor: Colors.cardActionBorder,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.lg,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: Typography.fontSize.large,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: Typography.fontSize.small,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
