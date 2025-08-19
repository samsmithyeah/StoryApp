import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { IconSymbol } from "../ui/IconSymbol";
import { Colors, Spacing, Typography } from "../../constants/Theme";
import type { AdvancedSettingsSectionProps } from "./types";

export function AdvancedSettingsSection({
  isAdmin,
  preferences,
  onUpdatePreferences,
}: AdvancedSettingsSectionProps) {
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  if (!isAdmin) return null;

  return (
    <View style={styles.section}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => setShowAdvancedSettings(!showAdvancedSettings)}
      >
        <View>
          <Text style={styles.sectionTitle}>Advanced Settings</Text>
          <Text style={styles.sectionDescription}>
            Configure AI model preferences
          </Text>
        </View>
        <IconSymbol
          name={showAdvancedSettings ? "chevron.up" : "chevron.down"}
          size={20}
          color={Colors.textSecondary}
        />
      </TouchableOpacity>

      {showAdvancedSettings && (
        <View style={styles.advancedSettingsContent}>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Story Text Model</Text>
            <View style={styles.modelOptions}>
              <TouchableOpacity
                style={[
                  styles.modelOption,
                  preferences.textModel === "gpt-4o" &&
                    styles.selectedModelOption,
                ]}
                onPress={() => onUpdatePreferences({ textModel: "gpt-4o" })}
              >
                <Text
                  style={[
                    styles.modelOptionText,
                    preferences.textModel === "gpt-4o" &&
                      styles.selectedModelOptionText,
                  ]}
                >
                  GPT-4o
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modelOption,
                  preferences.textModel === "gemini-2.5-pro" &&
                    styles.selectedModelOption,
                ]}
                onPress={() =>
                  onUpdatePreferences({ textModel: "gemini-2.5-pro" })
                }
              >
                <Text
                  style={[
                    styles.modelOptionText,
                    preferences.textModel === "gemini-2.5-pro" &&
                      styles.selectedModelOptionText,
                  ]}
                >
                  Gemini 2.5 Pro
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {preferences.textModel === "gemini-2.5-pro" && (
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Gemini Thinking Budget</Text>
              <Text style={styles.settingDescription}>
                Control how much reasoning the model applies to complex tasks
              </Text>
              <View style={styles.modelOptions}>
                <TouchableOpacity
                  style={[
                    styles.modelOption,
                    preferences.geminiThinkingBudget === -1 &&
                      styles.selectedModelOption,
                  ]}
                  onPress={() =>
                    onUpdatePreferences({ geminiThinkingBudget: -1 })
                  }
                >
                  <Text
                    style={[
                      styles.modelOptionText,
                      preferences.geminiThinkingBudget === -1 &&
                        styles.selectedModelOptionText,
                    ]}
                  >
                    Dynamic
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modelOption,
                    preferences.geminiThinkingBudget === 128 &&
                      styles.selectedModelOption,
                  ]}
                  onPress={() =>
                    onUpdatePreferences({ geminiThinkingBudget: 128 })
                  }
                >
                  <Text
                    style={[
                      styles.modelOptionText,
                      preferences.geminiThinkingBudget === 128 &&
                        styles.selectedModelOptionText,
                    ]}
                  >
                    Minimal (128)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modelOption,
                    preferences.geminiThinkingBudget === 1024 &&
                      styles.selectedModelOption,
                  ]}
                  onPress={() =>
                    onUpdatePreferences({ geminiThinkingBudget: 1024 })
                  }
                >
                  <Text
                    style={[
                      styles.modelOptionText,
                      preferences.geminiThinkingBudget === 1024 &&
                        styles.selectedModelOptionText,
                    ]}
                  >
                    Low (1024)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modelOption,
                    preferences.geminiThinkingBudget === 4096 &&
                      styles.selectedModelOption,
                  ]}
                  onPress={() =>
                    onUpdatePreferences({ geminiThinkingBudget: 4096 })
                  }
                >
                  <Text
                    style={[
                      styles.modelOptionText,
                      preferences.geminiThinkingBudget === 4096 &&
                        styles.selectedModelOptionText,
                    ]}
                  >
                    Medium (4096)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modelOption,
                    preferences.geminiThinkingBudget === 16384 &&
                      styles.selectedModelOption,
                  ]}
                  onPress={() =>
                    onUpdatePreferences({ geminiThinkingBudget: 16384 })
                  }
                >
                  <Text
                    style={[
                      styles.modelOptionText,
                      preferences.geminiThinkingBudget === 16384 &&
                        styles.selectedModelOptionText,
                    ]}
                  >
                    High (16384)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Temperature</Text>
            <Text style={styles.settingDescription}>
              Controls creativity and randomness (0.1 - 2.0)
            </Text>
            <TextInput
              style={styles.temperatureInput}
              value={preferences.temperature.toString()}
              onChangeText={(text) => {
                const value = parseFloat(text);
                if (!isNaN(value) && value >= 0.1 && value <= 2.0) {
                  onUpdatePreferences({ temperature: value });
                }
              }}
              keyboardType="decimal-pad"
              placeholder="0.9"
              placeholderTextColor={Colors.textSecondary}
            />
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Cover Image Model</Text>
            <View style={styles.modelOptions}>
              <TouchableOpacity
                style={[
                  styles.modelOption,
                  preferences.coverImageModel === "gpt-image-1" &&
                    styles.selectedModelOption,
                ]}
                onPress={() =>
                  onUpdatePreferences({ coverImageModel: "gpt-image-1" })
                }
              >
                <Text
                  style={[
                    styles.modelOptionText,
                    preferences.coverImageModel === "gpt-image-1" &&
                      styles.selectedModelOptionText,
                  ]}
                >
                  GPT Image-1
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modelOption,
                  preferences.coverImageModel === "dall-e-3" &&
                    styles.selectedModelOption,
                ]}
                onPress={() =>
                  onUpdatePreferences({ coverImageModel: "dall-e-3" })
                }
              >
                <Text
                  style={[
                    styles.modelOptionText,
                    preferences.coverImageModel === "dall-e-3" &&
                      styles.selectedModelOptionText,
                  ]}
                >
                  DALL-E 3
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modelOption,
                  preferences.coverImageModel ===
                    "gemini-2.0-flash-preview-image-generation" &&
                    styles.selectedModelOption,
                ]}
                onPress={() =>
                  onUpdatePreferences({
                    coverImageModel:
                      "gemini-2.0-flash-preview-image-generation",
                  })
                }
              >
                <Text
                  style={[
                    styles.modelOptionText,
                    preferences.coverImageModel ===
                      "gemini-2.0-flash-preview-image-generation" &&
                      styles.selectedModelOptionText,
                  ]}
                >
                  Gemini
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Page Image Model</Text>
            <View style={styles.modelOptions}>
              <TouchableOpacity
                style={[
                  styles.modelOption,
                  preferences.pageImageModel === "gpt-image-1" &&
                    styles.selectedModelOption,
                ]}
                onPress={() =>
                  onUpdatePreferences({ pageImageModel: "gpt-image-1" })
                }
              >
                <Text
                  style={[
                    styles.modelOptionText,
                    preferences.pageImageModel === "gpt-image-1" &&
                      styles.selectedModelOptionText,
                  ]}
                >
                  GPT Image-1
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modelOption,
                  preferences.pageImageModel === "flux" &&
                    styles.selectedModelOption,
                ]}
                onPress={() => onUpdatePreferences({ pageImageModel: "flux" })}
              >
                <Text
                  style={[
                    styles.modelOptionText,
                    preferences.pageImageModel === "flux" &&
                      styles.selectedModelOptionText,
                  ]}
                >
                  FLUX
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modelOption,
                  preferences.pageImageModel === "gemini" &&
                    styles.selectedModelOption,
                ]}
                onPress={() =>
                  onUpdatePreferences({ pageImageModel: "gemini" })
                }
              >
                <Text
                  style={[
                    styles.modelOptionText,
                    preferences.pageImageModel === "gemini" &&
                      styles.selectedModelOptionText,
                  ]}
                >
                  Gemini
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.xxxl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary,
    marginBottom: Spacing.xs,
    fontFamily: Typography.fontFamily.primary,
  },
  sectionDescription: {
    fontSize: Typography.fontSize.small,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  advancedSettingsContent: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "rgba(212, 175, 55, 0.2)",
  },
  settingItem: {
    marginBottom: Spacing.xl,
  },
  settingLabel: {
    fontSize: Typography.fontSize.medium,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  settingDescription: {
    fontSize: Typography.fontSize.small,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  modelOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  modelOption: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  selectedModelOption: {
    backgroundColor: "rgba(212, 175, 55, 0.2)",
    borderColor: Colors.primary,
  },
  modelOptionText: {
    fontSize: Typography.fontSize.small,
    color: Colors.textSecondary,
  },
  selectedModelOptionText: {
    color: Colors.primary,
    fontWeight: Typography.fontWeight.semibold,
  },
  temperatureInput: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.medium,
    color: Colors.text,
    marginTop: Spacing.sm,
    maxWidth: 120,
  },
});
