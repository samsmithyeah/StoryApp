import { IconSymbol } from "@/components/ui/IconSymbol";
import { Shadows } from "@/constants/Theme";
import { ContentLimits } from "@/constants/ContentLimits";
import { LAYOUT } from "@/constants/Layout";
import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

interface CustomMoodSectionProps {
  customMood: string;
  isCustomMoodSelected: boolean;
  onCustomMoodSelect: () => void;
  onCustomMoodChange: (text: string) => void;
}

export const CustomMoodSection: React.FC<CustomMoodSectionProps> = ({
  customMood,
  isCustomMoodSelected,
  onCustomMoodSelect,
  onCustomMoodChange,
}) => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const styles = StyleSheet.create({
    customSection: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: isTablet ? 20 : 18,
      fontWeight: "600",
      color: "#D4AF37",
      marginBottom: 12,
      textAlign: "left",
    },
    moodListCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      borderRadius: 16,
      padding: 16,
      borderWidth: 2,
      borderColor: "transparent",
      ...(isTablet && { width: LAYOUT.getTabletCustomItemWidth(width) }),
    },
    selectedListCard: {
      backgroundColor: "rgba(212, 175, 55, 0.2)",
      borderColor: "#D4AF37",
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: "#D4AF37",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 16,
    },
    selectedIconContainer: {
      backgroundColor: "#D4AF37",
      ...Shadows.glow,
    },
    unselectedIconContainer: {
      opacity: 0.6,
    },
    moodInfo: {
      flex: 1,
    },
    moodName: {
      fontSize: isTablet ? 18 : 16,
      fontWeight: "600",
      color: "#FFFFFF",
      marginBottom: 4,
    },
    moodDescription: {
      fontSize: isTablet ? 14 : 12,
      color: "#9CA3AF",
      lineHeight: 16,
    },
    selectedText: {
      color: "#D4AF37",
    },
    selectedDescription: {
      color: "#D4AF37",
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
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "bold",
    },
    moodText: {
      fontSize: isTablet ? 18 : 16,
      fontWeight: "500",
      color: "#FFFFFF",
      flex: 1,
    },
    customInput: {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.2)",
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: "#FFFFFF",
      minHeight: 80,
      textAlignVertical: "top",
      ...(isTablet && { width: LAYOUT.getTabletCustomItemWidth(width) }),
    },
    customInputContainer: {
      marginTop: 12,
    },
    placeholderContainer: {
      marginTop: 12,
    },
    placeholderText: {
      fontSize: 14,
      color: "#9CA3AF",
      fontStyle: "italic",
    },
    helperText: {
      fontSize: 14,
      color: "#9CA3AF",
      flex: 1,
    },
    helperContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 8,
    },
    characterCount: {
      fontSize: 12,
      color: "#9CA3AF",
    },
  });

  return (
    <View style={styles.customSection}>
      <Text style={styles.sectionTitle}>Custom mood</Text>

      {/* Custom mood option - always visible */}
      <TouchableOpacity
        style={[
          styles.moodListCard,
          isCustomMoodSelected && styles.selectedListCard,
        ]}
        onPress={onCustomMoodSelect}
      >
        <View
          style={[
            styles.iconContainer,
            isCustomMoodSelected
              ? styles.selectedIconContainer
              : styles.unselectedIconContainer,
          ]}
        >
          <IconSymbol name="pencil" size={24} color="#1a1b3a" />
        </View>
        <View style={styles.moodInfo}>
          <Text
            style={[
              styles.moodName,
              isCustomMoodSelected && styles.selectedText,
            ]}
          >
            Custom mood
          </Text>
          <Text
            style={[
              styles.moodDescription,
              isCustomMoodSelected && styles.selectedDescription,
            ]}
          >
            Choose your own mood
          </Text>
        </View>
        {isCustomMoodSelected && (
          <View style={styles.checkmark}>
            <Text style={styles.checkmarkText}>✓</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Text input - only show when custom mood is selected */}
      {isCustomMoodSelected && (
        <View style={styles.customInputContainer}>
          <TextInput
            style={styles.customInput}
            placeholder="Enter a custom mood..."
            placeholderTextColor="#9CA3AF"
            value={customMood}
            onChangeText={onCustomMoodChange}
            returnKeyType="done"
            autoFocus={!customMood}
            maxLength={ContentLimits.CUSTOM_MOOD_MAX_LENGTH}
          />
          <View style={styles.helperContainer}>
            <Text style={styles.helperText}>
              Examples: "adventurous", "mysterious", "dreamy"
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};
