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
import { IconSymbol } from "@/components/ui/IconSymbol";
import { WizardContainer } from "../shared/WizardContainer";
import { WizardFooter } from "../shared/WizardFooter";
import { WizardStepHeader } from "../shared/WizardStepHeader";

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

interface StoryDetailsProps {
  pageCount?: number;
  shouldRhyme?: boolean;
  onUpdate: (data: { pageCount?: number; shouldRhyme?: boolean }) => void;
  onNext: () => void;
  onBack: () => void;
  onCancel?: () => void;
}

export const StoryDetails: React.FC<StoryDetailsProps> = ({
  pageCount = 5,
  shouldRhyme = false,
  onUpdate,
  onNext,
  onBack,
  onCancel,
}) => {
  const handlePageCountChange = (value: number) => {
    onUpdate({ pageCount: Math.round(value) });
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
          <View style={styles.sliderContainer}>
            <View style={styles.sliderHeader}>
              <Text style={styles.sliderLabel}>{pageCount} pages</Text>
              <View style={styles.creditCost}>
                <IconSymbol name="sparkles" size={16} color={Colors.primary} />
                <Text style={styles.creditCostText}>{pageCount} credits</Text>
              </View>
            </View>
            <View style={styles.customSlider}>
              <View style={styles.sliderTrack}>
                <View
                  style={[
                    styles.sliderProgress,
                    { width: `${((pageCount - 3) / (10 - 3)) * 100}%` },
                  ]}
                />
              </View>
              <View style={styles.sliderButtons}>
                {[3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={[
                      styles.sliderButton,
                      pageCount === num && styles.sliderButtonActive,
                    ]}
                    onPress={() => handlePageCountChange(num)}
                  >
                    <Text
                      style={[
                        styles.sliderButtonText,
                        pageCount === num && styles.sliderButtonTextActive,
                      ]}
                    >
                      {num}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderEndLabel}>3 pages</Text>
              <Text style={styles.sliderEndLabel}>10 pages</Text>
            </View>
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
  sliderContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    padding: 24,
  },
  sliderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sliderLabel: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: "600",
    color: Colors.primary,
  },
  creditCost: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  creditCostText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
    marginLeft: 6,
  },
  customSlider: {
    marginVertical: 16,
  },
  sliderTrack: {
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 2,
    marginBottom: 16,
  },
  sliderProgress: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  sliderButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sliderButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  sliderButtonActive: {
    backgroundColor: Colors.primary,
  },
  sliderButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  sliderButtonTextActive: {
    color: Colors.background,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  sliderEndLabel: {
    fontSize: isTablet ? 14 : 12,
    color: Colors.textSecondary,
    fontWeight: "500",
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
