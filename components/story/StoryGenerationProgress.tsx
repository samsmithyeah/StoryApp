import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { Story } from "@/types/story.types";
import { IconSymbol } from "../ui/IconSymbol";
import { Button } from "../ui/Button";

interface StoryGenerationProgressProps {
  story: Story;
  onViewStory: () => void;
}

export const StoryGenerationProgress: React.FC<
  StoryGenerationProgressProps
> = ({ story, onViewStory }) => {
  const [showViewButton, setShowViewButton] = useState(false);

  useEffect(() => {
    // Show view button after a short delay to allow user to see the story is ready
    const timer = setTimeout(() => {
      setShowViewButton(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const getProgressText = () => {
    if (!story.storyConfiguration.illustrationStyle) {
      return "Your story is ready to read!";
    }

    switch (story.imageGenerationStatus) {
      case "pending":
        return "Your story text is ready! Starting image generation...";
      case "generating":
        return `Generating beautiful illustrations... (${story.imagesGenerated || 0}/${story.totalImages || 0})`;
      case "completed":
        return "Your magical story is complete with all illustrations!";
      case "failed":
        return "Your story is ready! Some images couldn't be generated.";
      default:
        return "Your story is ready to read!";
    }
  };

  const getProgressPercentage = () => {
    if (
      story.imageGenerationStatus === "not_requested" ||
      !story.storyConfiguration?.illustrationStyle
    ) {
      return 100;
    }

    if (story.imageGenerationStatus === "completed") {
      return 100;
    }

    if (story.totalImages && story.imagesGenerated !== undefined) {
      // Story text is worth 50% of progress, images are the other 50%
      const textProgress = 50;
      const imageProgress = (story.imagesGenerated / story.totalImages) * 50;
      return textProgress + imageProgress;
    }

    return 50; // Just text is ready
  };

  const progressPercentage = getProgressPercentage();
  const isComplete = progressPercentage === 100;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          {isComplete ? (
            <IconSymbol
              name="checkmark.circle.fill"
              size={80}
              color="#10B981"
            />
          ) : (
            <ActivityIndicator size="large" color="#6366F1" />
          )}
        </View>

        <Text style={styles.title}>{story.title}</Text>

        <Text style={styles.progressText}>{getProgressText()}</Text>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${progressPercentage}%` }]}
            />
          </View>
          <Text style={styles.progressPercentage}>
            {Math.round(progressPercentage)}%
          </Text>
        </View>

        {story.imageGenerationStatus === "generating" && (
          <Text style={styles.statusText}>
            Images are being generated in the background. You can start reading
            now!
          </Text>
        )}

        {showViewButton && (
          <Button
            title="View your story"
            onPress={onViewStory}
            size="large"
            leftIcon="book.open"
            style={styles.viewButton}
          />
        )}

        {story.imageGenerationStatus === "generating" && (
          <Text style={styles.note}>
            💡 Your story will update automatically as images are ready
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    textAlign: "center",
    marginBottom: 16,
  },
  progressText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  progressContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 24,
  },
  progressBar: {
    width: "100%",
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#6366F1",
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 14,
    color: "#6366F1",
    fontWeight: "600",
  },
  statusText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  viewButton: {
    paddingHorizontal: 48,
    marginBottom: 16,
  },
  note: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    fontStyle: "italic",
  },
});
