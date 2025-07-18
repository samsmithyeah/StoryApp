import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Modal,
  ImageBackground,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { IconSymbol } from "../ui/IconSymbol";
import { Button } from "../ui/Button";
import { ChildProfileForm } from "../settings/ChildProfileForm";
import { useChildren } from "../../hooks/useChildren";
import { Colors, Typography, Spacing, BorderRadius, Shadows } from "../../constants/Theme";

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
  const [showChildForm, setShowChildForm] = useState(false);
  const { children } = useChildren();

  const steps = [
    {
      title: "Welcome to DreamWeaver!",
      subtitle: "Let's create magical bedtime stories together",
      icon: "wand.and.stars",
      description:
        "DreamWeaver creates personalized bedtime stories just for your little ones. Each story is unique and tailored to their interests and age.",
    },
    {
      title: "Add your child's profile",
      subtitle: "Help us create the perfect stories",
      icon: "person.crop.circle.badge.plus",
      description:
        "Tell us about your child so we can create stories that are just right for them - with their favorite things and perfect for their age.",
    },
    {
      title: "Tell us about your child",
      subtitle: "Complete the profile",
      icon: "pencil.and.outline",
      description:
        "Fill in your child's details to create personalized stories.",
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
    if (currentStep === 1) {
      // Show child profile form and move to step 2
      setShowChildForm(true);
      setCurrentStep(2);
      return;
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleChildFormComplete = async () => {
    setShowChildForm(false);
    setCurrentStep(3); // Go to final step
  };

  const handleSkipChildProfile = () => {
    setShowChildForm(false);
    setCurrentStep(3); // Skip to final step
  };

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const hasChildren = children.length > 0;
  
  // Calculate the actual step for progress indicator
  const progressStep = showChildForm ? 2 : currentStep;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <ImageBackground
        source={require("../../assets/images/background-landscape.png")}
        resizeMode="cover"
        style={styles.container}
      >
        <LinearGradient
          colors={[Colors.backgroundGradientStart, Colors.backgroundGradientEnd]}
          style={StyleSheet.absoluteFill}
        />
        
        <SafeAreaView style={styles.safeArea}>
          {/* Progress indicator at the top - consistent across all screens */}
          <View style={styles.progressHeader}>
            <View style={styles.stepIndicator}>
              {steps.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.stepDot,
                    index === progressStep && styles.stepDotActive,
                    index < progressStep && styles.stepDotCompleted,
                  ]}
                />
              ))}
            </View>
          </View>

          {showChildForm ? (
            <View style={styles.childFormContainer}>
              <ScrollView style={styles.childFormScroll}>
                <ChildProfileForm
                  onSave={handleChildFormComplete}
                  onCancel={handleSkipChildProfile}
                  submitButtonText="Continue"
                  showCancelButton={true}
                  cancelButtonText="Skip for now"
                  cancelAsLink={true}
                  title="Add new child"
                />
              </ScrollView>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.content}>

                <View style={styles.iconContainer}>
                  <View style={styles.iconGlow}>
                    <IconSymbol
                      name={currentStepData.icon as any}
                      size={isTablet ? 100 : 80}
                      color={Colors.primary}
                    />
                  </View>
                </View>

                <Text style={styles.title}>{currentStepData.title}</Text>
                <Text style={styles.subtitle}>{currentStepData.subtitle}</Text>
                <Text style={styles.description}>
                  {currentStepData.description}
                </Text>

                {currentStep === 1 && hasChildren && (
                  <View style={styles.existingChildrenNote}>
                    <IconSymbol
                      name="checkmark.circle.fill"
                      size={20}
                      color={Colors.success}
                    />
                    <Text style={styles.existingChildrenText}>
                      Great! You already have {children.length} child profile
                      {children.length !== 1 ? "s" : ""} set up.
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.footer}>
                <Button
                  title={
                    currentStep === 1
                      ? hasChildren
                        ? "Continue"
                        : "Add child profile"
                      : isLastStep
                        ? "Start creating stories!"
                        : "Next"
                  }
                  onPress={handleNext}
                  size="large"
                  variant="wizard"
                  rightIcon={isLastStep ? "arrow.right" : "chevron.right"}
                  style={styles.nextButton}
                />

                {isLastStep && (
                  <Button
                    title="Add another child"
                    onPress={() => setShowChildForm(true)}
                    variant="secondary"
                    leftIcon="plus"
                    style={styles.secondaryButton}
                  />
                )}

                {currentStep === 0 && (
                  <Text 
                    style={styles.skipLink}
                    onPress={() => onComplete()}
                  >
                    Skip for now
                  </Text>
                )}

                {currentStep === 1 && !hasChildren && (
                  <Text 
                    style={styles.skipLink}
                    onPress={() => setCurrentStep(3)}
                  >
                    Skip for now
                  </Text>
                )}
              </View>
            </ScrollView>
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
    paddingTop: isTablet ? Spacing.xl : Spacing.lg,
    paddingBottom: isTablet ? Spacing.xl : Spacing.lg,
    paddingHorizontal: isTablet ? Spacing.huge : Spacing.xxxl,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "space-between",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: isTablet ? Spacing.huge : Spacing.xxxl,
  },
  stepIndicator: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  stepDot: {
    width: isTablet ? 14 : 12,
    height: isTablet ? 14 : 12,
    borderRadius: isTablet ? 7 : 6,
    backgroundColor: "rgba(212, 175, 55, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
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
    padding: Spacing.lg,
    ...Shadows.glowLight,
  },
  title: {
    fontSize: isTablet ? Typography.fontSize.h1Small : Typography.fontSize.h2,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    textAlign: "center",
    marginBottom: Spacing.sm,
    fontFamily: Typography.fontFamily.primary,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: isTablet ? Typography.fontSize.h4 : Typography.fontSize.large,
    color: Colors.text,
    textAlign: "center",
    marginBottom: Spacing.xxl,
    opacity: 0.9,
    fontFamily: Typography.fontFamily.primary,
  },
  description: {
    fontSize: isTablet ? Typography.fontSize.medium : Typography.fontSize.small,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: isTablet ? 28 : 24,
    maxWidth: isTablet ? 480 : 320,
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
    paddingHorizontal: isTablet ? Spacing.huge : Spacing.xxxl,
    paddingBottom: isTablet ? Spacing.huge : Spacing.xxxl,
    paddingTop: Spacing.lg,
  },
  nextButton: {
    marginBottom: Spacing.lg,
  },
  secondaryButton: {
    marginBottom: 0,
  },
  skipLink: {
    fontSize: Typography.fontSize.small,
    color: Colors.primary,
    textAlign: "center",
    marginTop: Spacing.lg,
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
