import { IconSymbol } from "@/components/ui/IconSymbol";
import { BorderRadius, Colors, Spacing, Typography } from "@/constants/Theme";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { InfoSectionProps } from "./types";

export function InfoSection(_props: InfoSectionProps) {
  const handleReferralPress = () => {
    router.push("/invite-friends");
  };

  return (
    <View style={styles.infoContainer}>
      <IconSymbol name="info.circle" size={16} color={Colors.textSecondary} />
      <View style={styles.textContainer}>
        <Text style={styles.infoText}>
          Each credit enables you to generate 1 page of a story.
        </Text>
        <TouchableOpacity
          style={styles.referralLink}
          onPress={handleReferralPress}
        >
          <Text style={styles.referralText}>
            Refer a friend and get free credits
          </Text>
          <IconSymbol name="arrow.right" size={12} color={Colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  infoContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Colors.cardSectionBackground,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.medium,
    marginBottom: Spacing.sm,
  },
  textContainer: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  infoText: {
    fontSize: Typography.fontSize.small,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  referralLink: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  referralText: {
    fontSize: Typography.fontSize.small,
    color: Colors.primary,
    fontWeight: Typography.fontWeight.medium,
    textDecorationLine: "underline",
  },
});
