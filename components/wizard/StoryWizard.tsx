import { useChildren } from "@/hooks/useChildren";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import {
  generateStory,
  StoryGenerationRequest,
} from "@/services/firebase/stories";
import { StoryConfiguration } from "@/types/story.types";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  View,
} from "react-native";
import { CharacterSelection } from "./steps/CharacterSelection";
import { ChildSelection } from "./steps/ChildSelection";
import { GenerationStep } from "./steps/GenerationStep";
import { IllustrationSelection } from "./steps/IllustrationSelection";
import { MoodSelection } from "./steps/MoodSelection";
import { StoryAbout } from "./steps/StoryAbout";
import { StoryDetails } from "./steps/StoryDetails";
import { ThemeSelection } from "./steps/ThemeSelection";

const WIZARD_STEPS = [
  "child",
  "theme",
  "mood",
  "characters",
  "about",
  "length",
  "illustrations",
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
    pageCount: 5,
    shouldRhyme: false,
    illustrationStyle: "loose-ink-wash",
    illustrationAiDescription:
      "Loose, scratchy dip-pen lines that feel quick and witty, splashed with unruly watercolor blooms. Lots of white paper, gawky limbs, and a 1970s British picture-book energy—messy, lively, and mid-scribble.",
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

  const hasProgress = () => {
    // Check if user has progressed beyond the first step
    if (currentStepIndex > 0) return true;

    // Check if any meaningful data has been entered
    const data = wizardData;
    return !!(
      (data.selectedChildren && data.selectedChildren.length > 0) ||
      data.theme ||
      data.mood ||
      data.storyAbout ||
      (data.characters && data.characters.length > 0) ||
      data.pageCount !== 5 ||
      data.shouldRhyme !== false ||
      data.illustrationStyle !== "loose-ink-wash" ||
      data.enableIllustrations !== true
    );
  };

  const handleCancel = () => {
    if (hasProgress()) {
      Alert.alert(
        "Discard story?",
        "Your progress will be lost if you go back now.",
        [
          {
            text: "Keep editing",
            style: "cancel",
          },
          {
            text: "Discard",
            style: "destructive",
            onPress: onCancel,
          },
        ]
      );
    } else {
      onCancel();
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
        pageImageModel: preferences.pageImageModel,
        temperature: preferences.temperature,
        geminiThinkingBudget: preferences.geminiThinkingBudget,
      } as StoryGenerationRequest;

      // Debug logging
      console.log("[DEBUG] Frontend preferences:", preferences);
      console.log(
        "[DEBUG] Generation request pageImageModel:",
        generationRequest.pageImageModel
      );

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
      data.pageCount &&
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
            onCancel={handleCancel}
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
            onCancel={handleCancel}
          />
        );
      case "mood":
        return (
          <MoodSelection
            selectedMood={wizardData.mood}
            onSelect={(mood) => updateWizardData({ mood })}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
            onCancel={handleCancel}
          />
        );
      case "about":
        return (
          <StoryAbout
            storyAbout={wizardData.storyAbout}
            onUpdate={(data) => updateWizardData(data)}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
            onCancel={handleCancel}
          />
        );
      case "characters":
        return (
          <CharacterSelection
            savedChildren={children}
            selectedChildren={wizardData.selectedChildren || []}
            characters={wizardData.characters || []}
            onUpdate={(data) => updateWizardData(data)}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
            onCancel={handleCancel}
          />
        );
      case "length":
        return (
          <StoryDetails
            pageCount={wizardData.pageCount || 5}
            shouldRhyme={wizardData.shouldRhyme || false}
            onUpdate={(data) => updateWizardData(data)}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
            onCancel={handleCancel}
          />
        );
      case "illustrations":
        return (
          <IllustrationSelection
            illustrationStyle={wizardData.illustrationStyle || "loose-ink-wash"}
            enableIllustrations={wizardData.enableIllustrations}
            onUpdate={(data) => updateWizardData(data)}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
            onCancel={handleCancel}
          />
        );
      case "generation":
        return (
          <GenerationStep
            isGenerating={_isGenerating}
            error={generationError}
            onCancel={handleCancel}
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
        behavior={Platform.OS === "ios" ? "padding" : undefined}
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
