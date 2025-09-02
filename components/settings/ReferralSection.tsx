import React from "react";
import { StyleSheet, View } from "react-native";
import { Colors, Spacing, Typography } from "../../constants/Theme";
import { HowItWorksSection } from "../referrals/HowItWorksSection";
import { ReferralCodeCard } from "../referrals/ReferralCodeCard";

export const ReferralSection: React.FC = () => {
  return (
    <View style={styles.section}>
      <ReferralCodeCard compact={false} showStats={true} />

      <HowItWorksSection />
    </View>
  );
};

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
