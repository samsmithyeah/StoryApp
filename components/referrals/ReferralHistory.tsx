import React from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useReferrals } from "../../hooks/useReferrals";
import type { ReferralRedemption } from "../../types/referral.types";
import {
  Colors,
  Spacing,
  Typography,
  BorderRadius,
} from "../../constants/Theme";

interface ReferralHistoryProps {
  maxItems?: number;
  showHeader?: boolean;
}

export const ReferralHistory: React.FC<ReferralHistoryProps> = ({
  maxItems,
  showHeader = true,
}) => {
  const { referralHistory } = useReferrals();

  const displayHistory = maxItems
    ? referralHistory.slice(0, maxItems)
    : referralHistory;

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusIcon = (status: ReferralRedemption["status"]) => {
    switch (status) {
      case "completed":
        return (
          <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
        );
      case "pending":
        return (
          <Ionicons name="time-outline" size={20} color={Colors.warning} />
        );
      case "cancelled":
        return <Ionicons name="close-circle" size={20} color={Colors.error} />;
    }
  };

  const getStatusText = (status: ReferralRedemption["status"]) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "pending":
        return "Pending verification";
      case "cancelled":
        return "Cancelled";
    }
  };

  const renderReferralItem = ({ item }: { item: ReferralRedemption }) => (
    <View style={styles.historyItem}>
      <View style={styles.historyHeader}>
        <View style={styles.statusContainer}>
          {getStatusIcon(item.status)}
          <Text style={[styles.statusText, getStatusStyle(item.status)]}>
            {getStatusText(item.status)}
          </Text>
        </View>
        <Text style={styles.dateText}>{formatDate(item.redeemedAt)}</Text>
      </View>

      <Text style={styles.referralCodeText}>Code: {item.referralCode}</Text>

      <View style={styles.creditsContainer}>
        <Text style={styles.creditsText}>
          +{item.referrerCreditsAwarded} credits earned
        </Text>
        {item.status === "completed" && item.completedAt && (
          <Text style={styles.completedText}>
            Completed {formatDate(item.completedAt)}
          </Text>
        )}
      </View>
    </View>
  );

  const getStatusStyle = (status: ReferralRedemption["status"]) => {
    switch (status) {
      case "completed":
        return styles.completedStatus;
      case "pending":
        return styles.pendingStatus;
      case "cancelled":
        return styles.cancelledStatus;
    }
  };

  if (displayHistory.length === 0) {
    return (
      <View style={styles.container}>
        {showHeader && (
          <View style={styles.header}>
            <Ionicons name="list-outline" size={24} color={Colors.primary} />
            <Text style={styles.title}>Referral history</Text>
          </View>
        )}
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No referrals yet</Text>
          <Text style={styles.emptyDescription}>
            Share your referral code with friends to start earning credits!
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showHeader && (
        <View style={styles.header}>
          <Ionicons name="list-outline" size={24} color="#374151" />
          <Text style={styles.title}>Referral History</Text>
          {referralHistory.length > (maxItems || 0) && maxItems && (
            <Text style={styles.showingText}>
              Showing {maxItems} of {referralHistory.length}
            </Text>
          )}
        </View>
      )}

      <FlatList
        data={displayHistory}
        keyExtractor={(item) => item.id}
        renderItem={renderReferralItem}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!maxItems} // Disable scroll if showing limited items
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.large,
    padding: Spacing.cardPadding,
    marginHorizontal: Spacing.screenPadding,
    marginVertical: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text,
    flex: 1,
    marginLeft: Spacing.sm,
  },
  showingText: {
    fontSize: Typography.fontSize.tiny,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: Spacing.massive,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyDescription: {
    fontSize: Typography.fontSize.small,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  historyItem: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: BorderRadius.medium,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusText: {
    marginLeft: Spacing.xs,
    fontSize: Typography.fontSize.small,
    fontWeight: Typography.fontWeight.medium,
  },
  completedStatus: {
    color: Colors.success,
  },
  pendingStatus: {
    color: Colors.warning,
  },
  cancelledStatus: {
    color: Colors.error,
  },
  dateText: {
    fontSize: Typography.fontSize.tiny,
    color: Colors.textSecondary,
  },
  referralCodeText: {
    fontSize: Typography.fontSize.tiny,
    color: Colors.textSecondary,
    fontFamily: Typography.fontFamily.secondary,
    marginBottom: Spacing.sm,
    letterSpacing: Typography.letterSpacing.wide,
  },
  creditsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  creditsText: {
    fontSize: Typography.fontSize.small,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary,
  },
  completedText: {
    fontSize: Typography.fontSize.tiny,
    color: Colors.success,
  },
});
