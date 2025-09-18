import { BorderRadius, Colors, Spacing, Typography } from "@/constants/Theme";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { CreditPackCardProps } from "./types";
import { useResponsiveCardMetrics } from "./useResponsiveCardMetrics";

export function CreditPackCard({
  package: pkg,
  isSelected,
  onSelect,
  getProductInfo,
}: CreditPackCardProps) {
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
  const isCompactTypography = isVerySmallHeight || isCompactHeight;
  const badgeSpacingStyle = isCompactTypography
    ? styles.badgeSpacingCompact
    : styles.badgeSpacingRegular;

  return (
    <TouchableOpacity
      style={[
        styles.creditPackCard,
        {
          width: cardWidth,
          padding: cardPadding,
          marginBottom: cardMarginBottom,
          minHeight: cardMinHeight,
          marginHorizontal: cardHorizontalMargin,
        },
        isSelected && styles.creditPackCardSelected,
      ]}
      onPress={() => onSelect(pkg)}
    >
      {info.popular && (
        <View style={[styles.badge, styles.badgePrimary, badgeSpacingStyle]}>
          <Text style={styles.badgeText}>POPULAR</Text>
        </View>
      )}

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
      </Text>
      <Text
        style={[
          styles.cardPrice,
          isCompactTypography && styles.cardPriceCompact,
        ]}
      >
        {pkg.product.priceString}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  creditPackCard: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: BorderRadius.large,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    borderWidth: 2,
    borderColor: "transparent",
  },
  creditPackCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: "rgba(212, 175, 55, 0.15)",
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
