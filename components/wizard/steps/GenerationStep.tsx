import { BackgroundContainer } from "@/components/shared/BackgroundContainer";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/Button";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { BorderRadius, Colors, Spacing, Typography } from "@/constants/Theme";
import { Story } from "@/types/story.types";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface GenerationStepProps {
  isGenerating: boolean;
  error?: string | null;
  storyData?: Story | null;
  onCancel: () => void;
  onNavigateToStory?: () => void;
  onStartOver?: () => void;
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
}

const ChecklistItem: React.FC<ChecklistItemProps> = ({
  label,
  isCompleted,
  showSpinner = false,
}) => {
  return (
    <View style={styles.checklistItem}>
      <View style={styles.checklistIcon}>
        {isCompleted ? (
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
      <Text style={styles.checklistLabel}>{label}</Text>
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
  onCancel,
  onNavigateToStory,
  onStartOver,
  _debugForceStates,
}) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Helper functions to check generation status
  const isStoryTextReady = (): boolean => {
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
  };

  const isCoverImageReady = (): boolean => {
    if (_debugForceStates?.coverReady !== undefined)
      return _debugForceStates.coverReady;

    // Check actual data
    return !!(storyData?.coverImageUrl && storyData.coverImageUrl !== "");
  };

  const arePageImagesReady = (): boolean => {
    if (_debugForceStates?.imagesReady !== undefined)
      return _debugForceStates.imagesReady;

    // If we don't have story data yet, images are not ready
    if (!storyData) return false;

    const status = storyData?.imageGenerationStatus;
    return status === "completed";
  };

  const isStoryFullyComplete = (): boolean => {
    return isStoryTextReady() && isCoverImageReady() && arePageImagesReady();
  };

  const getPageImageProgress = (): string => {
    const imagesGenerated = storyData?.imagesGenerated || 0;
    const totalImages =
      storyData?.totalImages || storyData?.storyConfiguration?.pageCount || 0;

    if (totalImages === 0) return "";

    // Show progress once we have cover image ready (meaning page image generation should start)
    if (isCoverImageReady() || imagesGenerated > 0 || arePageImagesReady()) {
      return ` (${imagesGenerated}/${totalImages})`;
    }

    return "";
  };

  // Use safe area bottom instead of tab bar height since we're outside tabs
  const tabBarHeight = insets.bottom + Spacing.lg;

  useEffect(() => {
    if (!isGenerating) return;

    const messageInterval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % GENERATION_MESSAGES.length);
    }, 3000);

    return () => {
      clearInterval(messageInterval);
    };
  }, [isGenerating]);

  // Check if this is an insufficient credits error
  const isInsufficientCreditsError =
    error?.includes("Insufficient credits") ||
    (error?.includes("need") && error?.includes("credits"));

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

          <View style={[styles.footer, { paddingBottom: tabBarHeight }]}>
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
              isCompleted={isStoryTextReady()}
              isLoading={isGenerating && !isStoryTextReady()}
              showSpinner={isGenerating && !isStoryTextReady()}
            />
            <ChecklistItem
              label="Cover illustration"
              isCompleted={isCoverImageReady()}
              isLoading={isGenerating && !isCoverImageReady()}
              showSpinner={
                isGenerating && isStoryTextReady() && !isCoverImageReady()
              }
            />
            <ChecklistItem
              label={`Page illustrations${getPageImageProgress()}`}
              isCompleted={arePageImagesReady()}
              isLoading={isGenerating && !arePageImagesReady()}
              showSpinner={
                isGenerating && isCoverImageReady() && !arePageImagesReady()
              }
            />
          </View>

          {/* Push notification message */}
          <View style={styles.tipContainer}>
            <IconSymbol
              name={isStoryFullyComplete() ? "checkmark.circle" : "bell"}
              size={isTablet ? 18 : 16}
              color={isStoryFullyComplete() ? Colors.success : Colors.warning}
            />
            <Text style={styles.tipText}>
              {isStoryFullyComplete()
                ? "Your story is complete and ready to read!"
                : "This'll take a few minutes. Feel free to get on with something else and we'll send you a notification when your story is ready to read!"}
            </Text>
          </View>
        </View>

        <View style={[styles.footer, { paddingBottom: tabBarHeight }]}>
          <Button
            title={isStoryTextReady() ? "View story" : "Cancel"}
            onPress={
              isStoryTextReady() && onNavigateToStory
                ? onNavigateToStory
                : onCancel
            }
            variant="outline"
            size="large"
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
});
