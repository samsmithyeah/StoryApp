import { useRouter } from "expo-router";
import React, { useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackgroundContainer } from "../../../components/shared/BackgroundContainer";
import { StarsDecorations } from "../../../components/credits/StarsDecorations";
import { WelcomeOnboarding } from "../../../components/onboarding/WelcomeOnboarding";
import { DebugSection } from "../../../components/settings/DebugSection";
import { ScreenHeader } from "../../../components/ui/ScreenHeader";
import { Spacing } from "../../../constants/Theme";
import { useAuth } from "../../../hooks/useAuth";

export default function DebugSettingsScreen() {
  const router = useRouter();
  const _insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [showWelcomeWizard, setShowWelcomeWizard] = useState(false);

  const isAdmin = user?.isAdmin === true;

  const handleShowWelcomeWizard = () => {
    setShowWelcomeWizard(true);
  };

  const handleWelcomeWizardComplete = () => {
    setShowWelcomeWizard(false);
  };

  return (
    <BackgroundContainer showDecorations={false}>
      <StarsDecorations />

      <ScreenHeader title="Debug" />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          contentInsetAdjustmentBehavior="automatic"
        >
          <DebugSection
            isAdmin={isAdmin}
            onShowWelcomeWizard={handleShowWelcomeWizard}
            onNavigate={(route) => router.push(route as any)}
          />
        </ScrollView>
      </SafeAreaView>

      <WelcomeOnboarding
        visible={showWelcomeWizard}
        onComplete={handleWelcomeWizardComplete}
      />
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
