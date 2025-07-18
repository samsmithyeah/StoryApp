import { IconSymbol } from "@/components/ui/IconSymbol";
import { ThemeSuggestion } from "@/services/firebase/stories";
import { Child } from "@/types/child.types";
import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { ThemeCard } from "./ThemeCard";
import { ThemeSkeletonLoader } from "./ThemeSkeletonLoader";

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

interface AISuggestedThemesProps {
  selectedChildProfiles: Child[];
  loadingAiThemes: boolean;
  aiThemesError: string | null;
  aiThemes: ThemeSuggestion[];
  selectedTheme?: string;
  onThemeSelect: (themeId: string) => void;
}

export const AISuggestedThemes: React.FC<AISuggestedThemesProps> = ({
  selectedChildProfiles,
  loadingAiThemes,
  aiThemesError,
  aiThemes,
  selectedTheme,
  onThemeSelect,
}) => {
  const formatChildrenNames = (profiles: Child[]) => {
    if (profiles.length === 1) {
      return profiles[0].childName;
    } else if (profiles.length === 2) {
      return profiles.map((c) => c.childName).join(" and ");
    } else {
      return profiles
        .map((c) => c.childName)
        .join(", ")
        .replace(/,([^,]*)$/, " and$1");
    }
  };

  return (
    <View style={styles.suggestedSection}>
      <Text style={styles.sectionTitle}>AI suggested themes</Text>
      <Text style={styles.sectionSubtitle}>
        Based on {formatChildrenNames(selectedChildProfiles)}'s interests
      </Text>

      {loadingAiThemes && <ThemeSkeletonLoader count={4} />}

      {aiThemesError && (
        <View style={styles.errorContainer}>
          <IconSymbol
            name="exclamationmark.triangle"
            size={16}
            color="#EF4444"
          />
          <Text style={styles.errorText}>{aiThemesError}</Text>
        </View>
      )}

      {aiThemes.length > 0 && (
        <View style={isTablet ? styles.themesListTablet : styles.themesList}>
          {aiThemes.map((theme) => {
            const isSelected = theme.id === selectedTheme;

            return (
              <ThemeCard
                key={theme.id}
                theme={theme}
                isSelected={isSelected}
                onSelect={onThemeSelect}
              />
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  suggestedSection: {
    marginBottom: 32,
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.2)",
  },
  sectionTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: "600",
    color: "#D4AF37",
    marginBottom: 12,
    textAlign: "left",
  },
  sectionSubtitle: {
    fontSize: isTablet ? 16 : 14,
    color: "#9CA3AF",
    marginBottom: 16,
    textAlign: "left",
    lineHeight: 20,
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
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
  },
  errorText: {
    fontSize: 14,
    color: "#EF4444",
  },
});
