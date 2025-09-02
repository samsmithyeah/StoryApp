import React from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import { StarsDecorations } from "@/components/credits/StarsDecorations";
import { TermsOfServiceContent } from "@/components/legal/TermsOfServiceContent";
import { BackgroundContainer } from "@/components/shared/BackgroundContainer";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Spacing } from "@/constants/Theme";

export default function TermsOfServiceScreen() {
  return (
    <BackgroundContainer showDecorations={false}>
      <StarsDecorations />

      <ScreenHeader title="Terms of service" />

      <SafeAreaView style={styles.safeArea}>
        <TermsOfServiceContent />
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
