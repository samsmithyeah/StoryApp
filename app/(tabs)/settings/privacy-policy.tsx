import React from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import { StarsDecorations } from "@/components/credits/StarsDecorations";
import { PrivacyPolicyContent } from "@/components/legal/PrivacyPolicyContent";
import { BackgroundContainer } from "@/components/shared/BackgroundContainer";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Spacing } from "@/constants/Theme";

export default function PrivacyPolicyScreen() {
  return (
    <BackgroundContainer showDecorations={false}>
      <StarsDecorations />

      <ScreenHeader title="Privacy policy" />

      <SafeAreaView style={styles.safeArea}>
        <PrivacyPolicyContent />
      </SafeAreaView>
    </BackgroundContainer>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    marginTop: Spacing.lg,
  },
});
