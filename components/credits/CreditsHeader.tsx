import { IconSymbol } from "@/components/ui/IconSymbol";
import { BorderRadius, Colors, CommonStyles, Spacing, Typography } from "@/constants/Theme";
import React from "react";
import { Animated, Dimensions, StyleSheet, Text, View } from "react-native";
import type { CreditsHeaderProps } from "./types";

const { width } = Dimensions.get("window");

export function CreditsHeader({ userCredits, scaleAnim, fadeAnim }: CreditsHeaderProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>Credits</Text>
      <View style={styles.headerBalance}>
        <Animated.View
          style={[
            {
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim,
            },
          ]}
        >
          <Animated.Text style={styles.headerBalanceAmount}>
            {userCredits?.balance || 0}
          </Animated.Text>
        </Animated.View>
        <IconSymbol name="sparkles" size={16} color={Colors.primary} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: Spacing.lg,
    alignItems: "center",
    position: "relative",
  },
  title: {
    ...CommonStyles.brandTitle,
    fontSize:
      width >= 768 ? Typography.fontSize.h1Tablet : Typography.fontSize.h1Phone,
    textAlign: "center",
  },
  headerBalance: {
    position: "absolute",
    top: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    borderRadius: BorderRadius.small,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
  },
  headerBalanceAmount: {
    fontSize: Typography.fontSize.medium,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    marginRight: Spacing.xs,
  },
});