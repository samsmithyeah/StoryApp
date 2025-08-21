import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ImageBackground,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
} from "react-native";
import Toast from "react-native-toast-message";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StarsDecorations } from "../../components/credits/StarsDecorations";
import { WelcomeOnboarding } from "../../components/onboarding/WelcomeOnboarding";
import { AccountSection } from "../../components/settings/AccountSection";
import { AdvancedSettingsSection } from "../../components/settings/AdvancedSettingsSection";
import { ChildrenSection } from "../../components/settings/ChildrenSection";
import { DebugSection } from "../../components/settings/DebugSection";
import { SavedCharactersSection } from "../../components/settings/SavedCharactersSection";
import { SettingsHeader } from "../../components/settings/SettingsHeader";
import { SupportSection } from "../../components/settings/SupportSection";
import { Colors, Spacing } from "../../constants/Theme";
import { useAuth } from "../../hooks/useAuth";
import { useChildren } from "../../hooks/useChildren";
import { useSavedCharacters } from "../../hooks/useSavedCharacters";
import { useUserPreferences } from "../../hooks/useUserPreferences";
import { Child } from "../../types/child.types";
import { SavedCharacter } from "../../types/savedCharacter.types";

export default function SettingsScreen() {
  const router = useRouter();
  const { user, signOut, deleteAccount } = useAuth();
  const insets = useSafeAreaInsets();
  const {
    children,
    loading: _loading,
    error,
    addChild: _addChild,
    updateChild: _updateChild,
    deleteChild,
    clearError,
  } = useChildren();
  const {
    savedCharacters,
    loading: _savedCharsLoading,
    error: savedCharsError,
    deleteSavedCharacter,
    clearError: clearSavedCharsError,
  } = useSavedCharacters();
  const { preferences, updatePreferences } = useUserPreferences();

  const [showWelcomeWizard, setShowWelcomeWizard] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Only show advanced settings for admin users
  const isAdmin = user?.isAdmin === true;

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

  const handleAddSavedCharacter = () => {
    router.push("/saved-character-profile");
  };

  const handleEditSavedCharacter = (character: SavedCharacter) => {
    router.push(`/saved-character-profile?characterId=${character.id}`);
  };

  const handleDeleteSavedCharacter = async (characterId: string) => {
    try {
      await deleteSavedCharacter(characterId);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to delete saved character",
        visibilityTime: 3000,
      });
    }
  };

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
    if (isDeleting) return; // Prevent multiple attempts

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
              console.log("Starting account deletion...");
              console.log("Current user before deletion:", user?.uid);

              await deleteAccount();

              console.log("Delete account completed, current user:", user?.uid);
              Alert.alert(
                "Account deleted",
                "Your account has been successfully deleted."
              );
              // The auth state listener in (tabs)/_layout.tsx will handle navigation
            } catch (error) {
              console.error("Delete account error:", error);
              Alert.alert(
                "Error",
                "Failed to delete account. Please try again or contact support if the problem persists."
              );
              setIsDeleting(false); // Only reset loading state on error
            }
          },
        },
      ]
    );
  };

  const handleShowWelcomeWizard = () => {
    setShowWelcomeWizard(true);
  };

  const handleWelcomeWizardComplete = () => {
    setShowWelcomeWizard(false);
  };

  return (
    <ImageBackground
      source={require("../../assets/images/background-landscape.png")}
      resizeMode="cover"
      style={styles.container}
    >
      <LinearGradient
        colors={[Colors.backgroundGradientStart, Colors.backgroundGradientEnd]}
        style={StyleSheet.absoluteFill}
      />

      <StarsDecorations />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={[styles.scrollView, { marginTop: -insets.top }]}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop:
                insets.top +
                Spacing.screenPadding +
                (Platform.select({
                  android: StatusBar.currentHeight || 0,
                  ios: 0,
                }) || 0),
            },
          ]}
          contentInsetAdjustmentBehavior="never"
        >
          <SettingsHeader />

          <ChildrenSection
            children={children}
            error={error}
            onClearError={clearError}
            onAddChild={handleAddChild}
            onEditChild={handleEditChild}
            onDeleteChild={handleDeleteChild}
          />

          <SavedCharactersSection
            savedCharacters={savedCharacters}
            error={savedCharsError}
            onClearError={clearSavedCharsError}
            onAddCharacter={handleAddSavedCharacter}
            onEditCharacter={handleEditSavedCharacter}
            onDeleteCharacter={handleDeleteSavedCharacter}
          />

          <AdvancedSettingsSection
            isAdmin={isAdmin}
            preferences={preferences}
            onUpdatePreferences={updatePreferences}
          />

          <SupportSection onNavigate={(route) => router.push(route as any)} />

          <DebugSection
            isAdmin={isAdmin}
            onShowWelcomeWizard={handleShowWelcomeWizard}
            onNavigate={(route) => router.push(route as any)}
          />

          <AccountSection
            user={user}
            isDeleting={isDeleting}
            onSignOut={handleSignOut}
            onDeleteAccount={handleDeleteAccount}
          />
        </ScrollView>
      </SafeAreaView>

      <WelcomeOnboarding
        visible={showWelcomeWizard}
        onComplete={handleWelcomeWizardComplete}
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
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
