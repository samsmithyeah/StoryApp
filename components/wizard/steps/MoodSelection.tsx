import { Colors } from "@/constants/Theme";
import { Analytics } from "@/utils/analytics";
import { filterContent, getFilterErrorMessage } from "@/utils/contentFilter";
import React, { useState } from "react";
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CustomMoodSection } from "../shared/CustomMoodSection";
import { MoodCard } from "../shared/MoodCard";
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
    id: "absurd",
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
  const isCustomMoodSelected =
    selectedMood === "custom" ||
    (!!selectedMood && !MOOD_OPTIONS.find((m) => m.id === selectedMood));

  const [customMood, setCustomMood] = useState(
    isCustomMoodSelected && selectedMood !== "custom" ? selectedMood : ""
  );

  const handleMoodSelect = (moodId: string) => {
    // Track mood selection
    Analytics.logWizardMoodSelected({
      mood_type: "preset",
      mood_value: moodId,
    });

    onSelect(moodId);
    setCustomMood(""); // Clear custom text when selecting a predefined mood
  };

  const handleCustomMoodSelect = () => {
    // Track custom mood selection
    Analytics.logWizardMoodSelected({
      mood_type: "custom",
      mood_value: customMood.trim() || "empty",
    });

    // When the "Custom Mood" card is tapped, activate it.
    // Set the mood to the current input text, or "custom" if it's empty.
    onSelect(customMood.trim() || "custom");
  };

  const handleCustomMoodChange = (text: string) => {
    // First, update the local state that drives the TextInput's value.
    setCustomMood(text);

    // Check if the custom mood option is currently active.
    // If it is, immediately update the parent wizard's state with the new text.
    if (isCustomMoodSelected) {
      onSelect(text.trim() || " ");
    }
  };
  const isNextDisabled =
    !selectedMood || (isCustomMoodSelected && !customMood.trim());

  const handleNext = () => {
    if (isCustomMoodSelected && customMood.trim()) {
      const filterResult = filterContent(customMood);
      if (!filterResult.isAppropriate) {
        Alert.alert(
          "Content not appropriate",
          getFilterErrorMessage(filterResult.reason),
          [{ text: "OK" }]
        );
        return;
      }
    }
    onNext();
  };

  return (
    <WizardContainer>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <WizardStepHeader
          title="Set the mood"
          subtitle="What feeling should the story have?"
          stepNumber={3}
          totalSteps={7}
          onBack={onBack}
          onCancel={onCancel}
        />
        <View style={styles.contentContainer}>
          <CustomMoodSection
            customMood={customMood}
            isCustomMoodSelected={isCustomMoodSelected}
            onCustomMoodSelect={handleCustomMoodSelect}
            onCustomMoodChange={handleCustomMoodChange}
          />
          <View style={styles.moodsSection}>
            <Text style={styles.sectionTitle}>Other popular moods</Text>
            <View style={isTablet ? styles.moodsListTablet : styles.moodsList}>
              {MOOD_OPTIONS.map((mood) => {
                const isSelected = mood.id === selectedMood;
                return (
                  <MoodCard
                    key={mood.id}
                    mood={mood}
                    isSelected={isSelected}
                    onSelect={handleMoodSelect}
                  />
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>
      <WizardFooter onNext={handleNext} nextDisabled={isNextDisabled} />
    </WizardContainer>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 0,
  },
  moodsSection: {},
  sectionTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: "600",
    color: Colors.primary,
    marginBottom: 12,
    textAlign: "left",
  },
  moodsList: {
    gap: 12,
  },
  moodsListTablet: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
});
