import {
  BorderRadius,
  Colors,
  isVerySmallScreen,
  Spacing,
  Typography,
} from "@/constants/Theme";
import { BlurView } from "expo-blur";
import React from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { SubscriptionCardProps } from "./types";

const { width, height } = Dimensions.get("window");
const isCompactHeight = height < 720;
const isNarrowPhone = width < 380;
const sidePadding =
  (isVerySmallScreen() || isCompactHeight
    ? Spacing.lg
    : Spacing.screenPadding) * 2;
const interCardGap = isNarrowPhone ? Spacing.sm : Spacing.md;
const cardWidth = (width - sidePadding - interCardGap) / 2;
const cardPadding =
  isVerySmallScreen() || isCompactHeight ? Spacing.md : Spacing.lg;
const cardMarginBottom =
  isVerySmallScreen() || isCompactHeight ? Spacing.md : Spacing.lg;
const cardMinHeight = isVerySmallScreen() || isCompactHeight ? 132 : 160;

export function SubscriptionCard({
  package: pkg,
  isSelected,
  isActive,
  hasAnyActiveSubscription,
  onSelect,
  getProductInfo,
}: SubscriptionCardProps) {
  const info = getProductInfo(pkg.product.identifier);
  const isDisabled = hasAnyActiveSubscription && !isActive;
  const priceText =
    info.period === "month"
      ? `${pkg.product.priceString} / month`
      : `${pkg.product.priceString} / year`;

  return (
    <TouchableOpacity
      style={[
        styles.subscriptionCard,
        isActive && styles.subscriptionCardActive,
        isSelected && styles.subscriptionCardSelected,
        isDisabled && styles.subscriptionCardDisabled,
      ]}
      onPress={() => !hasAnyActiveSubscription && onSelect(pkg)}
      disabled={hasAnyActiveSubscription}
    >
      {info.popular && !isActive && !hasAnyActiveSubscription && (
        <View style={styles.popularBadge}>
          <Text style={styles.badgeText}>POPULAR</Text>
        </View>
      )}
      {info.bestValue && !isActive && !hasAnyActiveSubscription && (
        <View style={styles.bestValueBadge}>
          <Text style={styles.badgeText}>BEST VALUE</Text>
        </View>
      )}
      {isActive && (
        <View style={styles.currentBadge}>
          <Text style={styles.badgeText}>ACTIVE</Text>
        </View>
      )}

      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{info.displayName}</Text>
        <Text style={styles.cardCredits}>
          {info.credits} credits
          {info.period === "month" ? "\n/ month" : "\n/ year"}
        </Text>
        <Text style={styles.cardPrice}>{priceText}</Text>
      </View>

      {!isActive && hasAnyActiveSubscription && (
        <BlurView intensity={5} style={styles.blurOverlay} tint="light" />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  subscriptionCard: {
    width: cardWidth,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: BorderRadius.large,
    padding: cardPadding,
    marginBottom: cardMarginBottom,
    alignItems: "center",
    position: "relative",
    borderWidth: 2,
    borderColor: "transparent",
    minHeight: cardMinHeight,
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
  },
  cardTitle: {
    fontSize:
      isVerySmallScreen() || isCompactHeight
        ? Typography.fontSize.small
        : Typography.fontSize.medium,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text,
    textAlign: "center",
    marginBottom:
      isVerySmallScreen() || isCompactHeight ? Spacing.xs : Spacing.sm,
    lineHeight: isVerySmallScreen() || isCompactHeight ? 18 : 22,
  },
  cardCredits: {
    fontSize:
      isVerySmallScreen() || isCompactHeight
        ? Typography.fontSize.tiny
        : Typography.fontSize.small,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom:
      isVerySmallScreen() || isCompactHeight ? Spacing.xs : Spacing.sm,
    lineHeight: isVerySmallScreen() || isCompactHeight ? 16 : 18,
  },
  cardPrice: {
    fontSize:
      isVerySmallScreen() || isCompactHeight
        ? Typography.fontSize.medium
        : Typography.fontSize.large,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    textAlign: "center",
  },
  popularBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: Colors.primary,
    paddingHorizontal: isVerySmallScreen() ? Spacing.xs : Spacing.sm,
    paddingVertical: isVerySmallScreen() ? 2 : 4,
    borderTopRightRadius: BorderRadius.medium,
    borderBottomLeftRadius: BorderRadius.medium,
  },
  bestValueBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: Colors.primary,
    paddingHorizontal: isVerySmallScreen() ? Spacing.xs : Spacing.sm,
    paddingVertical: isVerySmallScreen() ? 2 : 4,
    borderTopRightRadius: BorderRadius.medium,
    borderBottomLeftRadius: BorderRadius.medium,
  },
  currentBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: Colors.success,
    paddingHorizontal: isVerySmallScreen() ? Spacing.xs : Spacing.sm,
    paddingVertical: isVerySmallScreen() ? 2 : 4,
    borderTopRightRadius: BorderRadius.medium,
    borderBottomLeftRadius: BorderRadius.medium,
  },
  badgeText: {
    fontSize: Typography.fontSize.tiny,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textDark,
  },
});
