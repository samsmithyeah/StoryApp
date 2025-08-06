import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Colors, Spacing, Typography } from "../../constants/Theme";
import { IconSymbol } from "./IconSymbol";

interface SettingsLinkItemProps {
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}

export const SettingsLinkItem: React.FC<SettingsLinkItemProps> = ({
  title,
  description,
  icon,
  onPress,
}) => {
  return (
    <TouchableOpacity style={styles.linkItem} onPress={onPress}>
      <View style={styles.linkContent}>
        <IconSymbol name={icon} size={24} color={Colors.primary} />
        <View style={styles.linkTextContainer}>
          <Text style={styles.linkTitle}>{title}</Text>
          <Text style={styles.linkDescription}>{description}</Text>
        </View>
      </View>
      <IconSymbol name="chevron.right" size={20} color={Colors.textSecondary} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  linkItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: Spacing.lg,
    borderRadius: 16,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.2)",
  },
  linkContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  linkTextContainer: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  linkTitle: {
    fontSize: Typography.fontSize.medium,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text,
    marginBottom: 2,
  },
  linkDescription: {
    fontSize: Typography.fontSize.small,
    color: Colors.textSecondary,
  },
});
