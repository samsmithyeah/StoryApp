import { BorderRadius, Colors, Spacing, Typography } from "@/constants/Theme";
import { BlurView } from "expo-blur";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { SubscriptionCardProps } from "./types";
import { useResponsiveCardMetrics } from "./useResponsiveCardMetrics";

export function SubscriptionCard({
  package: pkg,
  isSelected,
  isActive,
  hasAnyActiveSubscription,
  onSelect,
  getProductInfo,
}: SubscriptionCardProps) {
  const {
    cardWidth,
    cardPadding,
    cardMarginBottom,
    cardMinHeight,
    isCompactHeight,
    isVerySmallHeight,
    cardHorizontalMargin,
  } = useResponsiveCardMetrics();

  const info = getProductInfo(pkg.product.identifier);
  const isDisabled = hasAnyActiveSubscription && !isActive;
  const priceText =
    info.period === "month"
      ? `${pkg.product.priceString} / month`
      : `${pkg.product.priceString} / year`;

  const isCompactTypography = isVerySmallHeight || isCompactHeight;
  const useCompactBadgeSpacing = isCompactTypography;
  const badgeSpacingStyle = useCompactBadgeSpacing
    ? styles.badgeSpacingCompact
    : styles.badgeSpacingRegular;

  return (
    <TouchableOpacity
      style={[
        styles.subscriptionCard,
        {
          width: cardWidth,
          padding: cardPadding,
          marginBottom: cardMarginBottom,
          minHeight: cardMinHeight,
          marginHorizontal: cardHorizontalMargin,
        },
        isActive && styles.subscriptionCardActive,
        isSelected && styles.subscriptionCardSelected,
        isDisabled && styles.subscriptionCardDisabled,
      ]}
      onPress={() => !hasAnyActiveSubscription && onSelect(pkg)}
      disabled={hasAnyActiveSubscription}
    >
      {info.popular && !isActive && !hasAnyActiveSubscription && (
        <View style={[styles.badge, styles.badgePrimary, badgeSpacingStyle]}>
          <Text style={styles.badgeText}>POPULAR</Text>
        </View>
      )}
      {info.bestValue && !isActive && !hasAnyActiveSubscription && (
        <View style={[styles.badge, styles.badgePrimary, badgeSpacingStyle]}>
          <Text style={styles.badgeText}>BEST VALUE</Text>
        </View>
      )}
      {isActive && (
        <View
          style={[
            styles.badge,
            styles.badgeSuccess,
            badgeSpacingStyle,
            styles.badgeCurrent,
          ]}
        >
          <Text style={styles.badgeText}>ACTIVE</Text>
        </View>
      )}

      <View style={styles.cardContent}>
        <Text
          style={[
            styles.cardTitle,
            isCompactTypography && styles.cardTitleCompact,
          ]}
        >
          {info.displayName}
        </Text>
        <Text
          style={[
            styles.cardCredits,
            isCompactTypography && styles.cardCreditsCompact,
          ]}
        >
          {info.credits} credits
          {info.period === "month" ? "\n/ month" : "\n/ year"}
        </Text>
        <Text
          style={[
            styles.cardPrice,
            isCompactTypography && styles.cardPriceCompact,
          ]}
        >
          {priceText}
        </Text>
      </View>

      {!isActive && hasAnyActiveSubscription && (
        <BlurView intensity={5} style={styles.blurOverlay} tint="light" />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  subscriptionCard: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: BorderRadius.large,
    alignItems: "center",
    position: "relative",
    borderWidth: 2,
    borderColor: "transparent",
  },
  subscriptionCardActive: {
    borderColor: Colors.success,
    backgroundColor: "rgba(34, 197, 94, 0.1)",
  },
  subscriptionCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: "rgba(212, 175, 55, 0.15)",
  },
  subscriptionCardDisabled: {
    opacity: 0.5,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  cardContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  blurOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: BorderRadius.large,
    zIndex: 1,
  },
  cardTitle: {
    fontSize: Typography.fontSize.medium,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text,
    textAlign: "center",
    marginBottom: Spacing.sm,
    lineHeight: 22,
  },
  cardTitleCompact: {
    fontSize: Typography.fontSize.small,
    marginBottom: Spacing.xs,
    lineHeight: 18,
  },
  cardCredits: {
    fontSize: Typography.fontSize.small,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.sm,
    lineHeight: 18,
  },
  cardCreditsCompact: {
    fontSize: Typography.fontSize.tiny,
    marginBottom: Spacing.xs,
    lineHeight: 16,
  },
  cardPrice: {
    fontSize: Typography.fontSize.large,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    textAlign: "center",
  },
  cardPriceCompact: {
    fontSize: Typography.fontSize.medium,
  },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    borderTopRightRadius: BorderRadius.medium,
    borderBottomLeftRadius: BorderRadius.medium,
    zIndex: 2,
    elevation: 3,
  },
  badgePrimary: {
    backgroundColor: Colors.primary,
  },
  badgeSuccess: {
    backgroundColor: Colors.success,
  },
  badgeCurrent: {
    zIndex: 3,
    elevation: 4,
  },
  badgeSpacingRegular: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  badgeSpacingCompact: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: Typography.fontSize.tiny,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textDark,
  },
});
