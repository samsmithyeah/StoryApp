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
  aiDescription: string;
}

const ILLUSTRATION_STYLES: IllustrationStyle[] = [
  // Quentin Blake
  {
    id: "loose-ink-wash",
    name: "Splashy Ink & Paint",
    description: "Scratchy pen lines with energetic watercolor splashes",
    aiDescription:
      "Loose, scratchy dip-pen lines that feel quick and witty, splashed with unruly watercolor blooms. Lots of white paper, gawky limbs, and a 1970s British picture-book energy—messy, lively, and mid-scribble.",
  },
  // Axel Scheffler
  {
    id: "bold-outline-flat-color",
    name: "Big Bold Lines",
    description: "Thick black lines, bright flats, friendly character shapes",
    aiDescription:
      "Confident, uniform black outlines around chunky, friendly characters; bright flat fills, minimal shading. Clean European storybook vibe from the late ’90s/early 2000s where a certain woodland monster might lurk.",
  },
  // Anthony Browne
  {
    id: "surreal-painterly-realism",
    name: "Dreamy Realism",
    description: "Detailed realism with odd, dreamlike twists",
    aiDescription:
      "Smooth, carefully modeled realism with soft gradients and theatrical lighting, yet peppered with subtle surreal clues—hidden faces, bananas, warped scale. Feels like psychologically rich 1980s UK picture books.",
  },
  // Maurice Sendak
  {
    id: "classic-crosshatch-storybook",
    name: "Vintage Storybook",
    description: "Fine pen shading, muted palettes, vintage picture-book feel",
    aiDescription:
      "Fine pen-and-ink crosshatching, stippling, and muted watercolor washes. Cozy-but-wild mid-century American picture-book mood, where a rumpus could break out any minute.",
  },
  // Beatrix Potter
  {
    id: "delicate-botanical-watercolour",
    name: "Gentle Watercolours",
    description:
      "Soft washes, naturalistic animals and plants, gentle nostalgia",
    aiDescription:
      "Pastel watercolour washes and precise naturalist drawing of small countryside creatures and flora. Early 1900s English cottage-garden gentleness, porcelain-teacup delicate.",
  },
  // Dr. Seuss
  {
    id: "wonky-rhythmic-whimsy",
    name: "Wiggly Whimsy",
    description:
      "Curvy, off-kilter shapes and rhythmic repetition, playful chaos",
    aiDescription:
      "Elastic, curvilinear architecture, striped patterns, and bouncy rhyme-like repetition. Limited punchy palettes and nonsense machines—pure mid-century American wonkiness and absurdity.",
  },
  // Oliver Jeffers
  {
    id: "naive-textured-brushwork",
    name: "Scribbly Paint & Pencil",
    description: "Childlike marks, visible brush texture, handwritten notes",
    aiDescription:
      "Intentionally wobbly linework with visible brush and pencil texture, hand-lettered notes, and roomy negative space. Contemporary Irish/American picture-book feel—simple shapes but big heart.",
  },
  // Jon Klassen
  {
    id: "deadpan-minimal-graphic",
    name: "Quiet & Simple",
    description:
      "Muted earth tones, simple shapes, tiny eyes & big negative space",
    aiDescription:
      "Flat, graphic shapes in hushed earth tones, subtle paper textures, and lots of negative space. Characters with dot eyes and bone-dry humor—modern North American deadpan minimalism.",
  },
  // E. H. Shepard
  {
    id: "fine-ink-soft-wash",
    name: "Fine Ink & Tint",
    description: "Precise pen contours, light watercolour tints, gentle charm",
    aiDescription:
      "Elegant, controlled pen contours with light transparent washes, capturing gentle motion. Early 20th-century English nursery classic energy—tea-stained nostalgia and soft woodland rambles.",
  },
  {
    id: "custom",
    name: "Custom",
    description: "Create your own unique illustration style",
    aiDescription:
      "User-defined: describe medium, line quality, palette, texture, composition, motifs, era, and mood in detail.",
  },
];

interface IllustrationSelectionProps {
  illustrationStyle: string;
  enableIllustrations?: boolean;
  onUpdate: (data: {
    illustrationStyle?: string;
    illustrationAiDescription?: string;
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
      onUpdate({
        illustrationStyle: customStyle.trim() || "custom",
        illustrationAiDescription: customStyle.trim(),
      });
    } else {
      setIsCustomStyleSelected(false);
      setCustomStyle(""); // Clear custom style when selecting predefined
      const selectedStyleData = ILLUSTRATION_STYLES.find(
        (s) => s.id === selectedStyle
      );
      onUpdate({
        illustrationStyle: selectedStyle,
        illustrationAiDescription: selectedStyleData?.aiDescription || "",
      });
    }
  };

  const handleIllustrationsToggle = (value: boolean) => {
    onUpdate({ enableIllustrations: value });
  };

  const handleCustomStyleChange = (text: string) => {
    setCustomStyle(text);
    if (isCustomStyleSelected) {
      // Update the selection with the typed text
      onUpdate({
        illustrationStyle: text.trim() || "custom",
        illustrationAiDescription: text.trim(),
      });
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
