import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  Alert,
  Dimensions,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { StoryWizard } from "../../components/wizard/StoryWizard";
import {
  Colors,
  CommonStyles,
  Spacing,
  Typography,
} from "../../constants/Theme";
import { useChildren } from "../../hooks/useChildren";
import { StoryConfiguration } from "../../types/story.types";

const { width } = Dimensions.get("window");

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
    <ImageBackground
      source={require("../../assets/images/background-landscape.png")}
      resizeMode="cover"
      style={styles.container}
    >
      <LinearGradient
        colors={[Colors.backgroundGradientStart, Colors.backgroundGradientEnd]}
        style={StyleSheet.absoluteFill}
      />

      <Decorations />

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
    </ImageBackground>
  );
}

// Decorations component for background elements
function Decorations() {
  return (
    <>
      {/* Butterfly - top right */}
      <Image
        source={require("../../assets/images/butterfly.png")}
        style={styles.butterfly}
      />

      {/* Leaves - various positions */}
      <Image
        source={require("../../assets/images/leaves.png")}
        style={[styles.leaves, styles.leaves1]}
      />
      <Image
        source={require("../../assets/images/leaves.png")}
        style={[styles.leaves, styles.leaves2]}
      />

      {/* Stars */}
      {STAR_POSITIONS.map((pos, i) => (
        <Image
          key={`star-${i}`}
          source={require("../../assets/images/star.png")}
          style={[styles.star, pos]}
        />
      ))}
    </>
  );
}

const STAR_POSITIONS = [
  { top: 80, left: 40 },
  { top: 120, right: 60 },
  { top: 200, left: 100 },
  { top: 250, right: 40 },
  { bottom: 150, left: 60 },
  { bottom: 100, right: 80 },
];

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

  // Decorative elements
  butterfly: {
    position: "absolute",
    top: 60,
    right: 30,
    width: 100,
    height: 100,
    opacity: 0.8,
  },
  leaves: {
    position: "absolute",
    width: 100,
    height: 100,
    opacity: 0.3,
  },
  leaves1: {
    top: 100,
    left: -30,
  },
  leaves2: {
    bottom: 80,
    right: -20,
  },
  star: {
    position: "absolute",
    width: 10,
    height: 10,
    opacity: 0.6,
  },
});
