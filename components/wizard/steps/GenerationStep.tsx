import { Button } from "@/components/ui/Button";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { BackgroundContainer } from "@/components/shared/BackgroundContainer";
import { BorderRadius, Colors, Spacing, Typography } from "@/constants/Theme";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface GenerationStepProps {
  isGenerating: boolean;
  error?: string | null;
  onCancel: () => void;
  onStartOver?: () => void;
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
  error,
  onCancel,
  onStartOver,
}) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;
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

  useEffect(() => {
    if (!isGenerating) {
      rotationAnim.setValue(0);
      pulseAnim.setValue(1);
      glowAnim.setValue(0.3);
      return;
    }

    // Rotation animation
    const startRotation = () => {
      rotationAnim.setValue(0);
      Animated.loop(
        Animated.timing(rotationAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    };

    // Pulse animation - subtle
    const startPulse = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    // Glow animation - subtle
    const startGlow = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 0.6,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.4,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ])
      ).start();
    };

    startRotation();
    startPulse();
    startGlow();
  }, [isGenerating, rotationAnim, pulseAnim, glowAnim]);

  const spin = rotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

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
                variant="primary"
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
            <Animated.View
              style={[
                styles.magicCircle,
                {
                  shadowOpacity: glowAnim,
                },
              ]}
            >
              <Animated.View
                style={[
                  styles.innerCircle,
                  {
                    transform: [{ rotate: spin }, { scale: pulseAnim }],
                  },
                ]}
              >
                <View style={styles.wandContainer}>
                  <IconSymbol
                    name="wand.and.stars"
                    size={isTablet ? 80 : 64}
                    color={Colors.primary}
                  />
                </View>
              </Animated.View>
            </Animated.View>
          </View>

          <Text style={styles.title}>Creating your story</Text>
          <Text style={styles.message}>
            {GENERATION_MESSAGES[currentMessageIndex]}
          </Text>

          <View style={styles.tipContainer}>
            <IconSymbol
              name="lightbulb"
              size={isTablet ? 18 : 16}
              color={Colors.warning}
            />
            <Text style={styles.tipText}>
              Tip: Your story will be saved to your library for future bedtime
              reading!
            </Text>
          </View>
        </View>

        <View style={[styles.footer, { paddingBottom: tabBarHeight }]}>
          <Button
            title="Cancel"
            onPress={onCancel}
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
    position: "relative",
    marginBottom: isTablet ? Spacing.massive : Spacing.huge,
    alignItems: "center",
    justifyContent: "center",
  },
  magicCircle: {
    width: isTablet ? 160 : 120,
    height: isTablet ? 160 : 120,
    borderRadius: isTablet ? 80 : 60,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 20,
    elevation: 10,
  },
  innerCircle: {
    width: isTablet ? 160 : 120,
    height: isTablet ? 160 : 120,
    borderRadius: isTablet ? 80 : 60,
    backgroundColor: "rgba(212, 175, 55, 0.15)",
    borderWidth: 3,
    borderColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  wandContainer: {
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
});
