import { BackgroundContainer } from "@/components/shared/BackgroundContainer";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/Button";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { BorderRadius, Colors, Spacing, Typography } from "@/constants/Theme";
import React, { useEffect, useState } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface GenerationStepProps {
  isGenerating: boolean;
  textComplete?: boolean;
  imagesComplete?: boolean;
  error?: string | null;
  onCancel: () => void;
  onStartOver?: () => void;
  onGoToStoryTitle?: () => void;
}

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

const GENERATION_MESSAGES = [
  "Crafting your magical story...",
  "Choosing the perfect characters...",
  "Painting beautiful illustrations...",
  "Adding magical touches...",
  "Almost ready for bedtime...",
];

export const GenerationStep: React.FC<GenerationStepProps> = ({
  isGenerating,
  textComplete = false,
  imagesComplete: _imagesComplete = false,
  error,
  onCancel,
  onStartOver,
  onGoToStoryTitle,
}) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const insets = useSafeAreaInsets();

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

  // Show error state if there's an error
  if (error && !isGenerating) {
    return (
      <BackgroundContainer showDecorations={true}>
        <View style={styles.container}>
          <View style={styles.content}>
            <View style={styles.errorContainer}>
              <IconSymbol
                name="exclamationmark.triangle"
                size={isTablet ? 80 : 64}
                color={Colors.error}
              />
              <Text style={styles.errorTitle}>Story Generation Failed</Text>
              <Text style={styles.errorMessage}>{error}</Text>
            </View>
          </View>

          <View style={[styles.footer, { paddingBottom: tabBarHeight }]}>
            {onStartOver && (
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

          {textComplete && (
            <View style={styles.completionNotice}>
              <IconSymbol
                name="checkmark.circle"
                size={isTablet ? 32 : 24}
                color={Colors.success}
              />
              <Text style={styles.completionText}>
                Story text ready! You can start reading now or wait for
                illustrations.
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.footer, { paddingBottom: tabBarHeight }]}>
          {textComplete ? (
            <View style={styles.buttonRow}>
              <Button
                title="Start reading"
                onPress={onGoToStoryTitle || (() => {})}
                variant="wizard"
                size="large"
                style={styles.primaryButton}
              />
              <Button
                title="Cancel"
                onPress={onCancel}
                variant="outline"
                size="large"
                style={styles.secondaryButton}
              />
            </View>
          ) : (
            <Button
              title="Cancel"
              onPress={onCancel}
              variant="outline"
              size="large"
            />
          )}
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
    maxWidth: isTablet ? 500 : 300,
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
    maxWidth: isTablet ? 600 : 320,
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
  statusMessage: {
    fontSize: isTablet ? Typography.fontSize.medium : Typography.fontSize.small,
    color: Colors.primary,
    textAlign: "center",
    marginBottom: Spacing.xxxl,
    fontStyle: "italic",
  },
  completionNotice: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
    padding: Spacing.lg,
    borderRadius: BorderRadius.large,
    marginTop: Spacing.xl,
    gap: Spacing.sm,
    maxWidth: isTablet ? 500 : 320,
  },
  completionText: {
    flex: 1,
    fontSize: isTablet ? Typography.fontSize.medium : Typography.fontSize.small,
    color: Colors.text,
    lineHeight: isTablet ? 22 : 20,
  },
  primaryButton: {
    flex: 1,
  },
  secondaryButton: {
    flex: 1,
  },
});
