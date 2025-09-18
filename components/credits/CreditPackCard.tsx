import {
  BorderRadius,
  Colors,
  isVerySmallScreen,
  Spacing,
  Typography,
} from "@/constants/Theme";
import React from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { CreditPackCardProps } from "./types";

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

export function CreditPackCard({
  package: pkg,
  isSelected,
  onSelect,
  getProductInfo,
}: CreditPackCardProps) {
  const info = getProductInfo(pkg.product.identifier);

  return (
    <TouchableOpacity
      style={[
        styles.creditPackCard,
        isSelected && styles.creditPackCardSelected,
      ]}
      onPress={() => onSelect(pkg)}
    >
      {info.popular && (
        <View style={styles.popularBadge}>
          <Text style={styles.badgeText}>POPULAR</Text>
        </View>
      )}

      <Text style={styles.cardTitle}>{info.displayName}</Text>
      <Text style={styles.cardCredits}>{info.credits} credits</Text>
      <Text style={styles.cardPrice}>{pkg.product.priceString}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  creditPackCard: {
    width: cardWidth,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: BorderRadius.large,
    padding: cardPadding,
    marginBottom: cardMarginBottom,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    borderWidth: 2,
    borderColor: "transparent",
    minHeight: cardMinHeight,
  },
  creditPackCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: "rgba(212, 175, 55, 0.15)",
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
  badgeText: {
    fontSize: Typography.fontSize.tiny,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textDark,
  },
});
