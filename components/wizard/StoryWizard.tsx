import {
  generateStory,
  StoryGenerationRequest,
} from "@/services/firebase/stories";
import { StoryConfiguration } from "@/types/story.types";
import { useChildren } from "@/hooks/useChildren";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  View,
} from "react-native";
import { ChildSelection } from "./steps/ChildSelection";
import { CustomizationStep } from "./steps/CustomizationStep";
import { GenerationStep } from "./steps/GenerationStep";
import { ThemeSelection } from "./steps/ThemeSelection";
import { StoryAbout } from "./steps/StoryAbout";
import { CharacterSelection } from "./steps/CharacterSelection";
import { MoodSelection } from "./steps/MoodSelection";

const WIZARD_STEPS = [
  "child",
  "theme",
  "mood",
  "characters",
  "about",
  "customization",
  "generation",
] as const;

type WizardStep = (typeof WIZARD_STEPS)[number];

interface StoryWizardProps {
  onComplete: (data: StoryConfiguration) => void;
  onCancel: () => void;
}

export const StoryWizard: React.FC<StoryWizardProps> = ({
  onComplete,
  onCancel,
}) => {
  const { children } = useChildren();
  const { preferences } = useUserPreferences();
  const [currentStep, setCurrentStep] = useState<WizardStep>("child");
  const [wizardData, setWizardData] = useState<Partial<StoryConfiguration>>({
    selectedChildren: [],
    length: "medium",
    illustrationStyle: "watercolor",
    enableIllustrations: true,
    storyAbout: "",
    characters: [],
  });
  const [_isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const currentStepIndex = WIZARD_STEPS.indexOf(currentStep);

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
      // Clear any previous errors
      setGenerationError(null);

      if (!isWizardComplete(wizardData)) {
        console.error("Wizard data incomplete");
        return;
      }

      const generationRequest: StoryGenerationRequest = {
        ...wizardData,
        enableIllustrations: wizardData.enableIllustrations ?? true,
        // Add preferences from user settings
        textModel: preferences.textModel,
        coverImageModel: preferences.coverImageModel,
        imageProvider: preferences.pageImageModel,
      } as StoryGenerationRequest;

      const result = await generateStory(generationRequest);

      // Don't wait for images - story text is ready, navigate immediately
      onComplete({
        ...(wizardData as StoryConfiguration),
        storyId: result.storyId,
      });
    } catch (error: any) {
      console.error("Error generating story:", error);
      setIsGenerating(false);

      // Use the error message from the cloud function, or provide a fallback
      const errorMessage =
        error?.message ||
        "We're having trouble generating your story right now. Please try again in a few moments.";

      setGenerationError(errorMessage);
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
      case "mood":
        return (
          <MoodSelection
            selectedMood={wizardData.mood}
            onSelect={(mood) => updateWizardData({ mood })}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
            onCancel={onCancel}
          />
        );
      case "about":
        return (
          <StoryAbout
            storyAbout={wizardData.storyAbout}
            onUpdate={(data) => updateWizardData(data)}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
            onCancel={onCancel}
          />
        );
      case "characters":
        return (
          <CharacterSelection
            savedChildren={children}
            characters={wizardData.characters || []}
            onUpdate={(data) => updateWizardData(data)}
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
            onCancel={onCancel}
          />
        );
      case "generation":
        return (
          <GenerationStep
            isGenerating={_isGenerating}
            error={generationError}
            onCancel={onCancel}
            onStartOver={() => {
              setGenerationError(null);
              setIsGenerating(false);
              setCurrentStep("child");
            }}
          />
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
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
