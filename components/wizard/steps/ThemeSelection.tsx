import { Colors } from "@/constants/Theme";
import { useChildren } from "@/hooks/useChildren";
import {
  generateThemeSuggestions,
  ThemeSuggestion,
} from "@/services/firebase/stories";
import React, { useEffect, useState } from "react";
import { Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";
import { AISuggestedThemes } from "../shared/AISuggestedThemes";
import { CustomThemeSection } from "../shared/CustomThemeSection";
import { ThemeCard } from "../shared/ThemeCard";
import { WizardContainer } from "../shared/WizardContainer";
import { WizardFooter } from "../shared/WizardFooter";
import { WizardStepHeader } from "../shared/WizardStepHeader";

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

interface Theme {
  id: string;
  name: string;
  icon: string;
  description: string;
}

const THEMES: Theme[] = [
  {
    id: "adventure",
    name: "Adventure",
    icon: "airplane",
    description: "Exciting journeys and discoveries",
  },
  {
    id: "magical",
    name: "Magical",
    icon: "sparkles",
    description: "Wizards, fairies, and enchantment",
  },
  {
    id: "animals",
    name: "Animals",
    icon: "pawprint",
    description: "Friendly creatures and nature",
  },
  {
    id: "space",
    name: "Space",
    icon: "moon.stars",
    description: "Planets, stars, and astronauts",
  },
  {
    id: "underwater",
    name: "Underwater",
    icon: "drop.fill",
    description: "Ocean adventures and sea life",
  },
  {
    id: "friendship",
    name: "Friendship",
    icon: "heart.fill",
    description: "Making friends and kindness",
  },
  {
    id: "bedtime",
    name: "Bedtime",
    icon: "moon.fill",
    description: "Cozy, sleepy-time stories",
  },
  {
    id: "superhero",
    name: "Superhero",
    icon: "bolt.fill",
    description: "Heroes with special powers",
  },
];

interface ThemeSelectionProps {
  selectedTheme?: string;
  selectedChildren: string[];
  onSelect: (theme: string) => void;
  onNext: () => void;
  onBack: () => void;
  onCancel?: () => void;
}

export const ThemeSelection: React.FC<ThemeSelectionProps> = ({
  selectedTheme,
  selectedChildren,
  onSelect,
  onNext,
  onBack,
  onCancel,
}) => {
  const { children } = useChildren();
  const [customTheme, setCustomTheme] = useState("");
  const [aiThemes, setAiThemes] = useState<ThemeSuggestion[]>([]);
  const [loadingAiThemes, setLoadingAiThemes] = useState(false);
  const [aiThemesError, setAiThemesError] = useState<string | null>(null);

  const handleThemeSelect = (themeId: string) => {
    onSelect(themeId);
    setCustomTheme("");
  };

  const handleCustomThemeSelect = () => {
    onSelect("custom");
    if (!customTheme) {
      // Focus will be handled by the TextInput when it appears
    }
  };

  const handleCustomThemeChange = (text: string) => {
    setCustomTheme(text);
    if (selectedTheme === "custom") {
      // If custom theme is selected, update the selection with the typed text
      onSelect(text.trim() || "custom");
    }
  };

  const selectedChildProfiles = children.filter((child) =>
    selectedChildren.includes(child.id)
  );
  const hasPreferences = selectedChildProfiles.some((child) =>
    child.childPreferences.trim()
  );

  // Helper to check if custom theme is selected
  const isCustomThemeSelected =
    selectedTheme === "custom" ||
    (selectedTheme &&
      !THEMES.find((t) => t.id === selectedTheme) &&
      !aiThemes.find((t) => t.id === selectedTheme)) ||
    false;

  // Generate AI themes when children with preferences are selected
  useEffect(() => {
    const generateAiThemes = async () => {
      if (!hasPreferences || aiThemes.length > 0 || loadingAiThemes) {
        return;
      }

      setLoadingAiThemes(true);
      setAiThemesError(null);

      try {
        const preferences = selectedChildProfiles
          .map((child) => child.childPreferences.trim())
          .filter((pref) => pref.length > 0);

        console.log("Generating AI themes for preferences:", preferences);

        if (preferences.length > 0) {
          const suggestions = await generateThemeSuggestions(preferences);
          setAiThemes(suggestions);
          console.log("AI themes generated successfully:", suggestions);
        }
      } catch (error) {
        console.error("Error generating AI themes:", error);
        setAiThemesError(
          "Failed to generate personalized themes. Please try again."
        );
      } finally {
        setLoadingAiThemes(false);
      }
    };

    generateAiThemes();
  }, [
    selectedChildren,
    hasPreferences,
    aiThemes.length,
    loadingAiThemes,
    selectedChildProfiles,
  ]);

  const isNextDisabled =
    !selectedTheme || (isCustomThemeSelected && !customTheme.trim()) || false;

  return (
    <WizardContainer>
      <WizardStepHeader
        title="Choose Theme"
        subtitle="What kind of story shall we create?"
        stepNumber={2}
        totalSteps={3}
        onBack={onBack}
        onCancel={onCancel}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentContainer}>
          {hasPreferences && (
            <AISuggestedThemes
              selectedChildProfiles={selectedChildProfiles}
              loadingAiThemes={loadingAiThemes}
              aiThemesError={aiThemesError}
              aiThemes={aiThemes}
              selectedTheme={selectedTheme}
              onThemeSelect={handleThemeSelect}
            />
          )}

          <CustomThemeSection
            customTheme={customTheme}
            isCustomThemeSelected={isCustomThemeSelected}
            onCustomThemeSelect={handleCustomThemeSelect}
            onCustomThemeChange={handleCustomThemeChange}
          />

          <View style={styles.themesSection}>
            <Text style={styles.sectionTitle}>Other popular themes</Text>
            <View
              style={isTablet ? styles.themesListTablet : styles.themesList}
            >
              {THEMES.map((theme) => {
                const isSelected = theme.id === selectedTheme;

                return (
                  <ThemeCard
                    key={theme.id}
                    theme={theme}
                    isSelected={isSelected}
                    onSelect={handleThemeSelect}
                  />
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
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
  themesSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: "600",
    color: Colors.primary,
    marginBottom: 12,
    textAlign: "left",
  },
  themesList: {
    gap: 12,
  },
  themesListTablet: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginHorizontal: -6,
  },
});
