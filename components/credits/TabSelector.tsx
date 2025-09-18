import { BorderRadius, Colors, Spacing, Typography } from "@/constants/Theme";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import type { TabSelectorProps } from "./types";

export function TabSelector({ selectedTab, onTabChange }: TabSelectorProps) {
  const { width, height } = useWindowDimensions();
  const isCompact = width < 380 || height < 720;

  return (
    <View
      style={[styles.tabContainer, isCompact && styles.tabContainerCompact]}
    >
      <TouchableOpacity
        style={[
          styles.tab,
          isCompact && styles.tabCompact,
          selectedTab === "subscriptions" && styles.tabActive,
        ]}
        onPress={() => onTabChange("subscriptions")}
      >
        <Text
          style={[
            styles.tabText,
            isCompact && styles.tabTextCompact,
            selectedTab === "subscriptions" && styles.tabTextActive,
          ]}
        >
          Subscriptions
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.tab,
          isCompact && styles.tabCompact,
          selectedTab === "packs" && styles.tabActive,
        ]}
        onPress={() => onTabChange("packs")}
      >
        <Text
          style={[
            styles.tabText,
            isCompact && styles.tabTextCompact,
            selectedTab === "packs" && styles.tabTextActive,
          ]}
        >
          Credit packs
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: BorderRadius.round,
    padding: 4,
    marginBottom: Spacing.md,
  },
  tabContainerCompact: {
    padding: 3,
    marginBottom: Spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: "center",
    borderRadius: BorderRadius.round,
  },
  tabCompact: {
    paddingVertical: Spacing.sm,
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: Typography.fontSize.medium,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  tabTextCompact: {
    fontSize: Typography.fontSize.small,
  },
  tabTextActive: {
    color: Colors.textDark,
    fontWeight: Typography.fontWeight.semibold,
  },
});
