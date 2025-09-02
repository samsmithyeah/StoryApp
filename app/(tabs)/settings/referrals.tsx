import React from "react";
import { SafeAreaView, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StarsDecorations } from "../../../components/credits/StarsDecorations";
import { ReferralSection } from "../../../components/settings/ReferralSection";
import { BackgroundContainer } from "../../../components/shared/BackgroundContainer";
import { ScreenHeader } from "../../../components/ui/ScreenHeader";
import { Spacing } from "../../../constants/Theme";

export default function ReferralsSettingsScreen() {
  const _insets = useSafeAreaInsets();

  return (
    <BackgroundContainer showDecorations={false}>
      <StarsDecorations />

      <ScreenHeader title="Invite friends" />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          contentInsetAdjustmentBehavior="automatic"
        >
          <ReferralSection />
        </ScrollView>
      </SafeAreaView>
    </BackgroundContainer>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing.screenPadding,
  },
});
