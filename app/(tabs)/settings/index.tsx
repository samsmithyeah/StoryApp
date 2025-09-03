import { useRouter } from "expo-router";
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StarsDecorations } from "@/components/credits/StarsDecorations";
import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { SettingsMenuItem } from "@/components/settings/SettingsMenuItem";
import { BackgroundContainer } from "@/components/shared/BackgroundContainer";
import { Spacing } from "@/constants/Theme";
import { useAuth } from "@/hooks/useAuth";
import { Analytics } from "@/utils/analytics";
import React, { useEffect } from "react";

export default function SettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    Analytics.logSettingsScreenViewed({
      screen_name: "settings_main",
      entry_point: "tab_navigation",
    });
  }, []);

  // Only show advanced settings for admin users
  const isAdmin = user?.isAdmin === true;

  const handleNavigation = (menuItem: string, destination: string) => {
    Analytics.logSettingsMenuNavigation({
      menu_item: menuItem,
      destination: destination,
    });

    // Handle specific routes
    switch (destination) {
      case "children":
        router.push("/(tabs)/settings/children");
        break;
      case "characters":
        router.push("/(tabs)/settings/characters");
        break;
      case "referrals":
        router.push("/(tabs)/settings/referrals");
        break;
      case "advanced":
        router.push("/(tabs)/settings/advanced");
        break;
      case "support":
        router.push("/(tabs)/settings/support");
        break;
      case "debug":
        router.push("/(tabs)/settings/debug");
        break;
      case "account":
        router.push("/(tabs)/settings/account");
        break;
      default:
        console.warn(`Unknown destination: ${destination}`);
    }
  };

  return (
    <BackgroundContainer showDecorations={false}>
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

          <SettingsMenuItem
            title="Child profiles"
            subtitle="Manage your child profiles"
            iconName="people-outline"
            onPress={() => handleNavigation("child_profiles", "children")}
          />

          <SettingsMenuItem
            title="Saved characters"
            subtitle="Manage your story characters"
            iconName="bookmark-outline"
            onPress={() => handleNavigation("saved_characters", "characters")}
          />

          <SettingsMenuItem
            title="Invite friends"
            subtitle="Share your referral code and earn free credits"
            iconName="gift-outline"
            onPress={() => handleNavigation("invite_friends", "referrals")}
          />

          {isAdmin && (
            <SettingsMenuItem
              title="Advanced settings"
              subtitle="Developer and admin options"
              iconName="settings-outline"
              onPress={() => handleNavigation("advanced_settings", "advanced")}
            />
          )}

          <SettingsMenuItem
            title="Support & legal"
            subtitle="Help, privacy, and terms"
            iconName="help-circle-outline"
            onPress={() => handleNavigation("support_legal", "support")}
          />

          {isAdmin && (
            <SettingsMenuItem
              title="Debug"
              subtitle="Development and testing tools"
              iconName="bug-outline"
              onPress={() => handleNavigation("debug", "debug")}
            />
          )}

          <SettingsMenuItem
            title="Account"
            subtitle="Manage your account"
            iconName="person-outline"
            onPress={() => handleNavigation("account", "account")}
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
    paddingBottom: Spacing.screenPadding + Spacing.xl,
  },
});
