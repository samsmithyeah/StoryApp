import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Theme";
import React from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WizardContainer } from "../shared/WizardContainer";
import { WizardFooter } from "../shared/WizardFooter";
import { WizardStepHeader } from "../shared/WizardStepHeader";

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

interface Length {
  id: "short" | "medium" | "long";
  name: string;
  description: string;
  pages: string;
}

const LENGTHS: Length[] = [
  {
    id: "short",
    name: "Short",
    description: "Quick bedtime story",
    pages: "3-4 pages",
  },
  {
    id: "medium",
    name: "Medium",
    description: "Perfect for most nights",
    pages: "5-6 pages",
  },
  {
    id: "long",
    name: "Long",
    description: "Extended adventure",
    pages: "7-8 pages",
  },
];

interface StoryDetailsProps {
  length: "short" | "medium" | "long";
  shouldRhyme?: boolean;
  onUpdate: (data: { 
    length?: "short" | "medium" | "long";
    shouldRhyme?: boolean;
  }) => void;
  onNext: () => void;
  onBack: () => void;
  onCancel?: () => void;
}

export const StoryDetails: React.FC<StoryDetailsProps> = ({
  length,
  shouldRhyme = false,
  onUpdate,
  onNext,
  onBack,
  onCancel,
}) => {
  const handleLengthSelect = (selectedLength: "short" | "medium" | "long") => {
    onUpdate({ length: selectedLength });
  };

  const handleRhymeToggle = (value: boolean) => {
    onUpdate({ shouldRhyme: value });
  };

  return (
    <WizardContainer>
      <WizardStepHeader
        title="Story details"
        subtitle="Choose the length and style for your story"
        stepNumber={6}
        totalSteps={7}
        onBack={onBack}
        onCancel={onCancel}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Story Length</Text>
          <View style={isTablet ? styles.lengthRow : styles.lengthColumn}>
            {LENGTHS.map((lengthOption) => {
              const isSelected = lengthOption.id === length;

              return (
                <TouchableOpacity
                  key={lengthOption.id}
                  style={[
                    isTablet ? styles.lengthCardTablet : styles.lengthCard,
                    isSelected && styles.selectedCard,
                  ]}
                  onPress={() => handleLengthSelect(lengthOption.id)}
                >
                  <Text
                    style={[
                      styles.lengthName,
                      isSelected && styles.selectedText,
                    ]}
                  >
                    {lengthOption.name}
                  </Text>
                  <Text
                    style={[
                      styles.lengthDescription,
                      isSelected && styles.selectedDescription,
                    ]}
                  >
                    {lengthOption.description}
                  </Text>
                  <Text
                    style={[
                      styles.lengthPages,
                      isSelected && styles.selectedText,
                    ]}
                  >
                    {lengthOption.pages}
                  </Text>
                  {isSelected && (
                    <View style={styles.selectedIndicator}>
                      <IconSymbol name="checkmark" size={16} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.toggleSection}>
            <View style={styles.toggleInfo}>
              <Text style={styles.sectionTitle}>Rhyming</Text>
              <View style={styles.descriptionRow}>
                <Text style={styles.toggleDescription}>
                  Make the story rhyme like a poem or nursery rhyme
                </Text>
                <Switch
                  value={shouldRhyme}
                  onValueChange={handleRhymeToggle}
                  trackColor={{
                    false: "#374151",
                    true: "rgba(212, 175, 55, 0.3)",
                  }}
                  thumbColor={
                    shouldRhyme ? Colors.primary : Colors.textSecondary
                  }
                />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <WizardFooter onNext={onNext} />
    </WizardContainer>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  section: {
    marginBottom: 32,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: "600",
    color: Colors.primary,
    marginBottom: 16,
  },
  lengthRow: {
    flexDirection: "row",
    gap: 12,
  },
  lengthColumn: {
    gap: 12,
  },
  lengthCard: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: "transparent",
    position: "relative",
  },
  lengthCardTablet: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: "transparent",
    position: "relative",
  },
  selectedCard: {
    backgroundColor: "rgba(212, 175, 55, 0.2)",
    borderColor: Colors.primary,
  },
  lengthName: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 6,
  },
  lengthDescription: {
    fontSize: isTablet ? 16 : 14,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  lengthPages: {
    fontSize: isTablet ? 14 : 12,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  selectedText: {
    color: Colors.primary,
  },
  selectedDescription: {
    color: Colors.primary,
  },
  selectedIndicator: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
  },
  toggleSection: {
    paddingVertical: 8,
  },
  toggleInfo: {
    flex: 1,
  },
  descriptionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toggleDescription: {
    fontSize: isTablet ? 16 : 14,
    color: Colors.textSecondary,
    flex: 1,
    paddingRight: 16,
  },
});
