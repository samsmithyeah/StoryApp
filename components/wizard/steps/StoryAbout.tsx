import { BorderRadius, Colors, Spacing, Typography } from "@/constants/Theme";
import React, { useState } from "react";
import { ScrollView, StyleSheet, TextInput, View } from "react-native";
import { OptionCard } from "../shared/OptionCard";
import { WizardContainer } from "../shared/WizardContainer";
import { WizardFooter } from "../shared/WizardFooter";
import { WizardStepHeader } from "../shared/WizardStepHeader";

interface StoryAboutProps {
  storyAbout?: string;
  onUpdate: (data: { storyAbout: string }) => void;
  onNext: () => void;
  onBack: () => void;
  onCancel: () => void;
}

export const StoryAbout: React.FC<StoryAboutProps> = ({
  storyAbout = "",
  onUpdate,
  onNext,
  onBack,
  onCancel,
}) => {
  const [mode, setMode] = useState<"surprise" | "custom">(
    storyAbout ? "custom" : "surprise"
  );
  const [text, setText] = useState(storyAbout);

  const handleNext = () => {
    onUpdate({ storyAbout: mode === "surprise" ? "" : text });
    onNext();
  };

  const isNextDisabled = mode === "custom" && !text.trim();

  const options = [
    {
      id: "surprise",
      title: "Surprise me!",
      description: "Let the AI decide what the story is about",
      icon: "sparkles",
    },
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
                  setMode(optionId as "surprise" | "custom")
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
