import { BorderRadius, Colors, Spacing, Typography } from "@/constants/Theme";
import React from "react";
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { CreditPackCardProps } from "./types";

const { width } = Dimensions.get("window");

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
    width: (width - Spacing.screenPadding * 2 - Spacing.md) / 2,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: BorderRadius.large,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    borderWidth: 2,
    borderColor: "transparent",
    minHeight: 160,
  },
  creditPackCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: "rgba(212, 175, 55, 0.15)",
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  cardTitle: {
    fontSize: Typography.fontSize.medium,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text,
    textAlign: "center",
    marginBottom: Spacing.sm,
    lineHeight: 22,
  },
  cardCredits: {
    fontSize: Typography.fontSize.small,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.sm,
    lineHeight: 18,
  },
  cardPrice: {
    fontSize: Typography.fontSize.large,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    textAlign: "center",
  },
  popularBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderTopRightRadius: BorderRadius.medium,
    borderBottomLeftRadius: BorderRadius.medium,
  },
  badgeText: {
    fontSize: Typography.fontSize.tiny,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textDark,
  },
});