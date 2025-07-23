import { BorderRadius, Colors, Spacing, Typography } from "@/constants/Theme";
import React, { useState } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { OptionCard } from "../shared/OptionCard";
import { WizardContainer } from "../shared/WizardContainer";
import { WizardFooter } from "../shared/WizardFooter";
import { WizardStepHeader } from "../shared/WizardStepHeader";

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

interface MoodOption {
  id: string;
  title: string;
  description: string;
  icon: string;
}

const MOOD_OPTIONS: MoodOption[] = [
  {
    id: "calm",
    title: "Calm",
    description: "Peaceful and soothing for bedtime",
    icon: "moon.fill",
  },
  {
    id: "exciting",
    title: "Exciting",
    description: "Thrilling adventures and discoveries",
    icon: "bolt.fill",
  },
  {
    id: "scary",
    title: "Scary",
    description: "Spooky but age-appropriate chills",
    icon: "moon.stars",
  },
  {
    id: "funny",
    title: "Funny",
    description: "Humorous and laugh-out-loud moments",
    icon: "face.smiling.fill",
  },
  {
    id: "silly",
    title: "Silly",
    description: "Playful nonsense and giggles",
    icon: "star.fill",
  },
  {
    id: "cheeky",
    title: "Cheeky",
    description: "Mischievous and playfully naughty",
    icon: "sparkles",
  },
  {
    id: "emotional",
    title: "Emotional",
    description: "Heartwarming and touching moments",
    icon: "heart.fill",
  },
  {
    id: "interesting",
    title: "Interesting",
    description: "Intriguing and thought-provoking",
    icon: "book.fill",
  },
  {
    id: "adsurd",
    title: "Absurd",
    description: "Bizarre and nonsensical fun",
    icon: "gamecontroller.fill",
  },
];

interface MoodSelectionProps {
  selectedMood?: string;
  onSelect: (mood: string) => void;
  onNext: () => void;
  onBack: () => void;
  onCancel?: () => void;
}

export const MoodSelection: React.FC<MoodSelectionProps> = ({
  selectedMood,
  onSelect,
  onNext,
  onBack,
  onCancel,
}) => {
  const [customMood, setCustomMood] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const isCustomMoodSelected =
    selectedMood === "custom" ||
    (!!selectedMood && !MOOD_OPTIONS.find((m) => m.id === selectedMood));

  const handleMoodSelect = (moodId: string) => {
    if (moodId === "custom") {
      setShowCustomInput(true);
      onSelect("custom");
    } else {
      setShowCustomInput(false);
      setCustomMood("");
      onSelect(moodId);
    }
  };

  const handleCustomMoodChange = (text: string) => {
    setCustomMood(text);
    if (text.trim()) {
      onSelect(text.trim());
    } else {
      onSelect("custom");
    }
  };

  const isNextDisabled =
    !selectedMood ||
    (isCustomMoodSelected && !customMood.trim() && selectedMood === "custom");

  return (
    <WizardContainer>
      <WizardStepHeader
        title="Set the mood"
        subtitle="What feeling should the story have?"
        stepNumber={3}
        totalSteps={7}
        onBack={onBack}
        onCancel={onCancel}
      />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentContainer}>
          <View
            style={isTablet ? styles.moodsSectionTablet : styles.moodsSection}
          >
            {MOOD_OPTIONS.map((mood) => (
              <View
                key={mood.id}
                style={isTablet ? styles.optionCardWrapper : {}}
              >
                <OptionCard
                  option={mood}
                  isSelected={mood.id === selectedMood}
                  onSelect={handleMoodSelect}
                  style={styles.optionCardSpacing}
                />
              </View>
            ))}

            {/* Custom mood option */}
            <View style={isTablet ? styles.optionCardWrapper : {}}>
              <OptionCard
                option={{
                  id: "custom",
                  title: "Custom",
                  description: "Choose your own mood",
                  icon: "pencil",
                }}
                isSelected={isCustomMoodSelected}
                onSelect={handleMoodSelect}
                style={styles.optionCardSpacing}
              />
            </View>
          </View>

          {showCustomInput && (
            <View style={styles.customMoodContainer}>
              <TextInput
                style={styles.customMoodInput}
                placeholder="Enter a custom mood..."
                placeholderTextColor={Colors.textSecondary}
                value={customMood}
                onChangeText={handleCustomMoodChange}
                returnKeyType="done"
              />
              <Text style={styles.helperText}>
                Examples: "adventurous", "mysterious", "dreamy"
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
      <WizardFooter onNext={onNext} nextDisabled={isNextDisabled} />
    </WizardContainer>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  contentContainer: {
    paddingBottom: 0,
  },
  moodsSection: {
    marginBottom: 32,
  },
  moodsSectionTablet: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 32,
    marginHorizontal: -6,
  },
  optionCardWrapper: {
    width: "50%",
    paddingHorizontal: 6,
  },
  optionCardSpacing: {
    marginBottom: Spacing.md,
  },
  customMoodContainer: {
    marginTop: Spacing.lg,
    marginBottom: 32,
  },
  customMoodInput: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: BorderRadius.medium,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.medium,
    color: Colors.text,
  },
  helperText: {
    marginTop: Spacing.sm,
    fontSize: Typography.fontSize.small,
    color: Colors.textSecondary,
  },
});
