import { Colors } from "@/constants/Theme";
import React, { useState } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { WizardContainer } from "../shared/WizardContainer";
import { WizardFooter } from "../shared/WizardFooter";
import { WizardStepHeader } from "../shared/WizardStepHeader";

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

interface IllustrationStyle {
  id: string;
  name: string;
  description: string;
}

const ILLUSTRATION_STYLES: IllustrationStyle[] = [
  {
    id: "watercolor",
    name: "Watercolor",
    description: "Soft, dreamy paintings",
  },
  {
    id: "cartoon",
    name: "Cartoon",
    description: "Playful, colorful drawings",
  },
  {
    id: "realistic",
    name: "Realistic",
    description: "Detailed, lifelike art",
  },
  {
    id: "minimalist",
    name: "Minimalist",
    description: "Simple, clean designs",
  },
  {
    id: "custom",
    name: "Custom",
    description: "Create your own unique illustration style",
  },
];

interface IllustrationSelectionProps {
  illustrationStyle: string;
  enableIllustrations?: boolean;
  onUpdate: (data: {
    illustrationStyle?: string;
    enableIllustrations?: boolean;
  }) => void;
  onNext: () => void;
  onBack: () => void;
  onCancel?: () => void;
}

export const IllustrationSelection: React.FC<IllustrationSelectionProps> = ({
  illustrationStyle,
  enableIllustrations = true,
  onUpdate,
  onNext,
  onBack,
  onCancel,
}) => {
  // Check if the current style is a custom one (not in predefined list)
  const isCurrentStyleCustom =
    illustrationStyle &&
    !ILLUSTRATION_STYLES.slice(0, -1).find((s) => s.id === illustrationStyle);

  const [customStyle, setCustomStyle] = useState(
    isCurrentStyleCustom ? illustrationStyle : ""
  );
  const [isCustomStyleSelected, setIsCustomStyleSelected] = useState(
    isCurrentStyleCustom || illustrationStyle === "custom"
  );

  const handleStyleSelect = (selectedStyle: string) => {
    if (selectedStyle === "custom") {
      setIsCustomStyleSelected(true);
      // If there's custom text, use it; otherwise use "custom" as placeholder
      onUpdate({ illustrationStyle: customStyle.trim() || "custom" });
    } else {
      setIsCustomStyleSelected(false);
      setCustomStyle(""); // Clear custom style when selecting predefined
      onUpdate({ illustrationStyle: selectedStyle });
    }
  };

  const handleIllustrationsToggle = (value: boolean) => {
    onUpdate({ enableIllustrations: value });
  };

  const handleCustomStyleChange = (text: string) => {
    setCustomStyle(text);
    if (isCustomStyleSelected) {
      // Update the selection with the typed text
      onUpdate({ illustrationStyle: text.trim() || "custom" });
    }
  };

  return (
    <WizardContainer>
      <WizardStepHeader
        title="Illustrations"
        subtitle="Choose the perfect illustration style for your story"
        stepNumber={7}
        totalSteps={7}
        onBack={onBack}
        onCancel={onCancel}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <View style={styles.toggleSection}>
            <View style={styles.toggleInfo}>
              <Text style={styles.sectionTitle}>Add illustrations</Text>
              <View style={styles.descriptionRow}>
                <Text style={styles.toggleDescription}>
                  Add beautiful AI-generated illustrations to your story
                </Text>
                <Switch
                  value={enableIllustrations}
                  onValueChange={handleIllustrationsToggle}
                  trackColor={{
                    false: "#374151",
                    true: "rgba(212, 175, 55, 0.3)",
                  }}
                  thumbColor={
                    enableIllustrations ? Colors.primary : Colors.textSecondary
                  }
                />
              </View>
            </View>
          </View>

          {enableIllustrations && (
            <>
              <Text style={styles.subSectionTitle}>
                Choose an illustration style
              </Text>
              <View
                style={isTablet ? styles.stylesListTablet : styles.stylesList}
              >
                {ILLUSTRATION_STYLES.map((style) => {
                  const isSelected =
                    style.id === "custom"
                      ? isCustomStyleSelected
                      : style.id === illustrationStyle &&
                        !isCustomStyleSelected;

                  return (
                    <TouchableOpacity
                      key={style.id}
                      style={[
                        isTablet
                          ? styles.styleListCardTablet
                          : styles.styleListCard,
                        isSelected && styles.selectedCard,
                      ]}
                      onPress={() => handleStyleSelect(style.id)}
                    >
                      <View style={styles.styleInfo}>
                        <Text
                          style={[
                            styles.styleName,
                            isSelected && styles.selectedText,
                          ]}
                        >
                          {style.name}
                        </Text>
                        <Text
                          style={[
                            styles.styleDescription,
                            isSelected && styles.selectedDescription,
                          ]}
                        >
                          {style.id === "custom" && customStyle
                            ? customStyle
                            : style.description}
                        </Text>
                      </View>
                      {isSelected && (
                        <View style={styles.checkmark}>
                          <Text style={styles.checkmarkText}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {isCustomStyleSelected && (
                <View style={styles.customInputContainer}>
                  <TextInput
                    style={styles.customInput}
                    placeholder="E.g. vintage comic book style, hand-drawn sketches..."
                    placeholderTextColor={Colors.textSecondary}
                    value={customStyle}
                    onChangeText={handleCustomStyleChange}
                    returnKeyType="done"
                    autoFocus={!customStyle}
                    multiline
                  />
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      <WizardFooter onNext={onNext} nextText="Create story" />
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
    marginBottom: 8,
  },
  stylesList: {
    gap: 12,
  },
  stylesListTablet: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginHorizontal: -6,
  },
  styleListCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: "transparent",
  },
  styleListCardTablet: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: "transparent",
    width: "48%",
    marginHorizontal: 6,
  },
  selectedCard: {
    backgroundColor: "rgba(212, 175, 55, 0.2)",
    borderColor: Colors.primary,
  },
  styleInfo: {
    flex: 1,
  },
  styleName: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
  },
  styleDescription: {
    fontSize: isTablet ? 15 : 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  selectedText: {
    color: Colors.primary,
  },
  selectedDescription: {
    color: Colors.primary,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  checkmarkText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "bold",
  },
  toggleSection: {
    marginBottom: 24,
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
  subSectionTitle: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: "600",
    color: Colors.primary,
    marginBottom: 12,
    marginTop: 8,
  },
  customInputContainer: {
    marginTop: 12,
  },
  customInput: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
    minHeight: 80,
  },
});
