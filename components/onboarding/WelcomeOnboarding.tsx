import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Dimensions,
  ImageBackground,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BorderRadius,
  Colors,
  CommonStyles,
  Shadows,
  Spacing,
  Typography,
} from "../../constants/Theme";
import { useChildren } from "../../hooks/useChildren";
import { Child } from "../../types/child.types";
import { ChildProfileForm } from "../settings/ChildProfileForm";
import { Button } from "../ui/Button";
import { IconSymbol } from "../ui/IconSymbol";

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

interface WelcomeOnboardingProps {
  visible: boolean;
  onComplete: () => void;
}

export const WelcomeOnboarding: React.FC<WelcomeOnboardingProps> = ({
  visible,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const { addChild } = useChildren();
  const insets = useSafeAreaInsets();
  const childFormRef = React.useRef<{
    handleSave: () => void;
    hasUnsavedChanges: () => boolean;
    getChildName: () => string;
  }>(null);
  const [childFormValid, setChildFormValid] = React.useState(false);

  // Reset to step 0 when component becomes visible
  React.useEffect(() => {
    if (visible) {
      setCurrentStep(0);
      setChildFormValid(false);
    }
  }, [visible]);

  // Check child form validity periodically when on step 1
  React.useEffect(() => {
    if (currentStep === 1) {
      const interval = setInterval(() => {
        const childName = childFormRef.current?.getChildName() || "";
        setChildFormValid(childName.length > 0);
      }, 100);

      return () => clearInterval(interval);
    } else {
      setChildFormValid(false);
    }
  }, [currentStep]);

  const steps = [
    {
      title: "Welcome to DreamWeaver!",
      subtitle: "Let's create magical bedtime stories together",
      icon: "wand.and.stars",
      description:
        "To use this app you need to create some profiles for your children. This enables you to create personalised stories for them. Add as much or as little information about each child as you like - the more you add, the more personalised the stories will be.",
    },
    {
      title: "Add your child",
      subtitle: "Tell us about your little one",
      icon: "person.crop.circle.badge.plus",
      isFormStep: true,
    },
    {
      title: "Ready to begin!",
      subtitle: "Everything is set up",
      icon: "sparkles",
      description:
        "You're all set! Now you can create unlimited personalized bedtime stories that will make bedtime magical.",
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleChildFormComplete = async (childData: Omit<Child, "id">) => {
    try {
      await addChild(childData);
      setCurrentStep(2); // Go to final step
    } catch (error) {
      console.error("Error adding child during onboarding:", error);
      // Don't proceed to next step if there's an error
      throw error;
    }
  };

  const handleSkipChildProfile = () => {
    onComplete(); // Close the wizard
  };

  const handleStepClick = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  // const hasChildren = children.length > 0;

  // Calculate the actual step for progress indicator
  const progressStep = currentStep;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent={true}
    >
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

        <SafeAreaView style={styles.safeArea}>
          {/* Progress indicator at the top - consistent across all screens */}
          <View style={styles.progressHeader}>
            <View style={styles.stepIndicator}>
              {steps.map((_, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleStepClick(index)}
                  style={[
                    styles.stepDot,
                    index === progressStep && styles.stepDotActive,
                    index < progressStep && styles.stepDotCompleted,
                  ]}
                  activeOpacity={0.7}
                />
              ))}
            </View>
          </View>

          {currentStep === 1 ? (
            <View style={styles.childFormContainer}>
              <ScrollView
                style={styles.childFormScroll}
                contentContainerStyle={{ paddingBottom: 120 }}
              >
                <ChildProfileForm
                  ref={childFormRef}
                  onSave={handleChildFormComplete}
                  onCancel={handleSkipChildProfile}
                  title="Add a new child"
                />
              </ScrollView>

              <View
                style={[
                  styles.footer,
                  {
                    paddingBottom: Platform.select({
                      ios: Math.max(insets.bottom + Spacing.xl, Spacing.xxxl),
                      android: insets.bottom + Spacing.xl,
                    }),
                  },
                ]}
              >
                <Button
                  title="Continue"
                  onPress={() => {
                    // Trigger form submission via ref
                    childFormRef.current?.handleSave();
                  }}
                  size="large"
                  variant="wizard"
                  style={styles.nextButton}
                  rightIcon="chevron.right"
                  disabled={!childFormValid}
                />

                <Text style={styles.skipLink} onPress={handleSkipChildProfile}>
                  Skip for now
                </Text>
              </View>
            </View>
          ) : (
            <>
              <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.content}>
                  <View style={styles.iconContainer}>
                    <View style={styles.iconPlain}>
                      <IconSymbol
                        name={currentStepData.icon as any}
                        size={isTablet ? 100 : 80}
                        color={Colors.primary}
                      />
                    </View>
                  </View>

                  <Text style={styles.title}>{currentStepData.title}</Text>
                  <Text style={styles.subtitle}>
                    {currentStepData.subtitle}
                  </Text>
                  <Text style={styles.description}>
                    {currentStepData.description}
                  </Text>
                </View>
              </ScrollView>

              <View
                style={[
                  styles.footer,
                  {
                    paddingBottom: Platform.select({
                      ios: Math.max(insets.bottom + Spacing.xl, Spacing.xxxl),
                      android: insets.bottom + Spacing.xl,
                    }),
                  },
                ]}
              >
                {isLastStep && (
                  <Button
                    title="Add another child"
                    onPress={() => {
                      setCurrentStep(1); // Go back to step 1
                    }}
                    variant="outline"
                    leftIcon="plus"
                    style={styles.secondaryButton}
                  />
                )}

                <Button
                  title={
                    currentStep === 0
                      ? "Next"
                      : currentStep === 2
                        ? "Start creating stories!"
                        : "Next"
                  }
                  onPress={handleNext}
                  size="large"
                  variant="wizard"
                  rightIcon={isLastStep ? "arrow.right" : "chevron.right"}
                  style={styles.nextButton}
                />

                {currentStep === 0 && (
                  <Text style={styles.skipLink} onPress={() => onComplete()}>
                    Skip for now
                  </Text>
                )}
              </View>
            </>
          )}
        </SafeAreaView>
      </ImageBackground>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
  },
  progressHeader: {
    alignItems: "center",
    paddingTop: isTablet ? Spacing.xxl : Spacing.xl,
    paddingBottom: isTablet ? Spacing.xl : Spacing.lg,
    paddingHorizontal: Spacing.screenPadding,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 120, // Space for fixed footer
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.screenPadding,
  },
  stepIndicator: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  stepDot: {
    width: isTablet ? 16 : 14,
    height: isTablet ? 16 : 14,
    borderRadius: isTablet ? 8 : 7,
    backgroundColor: "rgba(212, 175, 55, 0.15)",
    borderWidth: 2,
    borderColor: "rgba(212, 175, 55, 0.4)",
  },
  stepDotActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    ...Shadows.glow,
  },
  stepDotCompleted: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  iconContainer: {
    marginBottom: isTablet ? Spacing.huge : Spacing.xxxl,
  },
  iconGlow: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.round,
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    borderWidth: 2,
    borderColor: "rgba(212, 175, 55, 0.3)",
    ...Shadows.glow,
  },
  iconPlain: {
    padding: Spacing.xl,
    ...(Platform.OS === "ios" ? Shadows.glow : {}),
  },
  title: {
    ...CommonStyles.brandTitle,
    fontSize: isTablet
      ? Typography.fontSize.h1Tablet
      : Typography.fontSize.h1Phone,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: isTablet ? Typography.fontSize.h4 : Typography.fontSize.large,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.xxl,
    lineHeight: isTablet ? 28 : 24,
  },
  description: {
    fontSize: Typography.fontSize.medium,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: isTablet ? 28 : 22,
    maxWidth: isTablet ? 480 : 320,
    opacity: 0.9,
  },
  existingChildrenNote: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.medium,
    marginTop: Spacing.xxl,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  existingChildrenText: {
    fontSize: Typography.fontSize.small,
    color: Colors.success,
    flex: 1,
  },
  footer: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.xl,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: "rgba(212, 175, 55, 0.15)", // Faint golden line
  },
  nextButton: {
    marginBottom: 0,
  },
  secondaryButton: {
    marginBottom: Spacing.lg,
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: "dashed",
  },
  skipLink: {
    fontSize: Typography.fontSize.small,
    color: Colors.primary,
    textAlign: "center",
    marginTop: Spacing.md,
    textDecorationLine: "underline",
    opacity: 0.8,
  },
  childFormContainer: {
    flex: 1,
  },
  childFormScroll: {
    flex: 1,
  },
});
