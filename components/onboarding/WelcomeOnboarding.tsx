import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Modal,
} from "react-native";
import { IconSymbol } from "../ui/IconSymbol";
import { Button } from "../ui/Button";
import { ChildProfileForm } from "../settings/ChildProfileForm";
import { useChildren } from "../../hooks/useChildren";

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
      title: "Add Your Child's Profile",
      subtitle: "Help us create the perfect stories",
      icon: "person.crop.circle.badge.plus",
      description:
        "Tell us about your child so we can create stories that are just right for them - with their favorite things and perfect for their age.",
    },
    {
      title: "Ready to Begin!",
      subtitle: "Everything is set up",
      icon: "sparkles",
      description:
        "You're all set! Now you can create unlimited personalized bedtime stories that will make bedtime magical.",
    },
  ];

  const handleNext = () => {
    if (currentStep === 1) {
      // Show child profile form
      setShowChildForm(true);
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
    setCurrentStep(2); // Go to final step
  };

  const handleSkipChildProfile = () => {
    setShowChildForm(false);
    setCurrentStep(2); // Skip to final step
  };

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const hasChildren = children.length > 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <SafeAreaView style={styles.container}>
        {showChildForm ? (
          <View style={styles.childFormContainer}>
            <View style={styles.childFormHeader}>
              <Text style={styles.childFormTitle}>Add Your First Child</Text>
              <Text style={styles.childFormSubtitle}>
                This helps us create age-appropriate stories
              </Text>
            </View>

            <ScrollView style={styles.childFormScroll}>
              <ChildProfileForm
                onSave={handleChildFormComplete}
                onCancel={handleSkipChildProfile}
                submitButtonText="Continue"
                showCancelButton={true}
                cancelButtonText="Skip for now"
              />
            </ScrollView>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.content}>
              <View style={styles.stepIndicator}>
                {steps.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.stepDot,
                      index === currentStep && styles.stepDotActive,
                      index < currentStep && styles.stepDotCompleted,
                    ]}
                  />
                ))}
              </View>

              <View style={styles.iconContainer}>
                <IconSymbol
                  name={currentStepData.icon as any}
                  size={80}
                  color="#6366F1"
                />
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
                    color="#10B981"
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
                      : "Add Child Profile"
                    : isLastStep
                      ? "Start Creating Stories!"
                      : "Next"
                }
                onPress={handleNext}
                size="large"
                rightIcon={isLastStep ? "arrow.right" : "chevron.right"}
                style={styles.nextButton}
              />

              {currentStep === 1 && !hasChildren && (
                <Button
                  title="Skip for now"
                  onPress={() => setCurrentStep(2)}
                  variant="secondary"
                  style={styles.skipButton}
                />
              )}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "space-between",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingTop: 32,
  },
  stepIndicator: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 48,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#E5E7EB",
  },
  stepDotActive: {
    backgroundColor: "#6366F1",
  },
  stepDotCompleted: {
    backgroundColor: "#10B981",
  },
  iconContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111827",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    color: "#4B5563",
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 320,
  },
  existingChildrenNote: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  existingChildrenText: {
    fontSize: 14,
    color: "#059669",
    flex: 1,
  },
  footer: {
    paddingHorizontal: 32,
    paddingBottom: 32,
    paddingTop: 16,
  },
  nextButton: {
    marginBottom: 16,
  },
  skipButton: {
    marginBottom: 0,
  },
  childFormContainer: {
    flex: 1,
  },
  childFormHeader: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  childFormTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },
  childFormSubtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
  },
  childFormScroll: {
    flex: 1,
  },
});
