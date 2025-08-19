import {
  BorderRadius,
  Colors,
  Shadows,
  Spacing,
  Typography,
} from "@/constants/Theme";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { PurchaseButtonProps } from "./types";

export function PurchaseButton({
  selectedPackage,
  selectedTab,
  purchasing,
  activeSubscriptions,
  onPurchase,
  getProductInfo,
  insets,
}: PurchaseButtonProps) {
  return (
    <View
      style={[
        styles.bottomSection,
        {
          paddingBottom: insets.bottom + 37, // Account for tab bar
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.purchaseButton,
          !(purchasing || !selectedPackage) && styles.purchaseButtonEnabled,
          (purchasing || !selectedPackage) && styles.purchaseButtonDisabled,
        ]}
        onPress={() => {
          if (selectedPackage) {
            onPurchase(selectedPackage);
          }
        }}
        disabled={purchasing || !selectedPackage}
      >
        {purchasing ? (
          <ActivityIndicator size="small" color={Colors.textDark} />
        ) : selectedPackage ? (
          <>
            <Text style={styles.purchaseButtonText}>
              Purchase {getProductInfo(selectedPackage.product.identifier).name}
            </Text>
            <Text style={styles.purchaseButtonSubtext}>
              {selectedPackage.product.priceString}
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.purchaseButtonText}>
              {selectedTab === "subscriptions"
                ? activeSubscriptions.length > 0
                  ? "You have an active subscription"
                  : "Start subscription"
                : "Purchase credits"}
            </Text>
            <Text style={styles.purchaseButtonSubtext}>
              {selectedTab === "subscriptions"
                ? activeSubscriptions.length > 0
                  ? "Use credit packs for additional credits"
                  : "Choose your preferred plan above"
                : "Select your credit pack above"}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomSection: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(212, 175, 55, 0.2)",
  },
  purchaseButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.medium,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xxl,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
  },
  purchaseButtonEnabled: {
    ...Shadows.glow,
  },
  purchaseButtonDisabled: {
    opacity: 0.6,
  },
  purchaseButtonText: {
    fontSize: Typography.fontSize.medium,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textDark,
    textAlign: "center",
  },
  purchaseButtonSubtext: {
    fontSize: Typography.fontSize.small,
    color: Colors.textDark,
    textAlign: "center",
    marginTop: 2,
    opacity: 0.8,
  },
});
