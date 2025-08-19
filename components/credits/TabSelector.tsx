import { BorderRadius, Colors, Spacing, Typography } from "@/constants/Theme";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { TabSelectorProps } from "./types";

export function TabSelector({ selectedTab, onTabChange }: TabSelectorProps) {
  return (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[
          styles.tab,
          selectedTab === "subscriptions" && styles.tabActive,
        ]}
        onPress={() => onTabChange("subscriptions")}
      >
        <Text
          style={[
            styles.tabText,
            selectedTab === "subscriptions" && styles.tabTextActive,
          ]}
        >
          Subscriptions
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, selectedTab === "packs" && styles.tabActive]}
        onPress={() => onTabChange("packs")}
      >
        <Text
          style={[
            styles.tabText,
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
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: "center",
    borderRadius: BorderRadius.round,
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: Typography.fontSize.medium,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  tabTextActive: {
    color: Colors.textDark,
    fontWeight: Typography.fontWeight.semibold,
  },
});
