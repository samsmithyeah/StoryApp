import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Colors, Spacing, Typography } from "../../constants/Theme";

export function HowItWorksSection() {
  return (
    <View style={styles.howItWorks}>
      <Text style={styles.howItWorksTitle}>How it works</Text>
      <View style={styles.steps}>
        <View style={styles.step}>
          <Text style={styles.stepNumber}>1</Text>
          <Text style={styles.stepText}>
            Share your referral code with friends
          </Text>
        </View>
        <View style={styles.step}>
          <Text style={styles.stepNumber}>2</Text>
          <Text style={styles.stepText}>They sign up using your code</Text>
        </View>
        <View style={styles.step}>
          <Text style={styles.stepNumber}>3</Text>
          <Text style={styles.stepText}>
            When they verify their email, you both get bonus credits!
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  howItWorks: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  howItWorksTitle: {
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary,
    marginBottom: Spacing.xl,
    fontFamily: Typography.fontFamily.primary,
  },
  steps: {
    gap: Spacing.lg,
  },
  step: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.cardSectionBackground,
    padding: Spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardSectionBorder,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    color: Colors.textDark,
    fontSize: Typography.fontSize.medium,
    fontWeight: Typography.fontWeight.bold,
    textAlign: "center",
    lineHeight: 32,
    marginRight: Spacing.lg,
  },
  stepText: {
    flex: 1,
    fontSize: Typography.fontSize.small,
    color: Colors.text,
    lineHeight: 20,
  },
});