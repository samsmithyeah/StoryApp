import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import Toast from "react-native-toast-message";
import { toastConfig } from "../ui/CustomToast";
import {
  Dimensions,
  ImageBackground,
  Modal,
  Platform,
  StatusBar as RNStatusBar,
  SafeAreaView,
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
import { useAuthStore } from "../../store/authStore";
import { Child } from "../../types/child.types";
import { ChildProfileForm } from "../settings/ChildProfileForm";
import { Button } from "../ui/Button";
import { IconSymbol } from "../ui/IconSymbol";

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

const STEPS = [
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

interface WelcomeOnboardingProps {
  visible: boolean;
  onComplete: () => void;
  justAppliedReferral?: boolean;
}

export const WelcomeOnboarding: React.FC<WelcomeOnboardingProps> = ({
  visible,
  onComplete,
  justAppliedReferral,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const { addChild } = useChildren();
  const insets = useSafeAreaInsets();
  const setJustAppliedReferral = useAuthStore(
    (state) => state.setJustAppliedReferral
  );

  // Show toast if referral was just applied
  useEffect(() => {
    if (visible && justAppliedReferral) {
      // Small delay to ensure modal is fully rendered
      setTimeout(() => {
        Toast.show({
          type: "success",
          text1: "Referral code applied!",
          text2: "You got 5 bonus credits!",
        });
        // Clear the flag after showing the toast
        setJustAppliedReferral(false);
      }, 500);
    }
  }, [visible, justAppliedReferral, setJustAppliedReferral]);

  const footerStyle = React.useMemo(
    () => [
      styles.footer,
      {
        paddingBottom: Platform.select({
          ios: 0,
          android: insets.bottom + Spacing.xl,
        }),
      },
    ],
    [insets.bottom]
  );

  const childFormRef = React.useRef<{
    handleSave: () => void;
    hasUnsavedChanges: () => boolean;
    getChildName: () => string;
  }>(null);

  // Reset to step 0 when component becomes visible
  React.useEffect(() => {
    if (visible) {
      setCurrentStep(0);
    }
  }, [visible]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      onComplete();
    }
  };

  const handleChildFormComplete = React.useCallback(
    async (childData: Omit<Child, "id">) => {
      await addChild(childData);
      setCurrentStep(2);
    },
    [addChild]
  );

  const handleSkipChildProfile = React.useCallback(() => {
    onComplete();
  }, [onComplete]);

  const handleStepClick = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  const currentStepData = STEPS[currentStep];
  const isLastStep = currentStep === STEPS.length - 1;

  const ProgressHeader = () => (
    <View
      style={[
        styles.progressHeader,
        Platform.OS === "android" && {
          paddingTop: (RNStatusBar.currentHeight || 0) + Spacing.xl,
        },
      ]}
    >
      <View style={styles.stepIndicator}>
        {STEPS.map((_, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => handleStepClick(index)}
            style={[
              styles.stepDot,
              index === currentStep && styles.stepDotActive,
              index < currentStep && styles.stepDotCompleted,
            ]}
            activeOpacity={0.7}
          />
        ))}
      </View>
    </View>
  );

  const ChildFormStep = () => {
    const contentBottomPadding =
      120 + (Platform.OS === "android" ? insets.bottom : 0);

    return (
      <View style={styles.childFormContainer}>
        <ChildProfileForm
          key="welcome-wizard-form"
          ref={childFormRef}
          onSave={handleChildFormComplete}
          onCancel={handleSkipChildProfile}
          title="Add a new child"
          contentBottomPadding={contentBottomPadding}
        />

        <View style={footerStyle}>
          <Button
            title="Continue"
            onPress={() => childFormRef.current?.handleSave()}
            size="large"
            variant="wizard"
            style={styles.nextButton}
            rightIcon="chevron.right"
          />

          <Text style={styles.skipLink} onPress={handleSkipChildProfile}>
            Skip for now
          </Text>
        </View>
      </View>
    );
  };

  const ContentStep = () => (
    <>
      <View style={{ flex: 1 }}>
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
          <Text style={styles.subtitle}>{currentStepData.subtitle}</Text>
          <Text style={styles.description}>{currentStepData.description}</Text>
        </View>
      </View>

      <View style={footerStyle}>
        {isLastStep && (
          <Button
            title="Add another child"
            onPress={() => setCurrentStep(1)}
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
  );

  const WrapperComponent = Platform.OS === "ios" ? SafeAreaView : View;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent={Platform.OS === "android"}
    >
      <ImageBackground
        source={require("../../assets/images/background-landscape.png")}
        resizeMode={isTablet ? "cover" : "none"}
        style={styles.container}
      >
        <LinearGradient
          colors={[
            Colors.backgroundGradientStart,
            Colors.backgroundGradientEnd,
          ]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        <WrapperComponent style={styles.safeArea}>
          <ProgressHeader />
          {currentStep === 1 ? <ChildFormStep /> : <ContentStep />}
        </WrapperComponent>
      </ImageBackground>
      <Toast config={toastConfig} />
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
    borderTopColor: "rgba(212, 175, 55, 0.15)",
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
    marginTop: Spacing.sm,
    textDecorationLine: "underline",
    opacity: 0.8,
  },
  childFormContainer: {
    flex: 1,
  },
});
