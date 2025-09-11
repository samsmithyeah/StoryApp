import { ContentLimits } from "@/constants/ContentLimits";
import { BorderRadius, Colors, Spacing, Typography } from "@/constants/Theme";
import { useChildren } from "@/hooks/useChildren";
import { Analytics } from "@/utils/analytics";
import { filterContent, getFilterErrorMessage } from "@/utils/contentFilter";
import React, { useState, useMemo } from "react";
import { Alert, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { OptionCard } from "../shared/OptionCard";
import { WizardContainer } from "../shared/WizardContainer";
import { WizardFooter } from "../shared/WizardFooter";
import { WizardStepHeader } from "../shared/WizardStepHeader";

interface StoryAboutProps {
  storyAbout?: string;
  selectedChildren: string[];
  onUpdate: (data: { storyAbout: string }) => void;
  onNext: () => void;
  onBack: () => void;
  onCancel: () => void;
}

export const StoryAbout: React.FC<StoryAboutProps> = ({
  storyAbout = "",
  selectedChildren,
  onUpdate,
  onNext,
  onBack,
  onCancel,
}) => {
  const { children } = useChildren();
  const [mode, setMode] = useState<"surprise" | "custom" | "interests">(
    storyAbout ? "custom" : "surprise"
  );
  const [text, setText] = useState(storyAbout);

  // Memoize selected children data to avoid redundant computation
  const selectedChildrenData = useMemo(
    () => children.filter((child) => selectedChildren.includes(child.id)),
    [children, selectedChildren]
  );

  // Helper function to format an array of strings into a natural language list
  const formatListAsSentence = (items: string[]): string => {
    if (items.length === 0) return "";
    if (items.length === 1) return items[0];
    if (items.length === 2) return `${items[0]} and ${items[1]}`;

    // For 3+ items: "a, b, and c"
    return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
  };

  // Helper function to format comma-separated interests into natural language
  const formatInterestList = (interestsString: string): string => {
    if (!interestsString) return "";
    const interests = interestsString.split(", ").filter(Boolean);
    return formatListAsSentence(interests);
  };

  const handleNext = () => {
    let storyAboutText = "";

    if (mode === "interests") {
      // Get selected children's interests
      const childInterests = selectedChildrenData
        .map((child) => child.childPreferences)
        .filter((interests): interests is string => !!interests?.trim());

      if (childInterests.length > 0) {
        if (childInterests.length === 1) {
          // Format single child's interests
          const formattedInterests = formatInterestList(childInterests[0]);
          storyAboutText = `A story that would appeal to a child who likes ${formattedInterests}`;
        } else {
          // Format multiple children's interests
          const interestDescriptions = childInterests.map(
            (interests) => `a child who likes ${formatInterestList(interests)}`
          );
          storyAboutText = `A story that would appeal to ${formatListAsSentence(
            interestDescriptions
          )}`;
        }
      }
    } else if (mode === "custom") {
      storyAboutText = text.trim();
    }

    // Track story about selection
    Analytics.logWizardStoryAboutSelected({
      selection_type: mode === "interests" ? "custom" : mode,
      has_custom_description:
        (mode === "custom" && text.trim().length > 0) || mode === "interests",
      description_length: storyAboutText.length,
    });

    if (storyAboutText) {
      const filterResult = filterContent(storyAboutText);
      if (!filterResult.isAppropriate) {
        Alert.alert(
          "Content not appropriate",
          getFilterErrorMessage(filterResult.reason),
          [{ text: "OK" }]
        );
        return;
      }
    }

    onUpdate({ storyAbout: storyAboutText });
    onNext();
  };

  // Check if any selected children have interests
  const hasInterests = selectedChildrenData.some((child) =>
    child.childPreferences?.trim()
  );

  // Format child names naturally for the interests option title
  const formattedChildNames = formatListAsSentence(
    selectedChildrenData.map((child) => child.childName)
  );

  const isNextDisabled =
    (mode === "custom" && !text.trim()) ||
    (mode === "interests" && !hasInterests);

  const options = [
    {
      id: "surprise",
      title: "Surprise me!",
      description: "Let the AI decide what the story is about",
      icon: "sparkles",
    },
    ...(hasInterests
      ? [
          {
            id: "interests",
            title: `${formattedChildNames}'s interests`,
            description: "Use their saved interests to inspire the story",
            icon: "heart.fill",
          },
        ]
      : []),
    {
      id: "custom",
      title: "I have an idea",
      description: "Tell us what you'd like the story to be about",
      icon: "pencil",
    },
  ];

  return (
    <WizardContainer>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <WizardStepHeader
          title="What's the story about?"
          subtitle="You can be as vague or specific as you like"
          stepNumber={5}
          totalSteps={7}
          onBack={onBack}
          onCancel={onCancel}
        />

        <View style={styles.content}>
          <View style={styles.optionsContainer}>
            {options.map((option) => (
              <OptionCard
                key={option.id}
                option={option}
                isSelected={mode === option.id}
                onSelect={(optionId) =>
                  setMode(optionId as "surprise" | "custom" | "interests")
                }
                style={styles.optionCardSpacing}
              />
            ))}
          </View>

          {mode === "custom" && (
            <View style={styles.customInputContainer}>
              <TextInput
                style={styles.customInput}
                placeholder="Describe what you'd like the story to be about..."
                placeholderTextColor={Colors.textSecondary}
                value={text}
                onChangeText={setText}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                returnKeyType="done"
                maxLength={ContentLimits.STORY_ABOUT_MAX_LENGTH}
              />
            </View>
          )}
        </View>
      </ScrollView>

      <WizardFooter onNext={handleNext} nextDisabled={isNextDisabled} />
    </WizardContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.xl,
    paddingBottom: 100,
  },
  optionsContainer: { marginBottom: -8 },
  optionCardSpacing: {
    marginBottom: Spacing.md,
  },
  customInputContainer: {
    marginTop: Spacing.md,
  },
  customInput: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: BorderRadius.medium,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.medium,
    color: Colors.text,
    minHeight: 120,
    textAlignVertical: "top",
  },
  helperText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.small,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
