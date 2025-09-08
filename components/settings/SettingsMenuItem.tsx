import { Ionicons } from "@expo/vector-icons";
import React, { ReactNode } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  BorderRadius,
  Colors,
  Shadows,
  Spacing,
  Typography,
} from "../../constants/Theme";
import { IconSymbol } from "../ui/IconSymbol";

export interface SettingsMenuItemProps {
  title: string;
  subtitle?: string;
  /** Ionicons name - used in main settings screen */
  iconName?: keyof typeof Ionicons.glyphMap;
  /** SF Symbol name - used in support section */
  icon?: string;
  onPress: () => void;
  showChevron?: boolean;
  rightContent?: ReactNode;
}

export function SettingsMenuItem({
  title,
  subtitle,
  iconName,
  icon,
  onPress,
  showChevron = true,
  rightContent,
}: SettingsMenuItemProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.iconContainer}>
        {iconName ? (
          // Use Ionicons for main settings screen
          <Ionicons name={iconName} size={24} color={Colors.primary} />
        ) : (
          // Use SF Symbols for support section and fallback
          <IconSymbol
            name={icon ?? "questionmark.circle"}
            size={24}
            color={Colors.primary}
          />
        )}
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      <View style={styles.rightSection}>
        {rightContent}
        {showChevron && (
          <>
            {iconName ? (
              <Ionicons
                name="chevron-forward"
                size={20}
                color={Colors.textSecondary}
              />
            ) : (
              <IconSymbol
                name="chevron.right"
                size={20}
                color={Colors.textSecondary}
              />
            )}
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 80,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardSectionBorder,
    marginBottom: Spacing.sm,
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
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
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
