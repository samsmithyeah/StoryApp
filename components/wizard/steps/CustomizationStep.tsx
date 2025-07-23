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
  {
    id: "custom",
    name: "Custom",
    description: "Create your own unique illustration style",
  },
];

interface CustomizationStepProps {
  length: "short" | "medium" | "long";
  illustrationStyle: string;
  enableIllustrations?: boolean;
  imageProvider?: "flux" | "gemini";
  textModel?: "gpt-4o" | "gemini-2.5-pro";
  coverImageModel?: "gemini-2.0-flash-preview-image-generation" | "dall-e-3" | "gpt-image-1";
  onUpdate: (data: {
    length?: "short" | "medium" | "long";
    illustrationStyle?: string;
    enableIllustrations?: boolean;
    imageProvider?: "flux" | "gemini";
    textModel?: "gpt-4o" | "gemini-2.5-pro";
    coverImageModel?: "gemini-2.0-flash-preview-image-generation" | "dall-e-3" | "gpt-image-1";
  }) => void;
  onNext: () => void;
  onBack: () => void;
  onCancel?: () => void;
}

export const CustomizationStep: React.FC<CustomizationStepProps> = ({
  length,
  illustrationStyle,
  enableIllustrations = true,
  imageProvider = "flux",
  textModel = "gpt-4o",
  coverImageModel = "gemini-2.0-flash-preview-image-generation",
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

  const handleLengthSelect = (selectedLength: "short" | "medium" | "long") => {
    onUpdate({ length: selectedLength });
  };

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

  const handleImageProviderSelect = (provider: "flux" | "gemini") => {
    onUpdate({ imageProvider: provider });
  };

  const handleTextModelSelect = (model: "gpt-4o" | "gemini-2.5-pro") => {
    onUpdate({ textModel: model });
  };

  const handleCoverImageModelSelect = (model: "gemini-2.0-flash-preview-image-generation" | "dall-e-3" | "gpt-image-1") => {
    onUpdate({ coverImageModel: model });
  };

  return (
    <WizardContainer>
      <WizardStepHeader
        title="Customise story"
        subtitle="Choose the perfect length and illustration style"
        stepNumber={6}
        totalSteps={6}
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

              <Text style={styles.subSectionTitle}>
                Image Generation Engine
              </Text>
              <View style={styles.providerContainer}>
                <TouchableOpacity
                  style={[
                    styles.providerCard,
                    imageProvider === "flux" && styles.selectedCard,
                  ]}
                  onPress={() => handleImageProviderSelect("flux")}
                >
                  <View style={styles.providerInfo}>
                    <Text
                      style={[
                        styles.providerName,
                        imageProvider === "flux" && styles.selectedText,
                      ]}
                    >
                      FLUX
                    </Text>
                    <Text
                      style={[
                        styles.providerDescription,
                        imageProvider === "flux" && styles.selectedDescription,
                      ]}
                    >
                      High-quality, realistic images with excellent detail
                    </Text>
                  </View>
                  {imageProvider === "flux" && (
                    <View style={styles.checkmark}>
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.providerCard,
                    imageProvider === "gemini" && styles.selectedCard,
                  ]}
                  onPress={() => handleImageProviderSelect("gemini")}
                >
                  <View style={styles.providerInfo}>
                    <Text
                      style={[
                        styles.providerName,
                        imageProvider === "gemini" && styles.selectedText,
                      ]}
                    >
                      Gemini
                    </Text>
                    <Text
                      style={[
                        styles.providerDescription,
                        imageProvider === "gemini" &&
                          styles.selectedDescription,
                      ]}
                    >
                      Fast generation with excellent character consistency
                    </Text>
                  </View>
                  {imageProvider === "gemini" && (
                    <View style={styles.checkmark}>
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Text Generation Model</Text>
          <View style={styles.providerContainer}>
            <TouchableOpacity
              style={[
                styles.providerCard,
                textModel === "gpt-4o" && styles.selectedCard,
              ]}
              onPress={() => handleTextModelSelect("gpt-4o")}
            >
              <View style={styles.providerInfo}>
                <Text
                  style={[
                    styles.providerName,
                    textModel === "gpt-4o" && styles.selectedText,
                  ]}
                >
                  GPT-4o
                </Text>
                <Text
                  style={[
                    styles.providerDescription,
                    textModel === "gpt-4o" && styles.selectedDescription,
                  ]}
                >
                  OpenAI's latest model for creative storytelling
                </Text>
              </View>
              {textModel === "gpt-4o" && (
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.providerCard,
                textModel === "gemini-2.5-pro" && styles.selectedCard,
              ]}
              onPress={() => handleTextModelSelect("gemini-2.5-pro")}
            >
              <View style={styles.providerInfo}>
                <Text
                  style={[
                    styles.providerName,
                    textModel === "gemini-2.5-pro" && styles.selectedText,
                  ]}
                >
                  Gemini 2.5 Pro
                </Text>
                <Text
                  style={[
                    styles.providerDescription,
                    textModel === "gemini-2.5-pro" && styles.selectedDescription,
                  ]}
                >
                  Google's advanced reasoning model for complex narratives
                </Text>
              </View>
              {textModel === "gemini-2.5-pro" && (
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cover Image Model</Text>
          <View style={styles.providerContainer}>
            <TouchableOpacity
              style={[
                styles.providerCard,
                coverImageModel === "gemini-2.0-flash-preview-image-generation" && styles.selectedCard,
              ]}
              onPress={() => handleCoverImageModelSelect("gemini-2.0-flash-preview-image-generation")}
            >
              <View style={styles.providerInfo}>
                <Text
                  style={[
                    styles.providerName,
                    coverImageModel === "gemini-2.0-flash-preview-image-generation" && styles.selectedText,
                  ]}
                >
                  Gemini Image
                </Text>
                <Text
                  style={[
                    styles.providerDescription,
                    coverImageModel === "gemini-2.0-flash-preview-image-generation" && styles.selectedDescription,
                  ]}
                >
                  Current model - reliable character consistency
                </Text>
              </View>
              {coverImageModel === "gemini-2.0-flash-preview-image-generation" && (
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.providerCard,
                coverImageModel === "dall-e-3" && styles.selectedCard,
              ]}
              onPress={() => handleCoverImageModelSelect("dall-e-3")}
            >
              <View style={styles.providerInfo}>
                <Text
                  style={[
                    styles.providerName,
                    coverImageModel === "dall-e-3" && styles.selectedText,
                  ]}
                >
                  DALL-E 3
                </Text>
                <Text
                  style={[
                    styles.providerDescription,
                    coverImageModel === "dall-e-3" && styles.selectedDescription,
                  ]}
                >
                  OpenAI's premium image generation with artistic detail
                </Text>
              </View>
              {coverImageModel === "dall-e-3" && (
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.providerCard,
                coverImageModel === "gpt-image-1" && styles.selectedCard,
              ]}
              onPress={() => handleCoverImageModelSelect("gpt-image-1")}
            >
              <View style={styles.providerInfo}>
                <Text
                  style={[
                    styles.providerName,
                    coverImageModel === "gpt-image-1" && styles.selectedText,
                  ]}
                >
                  GPT Image-1
                </Text>
                <Text
                  style={[
                    styles.providerDescription,
                    coverImageModel === "gpt-image-1" && styles.selectedDescription,
                  ]}
                >
                  OpenAI's latest experimental image model
                </Text>
              </View>
              {coverImageModel === "gpt-image-1" && (
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
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
  providerContainer: {
    gap: 12,
    marginTop: 8,
  },
  providerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: "transparent",
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
  },
  providerDescription: {
    fontSize: isTablet ? 15 : 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
