import {
  generateStory,
  StoryGenerationRequest,
} from "@/services/firebase/stories";
import { StoryConfiguration } from "@/types/story.types";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  View,
} from "react-native";
import { WizardHeader } from "./WizardHeader";
import { ChildSelection } from "./steps/ChildSelection";
import { CustomizationStep } from "./steps/CustomizationStep";
import { GenerationStep } from "./steps/GenerationStep";
import { ThemeSelection } from "./steps/ThemeSelection";

const WIZARD_STEPS = ["child", "theme", "customization", "generation"] as const;

type WizardStep = (typeof WIZARD_STEPS)[number];

interface StoryWizardProps {
  onComplete: (data: StoryConfiguration) => void;
  onCancel: () => void;
}

export const StoryWizard: React.FC<StoryWizardProps> = ({
  onComplete,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>("child");
  const [wizardData, setWizardData] = useState<Partial<StoryConfiguration>>({
    selectedChildren: [],
    childrenAsCharacters: true,
    length: "medium",
    illustrationStyle: "watercolor",
    enableIllustrations: true,
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const currentStepIndex = WIZARD_STEPS.indexOf(currentStep);
  const progress =
    currentStep === "generation"
      ? 100
      : ((currentStepIndex + 1) / (WIZARD_STEPS.length - 1)) * 100;

  const updateWizardData = (data: Partial<StoryConfiguration>) => {
    setWizardData((prev) => ({ ...prev, ...data }));
  };

  const goToNextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < WIZARD_STEPS.length) {
      setCurrentStep(WIZARD_STEPS[nextIndex]);
      if (WIZARD_STEPS[nextIndex] === "generation") {
        setIsGenerating(true);
        // Trigger story generation
        handleGeneration();
      }
    }
  };

  const goToPreviousStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(WIZARD_STEPS[prevIndex]);
    }
  };

  const handleGeneration = async () => {
    try {
      if (!isWizardComplete(wizardData)) {
        console.error("Wizard data incomplete");
        return;
      }

      const generationRequest: StoryGenerationRequest = {
        ...wizardData,
        enableIllustrations: wizardData.enableIllustrations ?? true,
      } as StoryGenerationRequest;

      const result = await generateStory(generationRequest);

      // Don't wait for images - story text is ready, navigate immediately
      onComplete({
        ...(wizardData as StoryConfiguration),
        storyId: result.storyId,
      });
    } catch (error) {
      console.error("Error generating story:", error);
      setIsGenerating(false);
      // Handle error state
    }
  };

  const isWizardComplete = (
    data: Partial<StoryConfiguration>
  ): data is StoryConfiguration => {
    return !!(
      data.selectedChildren &&
      data.selectedChildren.length > 0 &&
      data.theme &&
      data.length &&
      data.illustrationStyle
    );
  };

  const renderStep = () => {
    switch (currentStep) {
      case "child":
        return (
          <ChildSelection
            selectedChildren={wizardData.selectedChildren || []}
            childrenAsCharacters={wizardData.childrenAsCharacters || true}
            onUpdate={(data) => updateWizardData(data)}
            onNext={goToNextStep}
            onCancel={onCancel}
          />
        );
      case "theme":
        return (
          <ThemeSelection
            selectedTheme={wizardData.theme}
            selectedChildren={wizardData.selectedChildren || []}
            onSelect={(theme) => updateWizardData({ theme })}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
            onCancel={onCancel}
          />
        );
      case "customization":
        return (
          <CustomizationStep
            length={wizardData.length || "medium"}
            illustrationStyle={wizardData.illustrationStyle || "watercolor"}
            enableIllustrations={wizardData.enableIllustrations}
            onUpdate={(data) => updateWizardData(data)}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
          />
        );
      case "generation":
        return (
          <GenerationStep isGenerating={isGenerating} onCancel={onCancel} />
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {currentStep !== 'child' && currentStep !== 'theme' && (
          <WizardHeader
            title="Create Your Story"
            progress={progress}
            onClose={onCancel}
          />
        )}
        <View style={styles.content}>{renderStep()}</View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f1129",
  },
  keyboardAvoid: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
