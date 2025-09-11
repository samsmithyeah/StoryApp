import { BackgroundContainer } from "@/components/shared/BackgroundContainer";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/Button";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { BorderRadius, Colors, Spacing, Typography } from "@/constants/Theme";
import { Story } from "@/types/story.types";
import { Analytics } from "@/utils/analytics";
import { useRouter } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface GenerationStepProps {
  isGenerating: boolean;
  error?: string | null;
  storyData?: Story | null;
  onNavigateToStory?: () => void;
  onStartOver?: () => void;
  currentBalance?: number;
  // For testing - overrides story data checks
  _debugForceStates?: {
    textReady?: boolean;
    coverReady?: boolean;
    imagesReady?: boolean;
  };
}

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

interface ChecklistItemProps {
  label: string;
  isCompleted: boolean;
  isLoading: boolean;
  showSpinner?: boolean;
  hasFailures?: boolean;
}

const ChecklistItem: React.FC<ChecklistItemProps> = ({
  label,
  isCompleted,
  showSpinner = false,
  hasFailures = false,
}) => {
  return (
    <View style={styles.checklistItem}>
      <View style={styles.checklistIcon}>
        {isCompleted && hasFailures ? (
          <IconSymbol
            name="exclamationmark.triangle.fill"
            size={20}
            color={Colors.warning}
          />
        ) : isCompleted ? (
          <IconSymbol
            name="checkmark.circle.fill"
            size={20}
            color={Colors.success}
          />
        ) : showSpinner ? (
          <ActivityIndicator size="small" color={Colors.primary} />
        ) : (
          <View style={styles.emptyCircle} />
        )}
      </View>
      <Text
        style={[
          styles.checklistLabel,
          hasFailures && isCompleted && styles.checklistLabelWarning,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const GENERATION_MESSAGES = [
  "Crafting your magical story...",
  "Choosing the perfect characters...",
  "Painting beautiful illustrations...",
  "Adding magical touches...",
  "Almost ready for bedtime...",
];

export const GenerationStep: React.FC<GenerationStepProps> = ({
  isGenerating,
  error,
  storyData,
  onNavigateToStory,
  onStartOver,
  currentBalance = 0,
  _debugForceStates,
}) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const generationStartTime = useRef<number | null>(null);
  const hasTrackedStart = useRef(false);
  const hasAutoNavigated = useRef(false);
  const wasGenerating = useRef(false);
  const hasTrackedCompletion = useRef(false);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isFocused = useIsFocused();

  // Helper functions to check generation status
  // Memoize story status calculations to prevent unnecessary re-renders
  const isStoryTextReady = useMemo(() => {
    // Debug force state takes priority
    if (_debugForceStates?.textReady !== undefined) {
      return _debugForceStates.textReady;
    }

    // Check if we have actual story content data
    const hasActualContent = !!(
      storyData?.title &&
      Array.isArray(storyData?.storyContent) &&
      storyData?.storyContent.length > 0
    );

    return hasActualContent;
  }, [_debugForceStates?.textReady, storyData?.title, storyData?.storyContent]);

  const isCoverImageReady = useMemo(() => {
    if (_debugForceStates?.coverReady !== undefined)
      return _debugForceStates.coverReady;

    // Check actual data
    return !!(storyData?.coverImageUrl && storyData.coverImageUrl !== "");
  }, [_debugForceStates?.coverReady, storyData?.coverImageUrl]);

  const arePageImagesReady = useMemo(() => {
    if (_debugForceStates?.imagesReady !== undefined)
      return _debugForceStates.imagesReady;

    // If we don't have story data yet, images are not ready
    if (!storyData) return false;

    const status = storyData?.imageGenerationStatus;

    // Consider images ready if status is completed OR if all images are accounted for (success + failure)
    if (status === "completed") return true;

    const imagesGenerated = storyData.imagesGenerated || 0;
    const imagesFailed = storyData.imagesFailed || 0;
    const totalImages =
      storyData.totalImages || storyData.storyConfiguration?.pageCount || 0;

    return totalImages > 0 && imagesGenerated + imagesFailed >= totalImages;
  }, [_debugForceStates?.imagesReady, storyData]);

  const isStoryFullyComplete = useMemo(() => {
    return isStoryTextReady && isCoverImageReady && arePageImagesReady;
  }, [isStoryTextReady, isCoverImageReady, arePageImagesReady]);

  const pageImageProgress = useMemo(() => {
    const imagesGenerated = storyData?.imagesGenerated || 0;
    const imagesFailed = storyData?.imagesFailed || 0;
    const totalImages =
      storyData?.totalImages || storyData?.storyConfiguration?.pageCount || 0;

    if (totalImages === 0) return "";

    // Show progress once we have cover image ready (meaning page image generation should start)
    if (
      isCoverImageReady ||
      imagesGenerated > 0 ||
      imagesFailed > 0 ||
      arePageImagesReady
    ) {
      const completed = imagesGenerated + imagesFailed;
      return ` (${completed}/${totalImages}${imagesFailed > 0 ? `, ${imagesFailed} failed` : ""})`;
    }

    return "";
  }, [
    storyData?.imagesGenerated,
    storyData?.imagesFailed,
    storyData?.totalImages,
    storyData?.storyConfiguration?.pageCount,
    isCoverImageReady,
    arePageImagesReady,
  ]);

  // Use same padding logic as WizardFooter
  const bottomPadding = Platform.select({
    ios: 0,
    android: insets.bottom + Spacing.sm,
  });

  useEffect(() => {
    if (!isGenerating) return;

    const messageInterval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % GENERATION_MESSAGES.length);
    }, 3000); // 3 seconds

    return () => {
      clearInterval(messageInterval);
    };
  }, [isGenerating]);

  // Track generation started
  useEffect(() => {
    if (isGenerating && !hasTrackedStart.current) {
      generationStartTime.current = Date.now();
      hasTrackedStart.current = true;

      Analytics.logEvent("story_generation_ui_started", {
        timestamp: generationStartTime.current,
      });
    }
  }, [isGenerating]);

  // Track generation completion
  useEffect(() => {
    if (
      !isGenerating &&
      storyData &&
      !error &&
      !hasTrackedCompletion.current &&
      generationStartTime.current
    ) {
      const generationTime = Date.now() - generationStartTime.current;
      hasTrackedCompletion.current = true;

      Analytics.logEvent("story_generation_ui_completed", {
        story_id: storyData.id,
        generation_time_ms: generationTime,
        generation_time_seconds: Math.round(generationTime / 1000),
        text_ready: isStoryTextReady,
        cover_ready: isCoverImageReady,
        images_ready: arePageImagesReady,
        has_image_failures: (storyData.imagesFailed || 0) > 0,
        images_generated: storyData.imagesGenerated || 0,
        images_failed: storyData.imagesFailed || 0,
      });
    }
  }, [
    isGenerating,
    storyData,
    error,
    isStoryTextReady,
    isCoverImageReady,
    arePageImagesReady,
  ]);

  // Track generation errors
  useEffect(() => {
    if (error && generationStartTime.current) {
      const generationTime = Date.now() - generationStartTime.current;

      const getErrorType = (errorMessage: string) => {
        if (errorMessage.includes("content guidelines")) return "safety_filter";
        if (errorMessage.includes("busy")) return "rate_limit";
        if (errorMessage.includes("timeout")) return "timeout";
        if (errorMessage.includes("credits")) return "insufficient_credits";
        return "unknown";
      };

      Analytics.logEvent("story_generation_ui_error", {
        error_message: error,
        generation_time_ms: generationTime,
        error_type: getErrorType(error),
      });
    }
  }, [error]);

  // Track if we're currently generating and reset refs when generation restarts
  useEffect(() => {
    if (isGenerating) {
      wasGenerating.current = true;
      // Reset refs when generation restarts for multiple attempts
      hasAutoNavigated.current = false;
    }
  }, [isGenerating]);

  // Auto-redirect when story is complete (only if screen is focused and was actively generating)
  useEffect(() => {
    if (
      isStoryFullyComplete &&
      onNavigateToStory &&
      isFocused &&
      wasGenerating.current &&
      !hasAutoNavigated.current
    ) {
      // Mark that we're about to auto-navigate to prevent duplicate navigations
      hasAutoNavigated.current = true;

      // Add a small delay to show completion state briefly
      const timer = setTimeout(() => {
        // Double-check focus before navigating to prevent race condition
        if (isFocused) {
          onNavigateToStory();
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isStoryFullyComplete, onNavigateToStory, isFocused]);

  // Check if this is an insufficient credits error
  const isInsufficientCreditsError =
    error?.includes("Insufficient credits") ||
    (error?.includes("need") && error?.includes("credits"));

  // Track insufficient credits when the error is first shown
  useEffect(() => {
    if (isInsufficientCreditsError) {
      // Extract credit info from error message if possible
      const creditsNeeded = error?.match(/need (\d+) credits?/i)?.[1];

      Analytics.logInsufficientCredits({
        required_credits: creditsNeeded ? parseInt(creditsNeeded) : 1,
        current_balance: currentBalance,
        action_attempted: "story_generation",
      });
    }
  }, [isInsufficientCreditsError, error, currentBalance]);

  // Show error state if there's an error
  if (error && !isGenerating) {
    return (
      <BackgroundContainer showDecorations={true}>
        <View style={styles.container}>
          <View style={styles.content}>
            <View style={styles.errorContainer}>
              <IconSymbol
                name={
                  isInsufficientCreditsError
                    ? "sparkles"
                    : "exclamationmark.triangle"
                }
                size={isTablet ? 80 : 64}
                color={
                  isInsufficientCreditsError ? Colors.primary : Colors.error
                }
              />
              <Text style={styles.errorTitle}>
                {isInsufficientCreditsError
                  ? "More credits needed"
                  : "Story generation failed"}
              </Text>
              <Text style={styles.errorMessage}>
                {isInsufficientCreditsError
                  ? "You need more credits to create this story. Purchase credits to continue your magical storytelling journey."
                  : error}
              </Text>

              {isInsufficientCreditsError && (
                <View style={styles.creditActions}>
                  <Button
                    title="Buy credits"
                    onPress={() => router.push("/credits-modal")}
                    variant="primary"
                    size="large"
                    style={styles.buyCreditsButton}
                  />
                  <Text style={styles.orText}>or</Text>
                  {onStartOver && (
                    <Button
                      title="Choose fewer pages"
                      onPress={onStartOver}
                      variant="outline"
                      size="large"
                    />
                  )}
                </View>
              )}
            </View>
          </View>

          <View style={[styles.footer, { paddingBottom: bottomPadding }]}>
            {!isInsufficientCreditsError && onStartOver && (
              <Button
                title="Try a different story"
                onPress={onStartOver}
                variant="wizard"
                size="large"
              />
            )}
          </View>
        </View>
      </BackgroundContainer>
    );
  }

  return (
    <BackgroundContainer showDecorations={true}>
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.animationContainer}>
            <LoadingSpinner size="large" showGlow={true} />
          </View>

          <Text style={styles.title}>Creating your story</Text>
          <Text style={styles.message}>
            {GENERATION_MESSAGES[currentMessageIndex]}
          </Text>

          {/* Generation Progress Checklist */}
          <View style={styles.checklistContainer}>
            <ChecklistItem
              label="Story text"
              isCompleted={isStoryTextReady}
              isLoading={isGenerating && !isStoryTextReady}
              showSpinner={isGenerating && !isStoryTextReady}
            />
            <ChecklistItem
              label="Cover illustration"
              isCompleted={isCoverImageReady}
              isLoading={isGenerating && !isCoverImageReady}
              showSpinner={
                isGenerating && isStoryTextReady && !isCoverImageReady
              }
            />
            <ChecklistItem
              label={`Page illustrations${pageImageProgress}`}
              isCompleted={arePageImagesReady}
              isLoading={isGenerating && !arePageImagesReady}
              showSpinner={
                isGenerating && isCoverImageReady && !arePageImagesReady
              }
              hasFailures={(storyData?.imagesFailed || 0) > 0}
            />
          </View>

          {/* Push notification message */}
          <View style={styles.tipContainer}>
            <IconSymbol
              name={isStoryFullyComplete ? "checkmark.circle" : "bell"}
              size={isTablet ? 18 : 16}
              color={isStoryFullyComplete ? Colors.success : Colors.warning}
            />
            <Text style={styles.tipText}>
              {isStoryFullyComplete
                ? "Your story is complete and ready to read!"
                : "This'll take a few minutes. Feel free to get on with something else and we'll send you a notification when your story is ready to read!"}
            </Text>
          </View>
        </View>

        <View style={[styles.footer, { paddingBottom: bottomPadding }]}>
          <Button
            title="View story"
            onPress={onNavigateToStory || (() => {})}
            variant="outline"
            size="large"
            disabled={!isStoryTextReady}
          />
        </View>
      </View>
    </BackgroundContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: isTablet ? Spacing.massive : Spacing.huge,
  },
  animationContainer: {
    marginBottom: isTablet ? Spacing.massive : Spacing.huge,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: isTablet ? Typography.fontSize.h1Tablet : Typography.fontSize.h2,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.lg,
    textAlign: "center",
    fontFamily: Typography.fontFamily.primary,
  },
  message: {
    fontSize: isTablet ? Typography.fontSize.large : Typography.fontSize.medium,
    color: Colors.primary,
    textAlign: "center",
    marginBottom: Spacing.xxxl,
    fontWeight: Typography.fontWeight.medium,
    letterSpacing: Typography.letterSpacing.normal,
  },
  tipContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
    padding: Spacing.lg,
    borderRadius: BorderRadius.large,
    gap: Spacing.sm,
    width: isTablet ? 500 : 300,
    alignSelf: "center",
  },
  tipText: {
    flex: 1,
    fontSize: isTablet ? Typography.fontSize.medium : Typography.fontSize.small,
    color: Colors.textSecondary,
    lineHeight: isTablet ? 22 : 20,
  },
  footer: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: "rgba(15, 17, 41, 0.5)",
  },
  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.screenPadding,
  },
  errorTitle: {
    fontSize: isTablet ? Typography.fontSize.h1Tablet : Typography.fontSize.h2,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text,
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
    textAlign: "center",
    fontFamily: Typography.fontFamily.primary,
  },
  errorMessage: {
    fontSize: isTablet ? Typography.fontSize.large : Typography.fontSize.medium,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: isTablet ? 28 : 24,
    marginBottom: Spacing.xxxl,
    width: isTablet ? 500 : 300,
  },
  buttonRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  retryButton: {
    flex: 1,
  },
  backButton: {
    flex: 1,
  },
  creditActions: {
    marginTop: Spacing.xl,
    alignItems: "center",
    width: "100%",
    gap: Spacing.md,
  },
  buyCreditsButton: {
    minWidth: 200,
  },
  orText: {
    fontSize: Typography.fontSize.small,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  checklistContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: BorderRadius.large,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
    width: 240,
  },
  checklistItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  checklistIcon: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.textSecondary,
    opacity: 0.3,
  },
  checklistLabel: {
    fontSize: isTablet ? Typography.fontSize.medium : Typography.fontSize.small,
    color: Colors.text,
    lineHeight: isTablet ? 22 : 18,
    fontWeight: Typography.fontWeight.medium,
    flex: 1,
    flexWrap: "wrap",
  },
  checklistLabelCompleted: {
    color: Colors.success,
    fontWeight: Typography.fontWeight.medium,
  },
  checklistLabelWarning: {
    color: Colors.warning,
    fontWeight: Typography.fontWeight.medium,
  },
});
