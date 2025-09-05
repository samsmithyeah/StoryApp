import { useChildren } from "@/hooks/useChildren";
import { useCredits } from "@/hooks/useCredits";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useWizardStore } from "@/store/wizardStore";
import { db } from "@/services/firebase/config";
import { generateStory } from "@/services/firebase/stories";
import { Story, StoryConfiguration } from "@/types/story.types";
import { logger } from "@/utils/logger";
import { Analytics } from "@/utils/analytics";
import { DEFAULT_PAGE_COUNT } from "@/constants/Story";
import { doc, onSnapshot } from "@react-native-firebase/firestore";
import React, { useCallback, useEffect, useState, useRef } from "react";
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
  const { credits } = useCredits();
  const { reset: resetWizardStore } = useWizardStore();
  const [currentStep, setCurrentStep] = useState<WizardStep>("child");
  const [wizardData, setWizardData] = useState<Partial<StoryConfiguration>>({
    selectedChildren: [],
    pageCount: DEFAULT_PAGE_COUNT,
    shouldRhyme: false,
    illustrationStyle: "loose-ink-wash",
    illustrationAiDescription:
      "Loose, scratchy dip-pen lines that feel quick and witty, splashed with unruly watercolor blooms. Lots of white paper, gawky limbs, and a 1970s British picture-book energy—messy, lively, and mid-scribble.",
    storyAbout: "",
    characters: [],
  });

  const [_isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generatedStoryId, setGeneratedStoryId] = useState<string | null>(null);
  const [storyData, setStoryData] = useState<Story | null>(null);
  const [hasAutoSelected, setHasAutoSelected] = useState(false);

  // Analytics tracking state
  const wizardStartTime = useRef<number | null>(null);
  const stepStartTime = useRef<number | null>(null);
  const hasTrackedWizardStart = useRef(false);
  const lastTrackedStep = useRef<WizardStep | null>(null);

  // Helper function to track wizard completion
  const trackWizardCompleted = useCallback(() => {
    if (wizardStartTime.current) {
      const completionTime = Date.now() - wizardStartTime.current;
      Analytics.logWizardCompleted({
        total_steps: WIZARD_STEPS.length,
        completion_time_ms: completionTime,
        final_config: wizardData,
      });
    }
  }, [wizardData]);

  const currentStepIndex = WIZARD_STEPS.indexOf(currentStep);

  const updateWizardData = (data: Partial<StoryConfiguration>) => {
    setWizardData((prev) => ({ ...prev, ...data }));
  };

  // Reset wizard store and track wizard start
  useEffect(() => {
    if (!hasTrackedWizardStart.current) {
      // Reset wizard store to clear any previous session data
      resetWizardStore();
      
      wizardStartTime.current = Date.now();
      stepStartTime.current = Date.now();
      hasTrackedWizardStart.current = true;
      lastTrackedStep.current = currentStep;

      Analytics.logWizardStarted({
        total_children: children.length,
        has_preferences: !!preferences,
      });

      // Track first step entry
      Analytics.logWizardStepEntered(currentStep, 0);
    }
  }, [children.length, preferences, currentStep, resetWizardStore]);

  // Auto-select single child if there's exactly one child profile (only once)
  useEffect(() => {
    if (
      children.length === 1 &&
      wizardData.selectedChildren?.length === 0 &&
      !hasAutoSelected
    ) {
      updateWizardData({ selectedChildren: [children[0].id] });
      setHasAutoSelected(true);
    }
  }, [children, wizardData.selectedChildren, hasAutoSelected]);

  const isStoryFullyComplete = useCallback((story: Story | null): boolean => {
    // Story is complete when we have text, cover, and all page images (if enabled)
    const hasText = !!(
      story?.title &&
      story?.storyContent &&
      story?.storyContent.length > 0
    );
    const hasCover = !!(story?.coverImageUrl && story.coverImageUrl !== "");
    const hasPageImages = story?.imageGenerationStatus === "completed";

    return hasText && hasCover && hasPageImages;
  }, []);

  // Listen to story updates to track generation progress
  useEffect(() => {
    if (!generatedStoryId) return;

    const storyRef = doc(db, "stories", generatedStoryId);
    const unsubscribe = onSnapshot(storyRef, (doc) => {
      if (doc && doc.exists()) {
        const story = {
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data()?.createdAt?.toDate() || new Date(),
        } as Story;

        setStoryData(story);

        // Check if everything is complete and auto-redirect
        if (isStoryFullyComplete(story) && _isGenerating) {
          // Story is fully complete - auto-redirect to story
          setIsGenerating(false);

          // Track wizard completion
          trackWizardCompleted();

          onComplete({
            ...(wizardData as StoryConfiguration),
            storyId: generatedStoryId,
          });
        }
      }
    });

    return () => unsubscribe();
  }, [
    generatedStoryId,
    _isGenerating,
    isStoryFullyComplete,
    onComplete,
    wizardData,
    trackWizardCompleted,
  ]);

  const goToNextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < WIZARD_STEPS.length) {
      const nextStep = WIZARD_STEPS[nextIndex];
      const prevStep = currentStep;

      // Track step transition timing
      const stepTimeSpent = stepStartTime.current
        ? Date.now() - stepStartTime.current
        : undefined;

      setCurrentStep(nextStep);

      // Track step entered analytics
      Analytics.logWizardStepEntered(
        nextStep,
        nextIndex,
        prevStep,
        stepTimeSpent
      );
      stepStartTime.current = Date.now();
      lastTrackedStep.current = nextStep;

      if (nextStep === "generation") {
        setIsGenerating(true);
        // Trigger story generation
        handleGeneration();
      }
    }
  };

  const goToPreviousStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      const prevStep = WIZARD_STEPS[prevIndex];
      const currentStepName = currentStep;

      // Track step transition timing
      const stepTimeSpent = stepStartTime.current
        ? Date.now() - stepStartTime.current
        : undefined;

      setCurrentStep(prevStep);

      // Track step entered analytics (going backward)
      Analytics.logWizardStepEntered(
        prevStep,
        prevIndex,
        currentStepName,
        stepTimeSpent
      );
      stepStartTime.current = Date.now();
      lastTrackedStep.current = prevStep;
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
      data.pageCount !== DEFAULT_PAGE_COUNT ||
      data.shouldRhyme !== false ||
      data.illustrationStyle !== "loose-ink-wash"
    );
  };

  const handleCancel = () => {
    // Track wizard abandonment
    if (wizardStartTime.current) {
      const completionPercent =
        (currentStepIndex / (WIZARD_STEPS.length - 1)) * 100;
      Analytics.logWizardAbandoned(
        currentStep,
        currentStepIndex,
        completionPercent
      );
    }

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
        logger.error("Wizard data incomplete", { wizardData });
        return;
      }

      const generationRequest: StoryConfiguration = {
        ...wizardData,
        // Add preferences from user settings
        textModel: preferences.textModel,
        coverImageModel: preferences.coverImageModel,
        pageImageModel: preferences.pageImageModel,
        temperature: preferences.temperature,
        geminiThinkingBudget: preferences.geminiThinkingBudget,
      } as StoryConfiguration;

      const result = await generateStory(generationRequest);

      // Store the story ID to monitor progress, but don't navigate yet
      setGeneratedStoryId(result.storyId);
    } catch (error: any) {
      logger.error("Error generating story", error, { wizardData });
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
            pageCount={wizardData.pageCount || DEFAULT_PAGE_COUNT}
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
            storyData={storyData}
            currentBalance={credits?.balance || 0}
            onNavigateToStory={() => {
              if (generatedStoryId) {
                // Track wizard completion (manual navigation)
                trackWizardCompleted();

                onComplete({
                  ...(wizardData as StoryConfiguration),
                  storyId: generatedStoryId,
                });
              }
            }}
            onStartOver={() => {
              setGenerationError(null);
              setIsGenerating(false);
              setGeneratedStoryId(null);
              setStoryData(null);
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
