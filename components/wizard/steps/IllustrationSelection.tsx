import { ContentLimits } from "@/constants/ContentLimits";
import { LAYOUT } from "@/constants/Layout";
import { Colors } from "@/constants/Theme";
import { Analytics } from "@/utils/analytics";
import { filterContent, getFilterErrorMessage } from "@/utils/contentFilter";
import React, { useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
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
// Small spacer so the input clears the header comfortably when focused
const INPUT_FOCUS_SCROLL_PADDING = 40;
// Extra bottom padding on iOS so content doesn't sit under the footer while keyboard is up
const IOS_KEYBOARD_EXTRA_BOTTOM_PADDING = 160;

interface IllustrationStyle {
  id: string;
  name: string;
  description: string;
  aiDescription: string;
  aiDescriptionBackup1?: string;
  aiDescriptionBackup2?: string;
}

const ILLUSTRATION_STYLES: IllustrationStyle[] = [
  // Quentin Blake
  {
    id: "loose-ink-wash",
    name: "Splashy ink & paint",
    description: "Scratchy pen lines with energetic watercolor splashes",
    // aiDescription:
    //   "Loose, scratchy dip-pen lines that feel quick and witty, splashed with unruly watercolor blooms. Lots of white paper, gawky limbs, and a 1970s British picture-book energy—messy, lively, and mid-scribble.",
    aiDescription: "Quentin Blake.",
    aiDescriptionBackup1: "The illustrator of Matilda and The BFG",
    aiDescriptionBackup2:
      "Loose, scratchy dip-pen lines with energetic watercolor splashes. Quick and witty linework with unruly watercolor blooms. Lots of white paper, gawky limbs, and lively mid-scribble energy.",
  },
  // Axel Scheffler
  {
    id: "bold-outline-flat-color",
    name: "Big bold lines",
    description: "Thick black lines, bright flats, friendly character shapes",
    // aiDescription:
    //   "Confident, uniform black outlines around chunky, friendly characters; bright flat fills, minimal shading. Clean European storybook vibe from the late '90s/early 2000s where a certain woodland monster might lurk.",
    aiDescription: "Axel Scheffler inspired",
    aiDescriptionBackup1: "The illustrator of the Gruffalo and Zog",
    aiDescriptionBackup2:
      "Confident, uniform black outlines around chunky, friendly characters. Bright flat color fills with minimal shading. Clean European storybook style with friendly woodland creatures.",
  },
  // Anthony Browne
  {
    id: "surreal-painterly-realism",
    name: "Dreamy realism",
    description: "Detailed realism with odd, dreamlike twists",
    // aiDescription:
    //   "Smooth, carefully modeled realism with soft gradients and theatrical lighting, yet peppered with subtle surreal clues—hidden faces, bananas, warped scale. Feels like psychologically rich 1980s UK picture books.",
    aiDescription: "Anthony Browne inspired",
    aiDescriptionBackup1: "The illustrator of Gorilla and Willy the Wimp",
    aiDescriptionBackup2:
      "Smooth, carefully modeled realism with soft gradients and theatrical lighting. Subtle surreal elements and dreamlike details. Psychologically rich illustrations with hidden visual clues.",
  },
  // Maurice Sendak
  {
    id: "classic-crosshatch-storybook",
    name: "Vintage storybook",
    description: "Fine pen shading, muted palettes, vintage picture-book feel",
    // aiDescription:
    //   "Fine pen-and-ink crosshatching, stippling, and muted watercolor washes. Cozy-but-wild mid-century American picture-book mood, where a rumpus could break out any minute.",
    aiDescription: "Maurice Sendak.",
    aiDescriptionBackup1: "The illustrator of Where the Wild Things Are",
    aiDescriptionBackup2:
      "Fine pen-and-ink crosshatching and stippling with muted watercolor washes. Mid-century American picture-book style with cozy yet wild energy.",
  },
  // Beatrix Potter
  {
    id: "delicate-botanical-watercolour",
    name: "Gentle watercolours",
    description:
      "Soft washes, naturalistic animals and plants, gentle nostalgia",
    // aiDescription:
    //   "Pastel watercolour washes and precise naturalist drawing of small countryside creatures and flora. Early 1900s English cottage-garden gentleness, porcelain-teacup delicate.",
    aiDescription: "Beatrix Potter.",
    aiDescriptionBackup1: "The illustrator of Peter Rabbit",
    aiDescriptionBackup2:
      "Pastel watercolor washes with precise naturalist drawing of small countryside creatures and flora. Early 1900s English cottage-garden gentleness, delicate and nostalgic.",
  },
  // Dr. Seuss
  {
    id: "wonky-rhythmic-whimsy",
    name: "Wiggly whimsy",
    description: "Curvy, off-kilter shapes and playful chaos",
    // aiDescription:
    //   "Elastic, curvilinear architecture, striped patterns. Limited punchy palettes and nonsense machines—pure mid-century American wonkiness and absurdity.",
    aiDescription: "Dr. Seuss.",
    aiDescriptionBackup1: "The illustrator of The Cat in the Hat",
    aiDescriptionBackup2:
      "Elastic, curvilinear architecture with striped patterns. Limited punchy color palettes and whimsical nonsense machines. Mid-century American wonkiness and playful absurdity.",
  },
  // Oliver Jeffers
  {
    id: "naive-textured-brushwork",
    name: "Scribbly paint & pencil",
    description: "Childlike marks, visible brush texture, handwritten notes",
    // aiDescription:
    //   "Intentionally wobbly linework with visible brush and pencil texture, hand-lettered notes, and roomy negative space. Contemporary Irish/American picture-book feel—simple shapes but big heart.",
    aiDescription: "Oliver Jeffers.",
    aiDescriptionBackup1:
      "The illustrator of Lost and Found and How to Catch a Star",
    aiDescriptionBackup2:
      "Intentionally wobbly linework with visible brush and pencil texture. Hand-lettered notes and roomy negative space. Contemporary picture-book style with simple shapes and heartfelt emotion.",
  },
  // Jon Klassen
  {
    id: "deadpan-minimal-graphic",
    name: "Quiet & simple",
    description:
      "Muted earth tones, simple shapes, tiny eyes & big negative space",
    // aiDescription:
    //   "Flat, graphic shapes in hushed earth tones, subtle paper textures, and lots of negative space. Characters with dot eyes and bone-dry humor—modern North American deadpan minimalism.",
    aiDescription: "Jon Klassen.",
    aiDescriptionBackup1: "The illustrator of I Want My Hat Back",
    aiDescriptionBackup2:
      "Flat, graphic shapes in hushed earth tones with subtle paper textures and lots of negative space. Characters with dot eyes and understated humor. Modern deadpan minimalism.",
  },
  // E. H. Shepard
  {
    id: "fine-ink-soft-wash",
    name: "Fine ink & tint",
    description: "Precise pen contours, light watercolour tints, gentle charm",
    // aiDescription:
    //   "Elegant, controlled pen contours with light transparent washes, capturing gentle motion. Early 20th-century English nursery classic energy—tea-stained nostalgia and soft woodland rambles.",
    aiDescription: "E. H. Shepard.",
    aiDescriptionBackup1: "The illustrator of Winnie-the-Pooh",
    aiDescriptionBackup2:
      "Elegant, controlled pen contours with light transparent washes that capture gentle motion. Early 20th-century English nursery classic style with tea-stained nostalgia and soft woodland charm.",
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
  onUpdate: (data: {
    illustrationStyle?: string;
    illustrationAiDescription?: string;
    illustrationAiDescriptionBackup1?: string;
    illustrationAiDescriptionBackup2?: string;
  }) => void;
  onNext: () => void;
  onBack: () => void;
  onCancel?: () => void;
}

export const IllustrationSelection: React.FC<IllustrationSelectionProps> = ({
  illustrationStyle,
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
      // Track custom illustration style selection
      Analytics.logWizardIllustrationStyleSelected({
        style_type: "custom",
        style_value: customStyle.trim() || "empty",
      });

      setIsCustomStyleSelected(true);
      // If there's custom text, use it; otherwise use "custom" as placeholder
      onUpdate({
        illustrationStyle: customStyle.trim() || " ",
        illustrationAiDescription: customStyle.trim(),
      });
    } else {
      // Track preset illustration style selection
      Analytics.logWizardIllustrationStyleSelected({
        style_type: "preset",
        style_value: selectedStyle,
      });

      setIsCustomStyleSelected(false);
      setCustomStyle(""); // Clear custom style when selecting predefined
      const selectedStyleData = ILLUSTRATION_STYLES.find(
        (s) => s.id === selectedStyle
      );
      onUpdate({
        illustrationStyle: selectedStyle,
        illustrationAiDescription: selectedStyleData?.aiDescription || "",
        illustrationAiDescriptionBackup1:
          selectedStyleData?.aiDescriptionBackup1 || "",
        illustrationAiDescriptionBackup2:
          selectedStyleData?.aiDescriptionBackup2 || "",
      });
    }
  };

  const handleCustomStyleChange = (text: string) => {
    setCustomStyle(text);
    if (isCustomStyleSelected) {
      // Update the selection with the typed text
      onUpdate({
        illustrationStyle: text.trim() || " ",
        illustrationAiDescription: text.trim(),
      });
    }
  };

  const isNextDisabled = isCustomStyleSelected && !customStyle.trim();

  const handleNext = () => {
    // Validate custom illustration style if it's selected
    if (isCustomStyleSelected && customStyle.trim()) {
      const filterResult = filterContent(customStyle);
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

  // Keyboard-aware scrolling (primarily for iOS)
  const scrollRef = useRef<ScrollView | null>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [customInputOffsetY, setCustomInputOffsetY] = useState(0);

  return (
    <WizardContainer>
      <View onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}>
        <WizardStepHeader
          title="Illustrations"
          subtitle="Choose the perfect illustration style for your story"
          stepNumber={7}
          totalSteps={7}
          onBack={onBack}
          onCancel={onCancel}
        />
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          Platform.OS === "ios" && styles.iosExtraPadding,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
        contentInsetAdjustmentBehavior="always"
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose an illustration style</Text>
          <View style={isTablet ? styles.stylesListTablet : styles.stylesList}>
            {ILLUSTRATION_STYLES.map((style) => {
              const isSelected =
                style.id === "custom"
                  ? isCustomStyleSelected
                  : style.id === illustrationStyle && !isCustomStyleSelected;

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

          {isCustomStyleSelected && (
            <View
              style={styles.customInputContainer}
              onLayout={(e) => setCustomInputOffsetY(e.nativeEvent.layout.y)}
            >
              <TextInput
                style={styles.customInput}
                placeholder="E.g. vintage comic book style, hand-drawn sketches..."
                placeholderTextColor={Colors.textSecondary}
                value={customStyle}
                onChangeText={handleCustomStyleChange}
                returnKeyType="done"
                autoFocus={!customStyle}
                multiline
                maxLength={ContentLimits.CUSTOM_THEME_MAX_LENGTH}
                onFocus={() => {
                  // Align input just below the header (similar to StoryAbout)
                  requestAnimationFrame(() => {
                    const focusOffset =
                      headerHeight + INPUT_FOCUS_SCROLL_PADDING;
                    scrollRef.current?.scrollTo({
                      y: Math.max(0, customInputOffsetY - focusOffset),
                      animated: true,
                    });
                  });
                }}
              />
            </View>
          )}
        </View>
      </ScrollView>

      <WizardFooter
        onNext={handleNext}
        nextText="Create story"
        nextDisabled={isNextDisabled}
      />
    </WizardContainer>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  scrollContent: {},
  iosExtraPadding: {
    paddingBottom: IOS_KEYBOARD_EXTRA_BOTTOM_PADDING,
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
    width: LAYOUT.CARD_WIDTH_PERCENTAGE,
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
    textAlignVertical: "top",
    ...(isTablet && { width: "100%", alignSelf: "stretch" }),
  },
});
