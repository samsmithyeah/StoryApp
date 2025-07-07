import { IconSymbol } from "@/components/ui/IconSymbol";
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

interface Length {
  id: "short" | "medium" | "long";
  name: string;
  description: string;
  pages: string;
}

interface IllustrationStyle {
  id: string;
  name: string;
  description: string;
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
];

interface CustomizationStepProps {
  length: "short" | "medium" | "long";
  illustrationStyle: string;
  enableIllustrations?: boolean;
  onUpdate: (data: {
    length?: "short" | "medium" | "long";
    illustrationStyle?: string;
    enableIllustrations?: boolean;
  }) => void;
  onNext: () => void;
  onBack: () => void;
  onCancel?: () => void;
}

export const CustomizationStep: React.FC<CustomizationStepProps> = ({
  length,
  illustrationStyle,
  enableIllustrations = true,
  onUpdate,
  onNext,
  onBack,
  onCancel,
}) => {
  const [customStyle, setCustomStyle] = useState("");
  const handleLengthSelect = (selectedLength: "short" | "medium" | "long") => {
    onUpdate({ length: selectedLength });
  };

  const handleStyleSelect = (selectedStyle: string) => {
    onUpdate({ illustrationStyle: selectedStyle });
    setCustomStyle(""); // Clear custom style when selecting predefined
  };

  const handleIllustrationsToggle = (value: boolean) => {
    onUpdate({ enableIllustrations: value });
  };

  const handleCustomStyleSubmit = () => {
    if (customStyle.trim()) {
      onUpdate({ illustrationStyle: customStyle.trim() });
    }
  };

  return (
    <WizardContainer>
      <WizardStepHeader
        title="Customize Story"
        subtitle="Choose the perfect length and illustration style"
        stepNumber={3}
        totalSteps={3}
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
              <Text style={styles.sectionTitle}>Illustrations</Text>
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
                  thumbColor={enableIllustrations ? Colors.primary : Colors.textSecondary}
                />
              </View>
            </View>
          </View>

          {enableIllustrations && (
            <>
              <Text style={styles.subSectionTitle}>Choose a Style</Text>
              <View
                style={isTablet ? styles.stylesListTablet : styles.stylesList}
              >
                {ILLUSTRATION_STYLES.map((style) => {
                  const isSelected =
                    style.id === illustrationStyle && !customStyle;

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
                          {style.description}
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

              <View style={styles.customStyleSection}>
                <Text style={styles.customStyleLabel}>
                  Or describe your own style
                </Text>
                <View style={styles.customStyleInput}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g., vintage comic book style, hand-drawn sketches..."
                    placeholderTextColor={Colors.textSecondary}
                    value={customStyle}
                    onChangeText={setCustomStyle}
                    onSubmitEditing={handleCustomStyleSubmit}
                    returnKeyType="done"
                    multiline
                  />
                  {customStyle.trim() && (
                    <TouchableOpacity
                      style={styles.customStyleButton}
                      onPress={handleCustomStyleSubmit}
                    >
                      <IconSymbol name="checkmark" size={16} color={Colors.primary} />
                    </TouchableOpacity>
                  )}
                </View>
                {customStyle && illustrationStyle === customStyle.trim() && (
                  <View style={styles.customStyleSelected}>
                    <IconSymbol
                      name="checkmark.circle.fill"
                      size={16}
                      color="#10B981"
                    />
                    <Text style={styles.customStyleSelectedText}>
                      Custom style applied
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Footer */}
      <WizardFooter onNext={onNext} nextText="Create Story" />
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
    padding: 16,
    borderWidth: 2,
    borderColor: "transparent",
    position: "relative",
  },
  lengthCardTablet: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: "transparent",
    position: "relative",
  },
  selectedCard: {
    backgroundColor: "rgba(212, 175, 55, 0.2)",
    borderColor: Colors.primary,
  },
  lengthName: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
  },
  lengthDescription: {
    fontSize: isTablet ? 16 : 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  lengthPages: {
    fontSize: isTablet ? 14 : 12,
    fontWeight: "500",
    color: Colors.textSecondary,
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
  selectedIndicator: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
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
  infoSection: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.2)",
  },
  infoText: {
    flex: 1,
    fontSize: isTablet ? 16 : 14,
    color: Colors.primary,
    lineHeight: 20,
  },
  toggleSection: {
    marginBottom: 16,
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
  customStyleSection: {
    marginTop: 20,
  },
  customStyleLabel: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: "500",
    color: Colors.primary,
    marginBottom: 8,
  },
  customStyleInput: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    paddingVertical: 4,
    maxHeight: 80,
  },
  customStyleButton: {
    marginLeft: 8,
    padding: 4,
  },
  customStyleSelected: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 6,
  },
  customStyleSelectedText: {
    fontSize: isTablet ? 14 : 12,
    color: "#10B981",
    fontWeight: "500",
  },
});
