// import { useChildren } from "@/hooks/useChildren";
// import { ThemeSuggestion } from "@/services/firebase/stories";
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
  selectedChildren: string[]; // Keep for future AI themes
  onSelect: (theme: string) => void;
  onNext: () => void;
  onBack: () => void;
  onCancel?: () => void;
}

export const ThemeSelection: React.FC<ThemeSelectionProps> = ({
  selectedTheme,
  selectedChildren: _selectedChildren, // Keep for future AI themes
  onSelect,
  onNext,
  onBack,
  onCancel,
}) => {
  // AI themes functionality temporarily disabled
  const aiThemes: any[] = [];

  // Helper to check if custom theme is selected
  const isCustomThemeSelected =
    selectedTheme === "custom" ||
    (!!selectedTheme &&
      !THEMES.find((t) => t.id === selectedTheme) &&
      !aiThemes.find((t) => t.id === selectedTheme));

  const [customTheme, setCustomTheme] = useState(
    isCustomThemeSelected ? selectedTheme : ""
  );

  const handleThemeSelect = (themeId: string) => {
    // Track theme selection
    Analytics.logWizardThemeSelected({
      theme_type: "preset",
      theme_value: themeId,
    });

    onSelect(themeId);
    setCustomTheme(""); // Clear custom text when selecting a predefined theme
  };

  const handleCustomThemeSelect = () => {
    // Track custom theme selection
    Analytics.logWizardThemeSelected({
      theme_type: "custom",
      theme_value: customTheme.trim() || "empty",
    });

    // When the "Custom Theme" card is tapped, activate it.
    onSelect(customTheme.trim() || " ");
  };

  const handleCustomThemeChange = (text: string) => {
    // First, update the local state that drives the TextInput's value.
    setCustomTheme(text);

    // Check if the custom theme option is currently active.
    // If it is, immediately update the parent wizard's state with the new text.
    if (isCustomThemeSelected) {
      onSelect(text.trim() || " ");
    }
  };

  // const selectedChildProfiles = children.filter((child) =>
  //   selectedChildren.includes(child.id)
  // );
  // const hasPreferences = selectedChildProfiles.some((child) =>
  //   child.childPreferences?.trim()
  // );

  // useEffect(() => {
  //   const generateAiThemes = async () => {
  //     if (!hasPreferences || aiThemes.length > 0 || loadingAiThemes) return;
  //     setLoadingAiThemes(true);
  //     setAiThemesError(null);
  //     try {
  //       const childrenInfo: ChildInfo[] = selectedChildProfiles
  //         .filter((child) => child.childPreferences?.trim())
  //         .map((child) => {
  //           let age = 5; // Default age if dateOfBirth is not provided

  //           if (child.dateOfBirth) {
  //             const today = new Date();
  //             const birthDate = new Date(child.dateOfBirth);
  //             const calculatedAge =
  //               today.getFullYear() - birthDate.getFullYear();
  //             const monthDiff = today.getMonth() - birthDate.getMonth();

  //             // For month/year dates, we only check if the birth month has passed this year
  //             age = monthDiff < 0 ? calculatedAge - 1 : calculatedAge;
  //           }

  //           return {
  //             preferences: child.childPreferences!.trim(),
  //             age: age,
  //           };
  //         });

  //       if (childrenInfo.length > 0) {
  //         const suggestions = await generateThemeSuggestions(childrenInfo);
  //         setAiThemes(suggestions);
  //       }
  //     } catch (error) {
  //       console.error("Error generating AI themes:", error);
  //       setAiThemesError(
  //         "Failed to generate personalized themes. Please try again."
  //       );
  //     } finally {
  //       setLoadingAiThemes(false);
  //     }
  //   };
  //   generateAiThemes();
  // }, [hasPreferences, selectedChildProfiles, aiThemes.length, loadingAiThemes]);

  const isNextDisabled =
    !selectedTheme || (isCustomThemeSelected && !customTheme.trim());

  const handleNext = () => {
    if (isCustomThemeSelected && customTheme.trim()) {
      const filterResult = filterContent(customTheme);
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
      <WizardStepHeader
        title="Choose a theme"
        subtitle="What kind of story shall we create?"
        stepNumber={2}
        totalSteps={7}
        onBack={onBack}
        onCancel={onCancel}
      />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentContainer}>
          {/* {hasPreferences && (
            <AISuggestedThemes
              selectedChildProfiles={selectedChildProfiles}
              loadingAiThemes={loadingAiThemes}
              aiThemesError={aiThemesError}
              aiThemes={aiThemes}
              selectedTheme={selectedTheme}
              onThemeSelect={handleThemeSelect}
            />
          )} */}
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
      <WizardFooter onNext={handleNext} nextDisabled={isNextDisabled} />
    </WizardContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  contentContainer: {
    paddingBottom: 0,
  },
  themesSection: {},
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
  },
});
