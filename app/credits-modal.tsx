import { Colors, Spacing, Typography } from "@/constants/Theme";
import { useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import CreditsScreen from "./(tabs)/credits";

export default function CreditsModal() {
  const router = useRouter();

  const handleCancel = () => {
    console.log("Cancel button pressed");
    router.back();
  };

  const handlePurchaseSuccess = () => {
    console.log("Purchase successful, closing modal");
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* Cancel Button - Floating at top right */}
      <View style={styles.cancelButtonContainer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      {/* Credits Screen Content */}
      <CreditsScreen isModal={true} onPurchaseSuccess={handlePurchaseSuccess} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  cancelButtonContainer: {
    position: "absolute",
    top: Platform.select({
      android: (StatusBar.currentHeight || 0) + Spacing.md,
      ios: Spacing.xl,
    }),
    left: Spacing.screenPadding,
    zIndex: 1000,
  },
  cancelButton: {
    padding: Spacing.sm,
    minWidth: 60,
  },
  cancelButtonText: {
    fontSize: Typography.fontSize.medium,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.primary,
    textAlign: "center",
  },
});
