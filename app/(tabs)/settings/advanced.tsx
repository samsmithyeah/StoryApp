import React from "react";
import { SafeAreaView, ScrollView, StyleSheet } from "react-native";
import { BackgroundContainer } from "@/components/shared/BackgroundContainer";
import { StarsDecorations } from "@/components/credits/StarsDecorations";
import { AdvancedSettingsSection } from "@/components/settings/AdvancedSettingsSection";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Spacing } from "@/constants/Theme";
import { useAuth } from "@/hooks/useAuth";
import { useUserPreferences } from "@/hooks/useUserPreferences";

export default function AdvancedSettingsScreen() {
  const { user } = useAuth();
  const { preferences, updatePreferences } = useUserPreferences();

  const isAdmin = user?.isAdmin === true;

  return (
    <BackgroundContainer showDecorations={false}>
      <StarsDecorations />

      <ScreenHeader title="Advanced settings" />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          contentInsetAdjustmentBehavior="automatic"
        >
          <AdvancedSettingsSection
            isAdmin={isAdmin}
            preferences={preferences}
            onUpdatePreferences={updatePreferences}
          />
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
