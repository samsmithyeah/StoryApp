import { IconSymbol } from "@/components/ui/IconSymbol";
import { ContentLimits } from "@/constants/ContentLimits";
import { LAYOUT } from "@/constants/Layout";
import { Shadows } from "@/constants/Theme";
import React, { useMemo } from "react";
/* eslint-disable react-native/no-unused-styles */
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

interface CustomThemeSectionProps {
  customTheme: string;
  isCustomThemeSelected: boolean;
  onCustomThemeSelect: () => void;
  onCustomThemeChange: (text: string) => void;
}

export const CustomThemeSection: React.FC<CustomThemeSectionProps> = ({
  customTheme,
  isCustomThemeSelected,
  onCustomThemeSelect,
  onCustomThemeChange,
}) => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const styles = useMemo(
    () =>
      StyleSheet.create({
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
        themeListCard: {
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
        themeInfo: {
          flex: 1,
        },
        themeName: {
          fontSize: isTablet ? 18 : 16,
          fontWeight: "600",
          color: "#FFFFFF",
          marginBottom: 4,
        },
        themeDescription: {
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
        themeText: {
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
      }),
    [isTablet, width]
  );

  return (
    <View style={styles.customSection}>
      <Text style={styles.sectionTitle}>Custom theme</Text>

      {/* Custom theme option - always visible */}
      <TouchableOpacity
        style={[
          styles.themeListCard,
          isCustomThemeSelected && styles.selectedListCard,
        ]}
        onPress={onCustomThemeSelect}
      >
        <View
          style={[
            styles.iconContainer,
            isCustomThemeSelected
              ? styles.selectedIconContainer
              : styles.unselectedIconContainer,
          ]}
        >
          <IconSymbol name="paintbrush.fill" size={24} color="#1a1b3a" />
        </View>
        <View style={styles.themeInfo}>
          <Text
            style={[
              styles.themeName,
              isCustomThemeSelected && styles.selectedText,
            ]}
          >
            Custom theme
          </Text>
          <Text
            style={[
              styles.themeDescription,
              isCustomThemeSelected && styles.selectedDescription,
            ]}
          >
            Create your own unique story theme
          </Text>
        </View>
        {isCustomThemeSelected && (
          <View style={styles.checkmark}>
            <Text style={styles.checkmarkText}>✓</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Text input - only show when custom theme is selected */}
      {isCustomThemeSelected && (
        <View style={styles.customInputContainer}>
          <TextInput
            style={styles.customInput}
            placeholder="E.g. Pirates sailing the seven seas..."
            placeholderTextColor="#9CA3AF"
            value={customTheme}
            onChangeText={onCustomThemeChange}
            returnKeyType="done"
            autoFocus={!customTheme}
            maxLength={ContentLimits.CUSTOM_THEME_MAX_LENGTH}
          />
        </View>
      )}
    </View>
  );
};
