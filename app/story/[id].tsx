import { doc, onSnapshot } from "@react-native-firebase/firestore";
import { LinearGradient } from "expo-linear-gradient";
import { router, usePathname } from "expo-router";
import { logger } from "../../utils/logger";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { StoryTitleScreen } from "../../components/story/StoryTitleScreen";
import { StoryViewer } from "../../components/story/StoryViewer";
import { Button } from "../../components/ui/Button";
import { IconSymbol } from "../../components/ui/IconSymbol";
import { Colors, Shadows, Spacing, Typography } from "../../constants/Theme";
import { db } from "../../services/firebase/config";
import { Story } from "../../types/story.types";

export default function StoryScreen() {
  const pathname = usePathname();
  // Extract ID from pathname like "/story/abc123"
  const id = pathname.split("/").pop() || "";
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTitleScreen, setShowTitleScreen] = useState(true);

  // Stable callback functions - must be defined before any early returns
  const handleStartReading = useCallback(() => {
    setShowTitleScreen(false);
  }, []);

  const handleGoBack = useCallback(() => {
    router.replace("/(tabs)");
  }, []);

  useEffect(() => {
    if (!id) {
      router.replace("/(tabs)");
      return;
    }

    setLoading(true); // Start loading when we set up the listener

    const storyDocRef = doc(db, "stories", id);
    const unsubscribe = onSnapshot(
      storyDocRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const docData = docSnapshot.data();

          // Build a complete, fresh story object directly from the snapshot
          const updatedStory: Story = {
            id: docSnapshot.id,
            ...docData,
            createdAt: docData?.createdAt?.toDate
              ? docData.createdAt.toDate()
              : new Date(),
            storyContent: Array.isArray(docData?.storyContent)
              ? docData.storyContent
              : [],
          } as Story;

          setStory(updatedStory); // Set the new state directly
          setLoading(false); // Stop loading once we have the first batch of data
        } else {
          logger.error("Story document not found in Firestore");
          setError("The story you are looking for could not be found.");
          setLoading(false);
        }
      },
      (snapshotError) => {
        logger.error("Error listening to story updates", snapshotError);
        setError("Failed to load real-time story updates.");
        setLoading(false);
      }
    );

    // Cleanup the real-time listener when the component unmounts
    return () => unsubscribe();
  }, [id]); // The dependency array should only contain `id`.

  // Show loading immediately if no ID to prevent error flash
  if (!id) {
    return (
      <ImageBackground
        source={require("../../assets/images/background-landscape.png")}
        resizeMode="cover"
        style={styles.container}
      >
        <LinearGradient
          colors={[
            Colors.backgroundGradientStart,
            Colors.backgroundGradientEnd,
          ]}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView style={styles.fullHeight}>
          <View style={styles.loadingContainer}>
            <View style={styles.loadingContent}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  if (loading) {
    return (
      <ImageBackground
        source={require("../../assets/images/background-landscape.png")}
        resizeMode="cover"
        style={styles.container}
      >
        <LinearGradient
          colors={[
            Colors.backgroundGradientStart,
            Colors.backgroundGradientEnd,
          ]}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView style={styles.fullHeight}>
          <View style={styles.loadingContainer}>
            <View style={styles.loadingContent}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading your story...</Text>
              <Text style={styles.loadingSubtext}>
                Preparing your magical adventure
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  if (error) {
    return (
      <ImageBackground
        source={require("../../assets/images/background-landscape.png")}
        resizeMode="cover"
        style={styles.container}
      >
        <LinearGradient
          colors={[
            Colors.backgroundGradientStart,
            Colors.backgroundGradientEnd,
          ]}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView style={styles.fullHeight}>
          <View style={styles.errorContainer}>
            <View style={styles.errorContent}>
              <IconSymbol
                name="exclamationmark.triangle"
                size={64}
                color={Colors.error}
              />
              <Text style={styles.errorTitle}>Oops!</Text>
              <Text style={styles.errorText}>{error}</Text>
              <Button
                title="Go back"
                onPress={() => router.back()}
                variant="outline"
                style={styles.errorButton}
              />
            </View>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  if (!story) {
    return (
      <ImageBackground
        source={require("../../assets/images/background-landscape.png")}
        resizeMode="cover"
        style={styles.container}
      >
        <LinearGradient
          colors={[
            Colors.backgroundGradientStart,
            Colors.backgroundGradientEnd,
          ]}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView style={styles.fullHeight}>
          <View style={styles.errorContainer}>
            <View style={styles.errorContent}>
              <IconSymbol
                name="book.closed"
                size={64}
                color={Colors.textSecondary}
              />
              <Text style={styles.errorTitle}>Story Not Found</Text>
              <Text style={styles.errorText}>
                The story you&apos;re looking for doesn&apos;t exist.
              </Text>
              <Button
                title="Go back"
                onPress={() => router.back()}
                variant="outline"
                style={styles.errorButton}
              />
            </View>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  if (showTitleScreen) {
    return (
      <StoryTitleScreen
        story={story}
        onStartReading={handleStartReading}
        onGoBack={handleGoBack}
      />
    );
  }

  return <StoryViewer story={story} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  fullHeight: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.screenPadding,
  },
  loadingContent: {
    alignItems: "center",
    backgroundColor: Colors.cardBackground,
    paddingVertical: Spacing.huge,
    paddingHorizontal: Spacing.screenPadding,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.primary,
    ...Shadows.glow,
  },
  loadingText: {
    fontSize: Typography.fontSize.large,
    color: Colors.text,
    marginTop: Spacing.lg,
    textAlign: "center",
    fontWeight: Typography.fontWeight.semibold,
  },
  loadingSubtext: {
    fontSize: Typography.fontSize.medium,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.screenPadding,
  },
  errorContent: {
    alignItems: "center",
    backgroundColor: Colors.cardBackground,
    paddingVertical: Spacing.huge,
    paddingHorizontal: Spacing.screenPadding,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.error,
    ...Shadows.error,
  },
  errorTitle: {
    fontSize: Typography.fontSize.h3,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  errorText: {
    fontSize: Typography.fontSize.medium,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: Spacing.xxxl,
  },
  errorButton: {
    paddingHorizontal: Spacing.xxxl,
  },
});
