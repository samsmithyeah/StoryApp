import { router } from "expo-router";
import React from "react";
import { Alert } from "react-native";
import { StoryWizard } from "../components/wizard/StoryWizard";
import { StoryConfiguration } from "../types/story.types";

export default function WizardScreen() {
  const handleWizardComplete = async (wizardData: StoryConfiguration) => {
    try {
      // If we have a storyId, the story was already generated
      if (wizardData.storyId) {
        // Navigate directly to the story viewer
        router.push({
          pathname: "/story/[id]",
          params: { id: wizardData.storyId },
        });
      }
    } catch (error) {
      console.error("Error navigating to story:", error);
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to load story. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <StoryWizard onComplete={handleWizardComplete} onCancel={handleCancel} />
  );
}
