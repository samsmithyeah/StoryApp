import React from "react";
import { StyleSheet, View } from "react-native";
import { Spacing } from "../../constants/Theme";
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
});
