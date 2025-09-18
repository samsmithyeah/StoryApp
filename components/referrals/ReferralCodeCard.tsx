import { Ionicons } from "@expo/vector-icons";
import Clipboard from "@react-native-clipboard/clipboard";
import React, { useState } from "react";
import { Share, StyleSheet, Text, View } from "react-native";
import Toast from "react-native-toast-message";
import { Colors, Shadows, Spacing, Typography } from "../../constants/Theme";
import { useReferrals } from "../../hooks/useReferrals";
import { Analytics } from "../../utils/analytics";
import { logger } from "../../utils/logger";
import { Button } from "../ui/Button";

interface ReferralCodeCardProps {
  showStats?: boolean;
  compact?: boolean;
}

export const ReferralCodeCard: React.FC<ReferralCodeCardProps> = ({
  showStats = true,
  compact = false,
}) => {
  const {
    referralCode,
    referralStats,
    generateShareText,
    generateShareURL,
    totalReferred,
    creditsEarned,
  } = useReferrals();

  const [copying, setCopying] = useState(false);

  const handleCopyCode = async () => {
    if (!referralCode) return;

    try {
      setCopying(true);
      Clipboard.setString(referralCode);

      // Track referral link copy
      Analytics.logReferralLinkShared({
        share_method: "copy",
      });

      Toast.show({
        type: "success",
        text1: "Copied!",
        text2: "Your referral code has been copied to clipboard.",
      });
    } catch (error) {
      logger.error("Error copying referral code", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to copy referral code.",
      });
    } finally {
      setCopying(false);
    }
  };

  const handleShare = async () => {
    if (!referralCode) return;

    try {
      const shareText = generateShareText();
      const shareURL = generateShareURL();

      // Always include URL in message for consistency across platforms
      const fullMessage = shareURL ? `${shareText}\n\n${shareURL}` : shareText;

      const content = {
        message: fullMessage,
      };

      const result = await Share.share(content);

      if (result.action === Share.sharedAction) {
        // Track referral link share
        Analytics.logReferralLinkShared({
          share_method: "native",
        });
        logger.debug("Referral code shared successfully");
      }
    } catch (error) {
      logger.error("Error sharing referral code", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to share referral code.",
      });
    }
  };

  if (!referralCode) {
    return (
      <View style={[styles.container, compact && styles.compactContainer]}>
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={24}
            color={Colors.error}
          />
          <Text style={styles.errorText}>Unable to load referral code</Text>
          <Text style={styles.errorSubtext}>Please try again later</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, compact && styles.compactContainer]}>
      {!compact && (
        <View style={styles.header}>
          <Ionicons name="gift-outline" size={24} color={Colors.primary} />
          <Text style={styles.title}>Your referral code</Text>
        </View>
      )}

      <View style={styles.codeContainer}>
        <View style={styles.codeBox}>
          <Text style={styles.codeText}>{referralCode}</Text>
        </View>

        <View style={styles.buttonRow}>
          <Button
            title={copying ? "Copied" : "Copy"}
            onPress={handleCopyCode}
            variant="secondary"
            size="small"
            loading={copying}
            disabled={copying}
            leftIcon={copying ? "checkmark" : "doc.on.clipboard"}
            style={styles.copyButton}
          />

          <Button
            title="Share"
            onPress={handleShare}
            variant="primary"
            size="small"
            leftIcon="square.and.arrow.up"
            style={styles.shareButton}
          />
        </View>
      </View>

      {showStats && referralStats && !compact && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalReferred}</Text>
            <Text style={styles.statLabel}>Friends referred</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{creditsEarned}</Text>
            <Text style={styles.statLabel}>Credits earned</Text>
          </View>
        </View>
      )}

      {!compact && (
        <Text style={styles.description}>
          Share your code with friends to earn 10 credits when they verify their
          email. They'll get 5 bonus credits too!
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 2,
    borderColor: Colors.cardBorder,
    borderRadius: 18,
    backgroundColor: Colors.cardBackground,
    overflow: "hidden",
    ...Shadows.glowIos,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  compactContainer: {
    margin: 0,
    padding: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text,
    marginLeft: Spacing.sm,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl,
  },
  errorText: {
    color: Colors.error,
    fontSize: Typography.fontSize.medium,
    marginLeft: Spacing.sm,
    textAlign: "center",
    flex: 1,
    fontWeight: Typography.fontWeight.medium,
  },
  errorSubtext: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.small,
    marginLeft: Spacing.sm,
    textAlign: "center",
    flex: 1,
    marginTop: Spacing.xs,
  },
  codeContainer: {
    marginBottom: Spacing.xl,
  },
  codeBox: {
    backgroundColor: Colors.cardSectionBackground,
    borderRadius: Spacing.sm,
    padding: Spacing.lg,
    alignItems: "center",
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardSectionBorder,
  },
  codeText: {
    fontSize: Typography.fontSize.h3,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    letterSpacing: Typography.letterSpacing.wide,
    fontFamily: Typography.fontFamily.secondary,
  },
  buttonRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  copyButton: {
    flex: 1,
  },
  shareButton: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: Colors.cardSectionBackground,
    borderRadius: Spacing.sm,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.cardSectionBorder,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.cardActionBorder,
    marginHorizontal: Spacing.lg,
  },
  statNumber: {
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
  },
  statLabel: {
    fontSize: Typography.fontSize.tiny,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: Typography.letterSpacing.wide,
  },
  description: {
    fontSize: Typography.fontSize.small,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
});
