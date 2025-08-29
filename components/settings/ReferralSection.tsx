import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { ReferralCodeCard } from "../referrals/ReferralCodeCard";
import { useReferrals } from "../../hooks/useReferrals";
import { Colors, Spacing, Typography } from "../../constants/Theme";

export const ReferralSection: React.FC = () => {
  const { totalReferred, creditsEarned } = useReferrals();

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Invite friends</Text>
      <Text style={styles.sectionDescription}>
        Share your referral code and earn credits when friends join
      </Text>

      <ReferralCodeCard compact={false} showStats={true} />

      {(totalReferred > 0 || creditsEarned > 0) && (
        <View style={styles.achievementContainer}>
          <Text style={styles.achievementText}>
            🎉 You've referred {totalReferred} friend
            {totalReferred !== 1 ? "s" : ""} and earned {creditsEarned} credits!
          </Text>
        </View>
      )}
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
  sectionDescription: {
    fontSize: Typography.fontSize.small,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  achievementContainer: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: 12,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    marginHorizontal: Spacing.screenPadding,
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  achievementText: {
    fontSize: Typography.fontSize.small,
    color: Colors.success,
    textAlign: "center",
    fontWeight: Typography.fontWeight.medium,
    lineHeight: 20,
  },
});
