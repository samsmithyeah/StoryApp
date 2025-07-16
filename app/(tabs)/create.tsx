import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BackgroundContainer } from "../../components/shared/BackgroundContainer";
import { StoryWizard } from "../../components/wizard/StoryWizard";
import {
  Colors,
  CommonStyles,
  Spacing,
  Typography,
} from "../../constants/Theme";
import { useChildren } from "../../hooks/useChildren";
import { StoryConfiguration } from "../../types/story.types";

export default function CreateScreen() {
  const { children } = useChildren();
  const [showWizard, setShowWizard] = useState(false);

  const handleCreateStory = () => {
    if (children.length === 0) {
      Alert.alert(
        "No Children Added",
        "Please add at least one child profile in Settings before creating a story.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Go to Settings",
            onPress: () => router.push("/(tabs)/settings"),
          },
        ]
      );
      return;
    }
    setShowWizard(true);
  };

  const handleWizardComplete = async (wizardData: StoryConfiguration) => {
    setShowWizard(false);

    try {
      // If we have a storyId, the story was already generated
      if (wizardData.storyId) {
        // Navigate directly to the story viewer
        router.push({
          pathname: "/story/[id]",
          params: { id: wizardData.storyId },
        });
      }
    } catch (error) {
      console.error("Error navigating to story:", error);
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to load story. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  if (showWizard) {
    return (
      <StoryWizard
        onComplete={handleWizardComplete}
        onCancel={() => setShowWizard(false)}
      />
    );
  }

  return (
    <BackgroundContainer showDecorations={true}>
      <StatusBar style="light" />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <Text style={styles.title}>Create a story</Text>
            <Text style={styles.subtitle}>
              Create a personalised bedtime story for your child
            </Text>

            <TouchableOpacity
              style={styles.wizardButton}
              onPress={handleCreateStory}
              activeOpacity={0.85}
            >
              <Text style={styles.wizardButtonText}>Start</Text>
            </TouchableOpacity>

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
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    paddingTop: 60,
    maxWidth: 400,
    width: "100%",
  },

  // Header
  title: {
    ...CommonStyles.brandTitle,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    fontSize: Typography.fontSize.large,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.huge,
    lineHeight: 26,
  },

  // Wizard button
  wizardButton: {
    ...CommonStyles.primaryButton,
    paddingHorizontal: Spacing.huge,
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.huge,
  },
  wizardButtonText: {
    ...CommonStyles.buttonText,
    fontSize: Typography.fontSize.large,
  },

  // Features section
  features: {
    width: "100%",
    maxWidth: 300,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.lg,
  },
  bullet: {
    color: Colors.primary,
    fontSize: Typography.fontSize.small,
    marginRight: Spacing.md,
    marginTop: 2,
  },
  featureText: {
    fontSize: Typography.fontSize.medium,
    color: Colors.text,
    flex: 1,
    lineHeight: 22,
  },
});
