import React, { useState } from "react";
import { Alert, SafeAreaView, ScrollView, StyleSheet } from "react-native";
import Toast from "react-native-toast-message";
import { BackgroundContainer } from "@/components/shared/BackgroundContainer";
import { StarsDecorations } from "@/components/credits/StarsDecorations";
import { AccountSection } from "@/components/settings/AccountSection";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Spacing } from "@/constants/Theme";
import { useAuth } from "@/hooks/useAuth";
import { logger } from "@/utils/logger";

export default function AccountSettingsScreen() {
  const { user, signOut, deleteAccount } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSignOut = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Sign out",
        style: "destructive",
        onPress: signOut,
      },
    ]);
  };

  const handleDeleteAccount = () => {
    if (isDeleting) return;

    Alert.alert(
      "Delete account",
      "This will permanently delete your account and all associated data including children profiles, saved characters, and stories. This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete account",
          style: "destructive",
          onPress: async () => {
            try {
              setIsDeleting(true);
              logger.debug("Starting account deletion");
              logger.debug("Current user before deletion", {
                userId: user?.uid,
              });

              await deleteAccount();

              logger.debug("Delete account completed", {
                currentUserId: user?.uid,
              });
              Toast.show({
                type: "success",
                text1: "Account deleted",
                text2: "Your account has been successfully deleted.",
                visibilityTime: 3000,
              });
            } catch (error) {
              logger.error("Delete account error", error);
              Alert.alert(
                "Error",
                "Failed to delete account. Please try again or contact support if the problem persists."
              );
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <BackgroundContainer showDecorations={false}>
      <StarsDecorations />

      <ScreenHeader title="Account" />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          contentInsetAdjustmentBehavior="automatic"
        >
          <AccountSection
            user={user}
            isDeleting={isDeleting}
            onSignOut={handleSignOut}
            onDeleteAccount={handleDeleteAccount}
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
