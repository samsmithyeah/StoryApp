import { useRouter } from "expo-router";
import React from "react";
import { SafeAreaView, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StarsDecorations } from "../../../components/credits/StarsDecorations";
import { SupportSection } from "../../../components/settings/SupportSection";
import { BackgroundContainer } from "../../../components/shared/BackgroundContainer";
import { ScreenHeader } from "../../../components/ui/ScreenHeader";
import { Spacing } from "../../../constants/Theme";

export default function SupportSettingsScreen() {
  const router = useRouter();
  const _insets = useSafeAreaInsets();

  return (
    <BackgroundContainer showDecorations={false}>
      <StarsDecorations />

      <ScreenHeader title="Support & legal" />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          contentInsetAdjustmentBehavior="automatic"
        >
          <SupportSection onNavigate={(route) => router.push(route as any)} />
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
