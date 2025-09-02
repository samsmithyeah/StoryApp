import { useRouter } from "expo-router";
import React from "react";
import { SafeAreaView, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { StarsDecorations } from "../../../components/credits/StarsDecorations";
import { ChildrenSection } from "../../../components/settings/ChildrenSection";
import { BackgroundContainer } from "../../../components/shared/BackgroundContainer";
import { ScreenHeader } from "../../../components/ui/ScreenHeader";
import { Spacing } from "../../../constants/Theme";
import { useChildren } from "../../../hooks/useChildren";
import { Child } from "../../../types/child.types";

export default function ChildrenSettingsScreen() {
  const router = useRouter();
  const _insets = useSafeAreaInsets();
  const {
    children,
    loading: _loading,
    error,
    addChild: _addChild,
    updateChild: _updateChild,
    deleteChild,
    clearError,
  } = useChildren();

  const handleAddChild = () => {
    router.push("/child-profile");
  };

  const handleEditChild = (child: Child) => {
    router.push(`/child-profile?childId=${child.id}`);
  };

  const handleDeleteChild = async (childId: string) => {
    try {
      await deleteChild(childId);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to delete child profile",
        visibilityTime: 3000,
      });
    }
  };

  return (
    <BackgroundContainer showDecorations={false}>
      <StarsDecorations />

      <ScreenHeader title="Child profiles" />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          contentInsetAdjustmentBehavior="automatic"
        >
          <ChildrenSection
            children={children}
            error={error}
            onClearError={clearError}
            onAddChild={handleAddChild}
            onEditChild={handleEditChild}
            onDeleteChild={handleDeleteChild}
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
