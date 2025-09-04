import { doc, onSnapshot } from "@react-native-firebase/firestore";
import { httpsCallable } from "@react-native-firebase/functions";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { StoryTitleScreen } from "../../components/story/StoryTitleScreen";
import { StoryViewer } from "../../components/story/StoryViewer";
import { Button } from "../../components/ui/Button";
import { IconSymbol } from "../../components/ui/IconSymbol";
import { Colors, Shadows, Spacing, Typography } from "../../constants/Theme";
import { db, functionsService } from "../../services/firebase/config";
import { Story } from "../../types/story.types";
import { Analytics } from "../../utils/analytics";
import { logger } from "../../utils/logger";

export default function StoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTitleScreen, setShowTitleScreen] = useState(true);
  const hasTrackedStoryOpened = useRef(false);

  // Stable callback functions - must be defined before any early returns
  const handleStartReading = useCallback(() => {
    setShowTitleScreen(false);

    // Track reading session started
    if (story) {
      Analytics.logReadingSessionStarted({
        story_id: story.id,
        total_pages: story.storyContent.length,
      });
    }
  }, [story]);

  const handleGoBack = useCallback(() => {
    router.replace("/(tabs)");
  }, []);

  const handleRetryImageGeneration = useCallback(
    async (storyId: string, pageIndex: number) => {
      try {
        logger.info(
          `Retrying image generation for story ${storyId}, page ${pageIndex}`
        );

        const retryImageGenerationFn = httpsCallable(
          functionsService,
          "retryImageGeneration"
        );

        const payload = { storyId, pageIndex };
        logger.info("Calling retryImageGeneration with payload:", payload);

        const result = await retryImageGenerationFn(payload);
        const data = result.data as { success?: boolean; message?: string };

        if (data?.success) {
          logger.info(`Image generation retry initiated for story ${storyId}`);

          // Show success message
          Toast.show({
            type: "success",
            text1: "Retry started",
            text2: `Image generation restarted for page ${pageIndex + 1}. You'll see the image appear when it's ready.`,
            visibilityTime: 4000,
          });
        } else {
          throw new Error(data?.message || "Unknown error occurred");
        }
      } catch (error) {
        logger.error("Error retrying image generation", error);
        logger.info("Error structure for debugging:", {
          hasCode: error && typeof error === "object" && "code" in error,
          code:
            error && typeof error === "object" && "code" in error
              ? (error as any).code
              : undefined,
          message:
            error && typeof error === "object" && "message" in error
              ? (error as any).message
              : undefined,
        });

        // Parse error code for user-friendly display
        let errorMessage =
          "Failed to retry image generation. Please try again.";

        if (error && typeof error === "object" && "code" in error) {
          switch ((error as { code: string }).code) {
            case "permission-denied":
              errorMessage = "You don't have permission to retry this story.";
              break;
            case "not-found":
              errorMessage = "Story not found.";
              break;
            case "failed-precondition":
              errorMessage = "Cannot retry - images are not in a failed state.";
              break;
            case "unauthenticated":
              errorMessage = "Please sign in to retry image generation.";
              break;
            case "invalid-argument":
              errorMessage = "Invalid retry request. Please try again.";
              break;
            case "internal":
              errorMessage = "Server error occurred. Please try again later.";
              break;
          }
        }

        Toast.show({
          type: "error",
          text1: "Retry Failed",
          text2: errorMessage,
          visibilityTime: 4000,
        });

        // Re-throw so the UI can handle loading states
        throw error;
      }
    },
    []
  );

  useEffect(() => {
    if (!id || typeof id !== "string" || id.trim().length === 0) {
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

          // Track story opened (only on first load)
          if (!hasTrackedStoryOpened.current) {
            const storyAge =
              new Date().getTime() - updatedStory.createdAt.getTime();
            const storyAgeDays = Math.floor(storyAge / (1000 * 60 * 60 * 24));

            Analytics.logStoryOpened({
              story_id: updatedStory.id,
              story_length:
                updatedStory.storyContent.length > 8
                  ? "long"
                  : updatedStory.storyContent.length > 4
                    ? "medium"
                    : "short",
              has_illustrations: updatedStory.storyContent.some(
                (page) => page.imageUrl
              ),
              story_age_days: storyAgeDays,
            });
            hasTrackedStoryOpened.current = true;
          }
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

  return (
    <StoryViewer
      story={story}
      onRetryImageGeneration={handleRetryImageGeneration}
    />
  );
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
