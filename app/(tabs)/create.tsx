import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  StatusBar as RNStatusBar,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackgroundContainer } from "../../components/shared/BackgroundContainer";
import { Button } from "../../components/ui/Button";
import { CreditIndicator } from "../../components/ui/CreditIndicator";
import { InsufficientCreditsModal } from "../../components/ui/InsufficientCreditsModal";
import {
  Colors,
  CommonStyles,
  isVerySmallScreen,
  Spacing,
  Typography,
} from "../../constants/Theme";
import { useChildren } from "../../hooks/useChildren";
import { useCredits } from "../../hooks/useCredits";

export default function CreateScreen() {
  const {
    children,
    loading: childrenLoading,
    error: childrenError,
    refreshChildren,
  } = useChildren();
  const { balance, loading: creditsLoading } = useCredits();
  const insets = useSafeAreaInsets();
  const [showInsufficientCreditsModal, setShowInsufficientCreditsModal] =
    useState(false);

  const handleCreateStory = () => {
    // If children are still loading, inform the user rather than assuming none exist
    if (childrenLoading) {
      Alert.alert(
        "Loading child profiles",
        "We’re still fetching your child profiles. Please try again in a moment."
      );
      return;
    }

    // If there was an error loading children (e.g., bad connectivity), show an accurate message
    if (childrenError) {
      Alert.alert(
        "Unable to load children",
        "We couldn’t load your child profiles. Please check your internet connection and try again.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Retry", onPress: () => refreshChildren() },
          {
            text: "Add child profile",
            onPress: () => router.push("/child-profile"),
          },
        ]
      );
      return;
    }

    if (children.length === 0) {
      Alert.alert(
        "No children added",
        "Please add at least one child profile before creating a story.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Add child profile",
            onPress: () => router.push("/child-profile"),
          },
        ]
      );
      return;
    }

    // Check if user has enough credits (minimum 1 for a story)
    if (balance < 1) {
      setShowInsufficientCreditsModal(true);
      return;
    }

    router.push("/wizard" as any);
  };

  return (
    <BackgroundContainer showDecorations={true}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={[styles.scrollView, { marginTop: -insets.top }]}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop:
                insets.top +
                (isVerySmallScreen() ? 40 : 60) +
                (Platform.select({
                  android: RNStatusBar.currentHeight || 0,
                  ios: 0,
                }) || 0),
            },
          ]}
          contentInsetAdjustmentBehavior="never"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.headerSection}>
              <CreditIndicator />
            </View>

            <Text style={styles.title}>Create a story</Text>
            <Text style={styles.subtitle}>
              Create a personalised story for your children
            </Text>

            <Button
              title="Start"
              onPress={handleCreateStory}
              variant="primary"
              size={isVerySmallScreen() ? "medium" : "large"}
              disabled={creditsLoading}
              style={{
                paddingHorizontal: isVerySmallScreen() ? 32 : 48,
                paddingVertical: isVerySmallScreen() ? 12 : 16,
                borderRadius: 25,
                marginBottom: isVerySmallScreen() ? 24 : 48,
              }}
            />

            <View style={styles.features}>
              <View style={styles.featureItem}>
                <Text style={styles.bullet}>●</Text>
                <Text style={styles.featureText}>
                  Feature your children in the story
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.bullet}>●</Text>
                <Text style={styles.featureText}>
                  Choose the theme and characters
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.bullet}>●</Text>
                <Text style={styles.featureText}>
                  Customise the length and illustrations
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.bullet}>●</Text>
                <Text style={styles.featureText}>AI-powered creativity</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Insufficient Credits Modal */}
      <InsufficientCreditsModal
        visible={showInsufficientCreditsModal}
        onClose={() => setShowInsufficientCreditsModal(false)}
        currentBalance={balance}
        message="You need credits to create stories. Each credit creates one page. Would you like to purchase credits or choose from our subscription plans?"
        showAlternativeAction={false}
      />
    </BackgroundContainer>
  );
}

// Dimensions handled by centralized responsive utilities

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: isVerySmallScreen() ? Spacing.md : Spacing.screenPadding,
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    maxWidth: 400,
    width: "100%",
  },
  headerSection: {
    marginBottom: isVerySmallScreen() ? Spacing.xl : Spacing.xxxl,
  },

  // Header
  title: {
    ...CommonStyles.brandTitle,
    fontSize: isVerySmallScreen()
      ? Typography.fontSize.h2
      : Typography.fontSize.h1,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    fontSize: isVerySmallScreen()
      ? Typography.fontSize.medium
      : Typography.fontSize.large,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: isVerySmallScreen() ? Spacing.xl : Spacing.huge,
    lineHeight: isVerySmallScreen() ? 22 : 26,
  },

  // Features section
  features: {
    width: "100%",
    maxWidth: 300,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: isVerySmallScreen() ? Spacing.md : Spacing.lg,
  },
  bullet: {
    color: Colors.primary,
    fontSize: Typography.fontSize.small,
    marginRight: Spacing.md,
    marginTop: 2,
  },
  featureText: {
    fontSize: isVerySmallScreen()
      ? Typography.fontSize.small
      : Typography.fontSize.medium,
    color: Colors.text,
    flex: 1,
    lineHeight: isVerySmallScreen() ? 20 : 22,
  },
});
