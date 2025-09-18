import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors, Spacing, Typography } from "../../constants/Theme";
import { TEXT_MODELS, IMAGE_MODELS } from "../../constants/Models";
import type { AdvancedSettingsSectionProps } from "./types";

export function AdvancedSettingsSection({
  isAdmin,
  preferences,
  onUpdatePreferences,
}: AdvancedSettingsSectionProps) {
  if (!isAdmin) return null;

  return (
    <View style={styles.section}>
      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Story text model</Text>
        <View style={styles.modelOptions}>
          <TouchableOpacity
            style={[
              styles.modelOption,
              preferences.textModel === TEXT_MODELS.GPT_4O &&
                styles.selectedModelOption,
            ]}
            onPress={() =>
              onUpdatePreferences({ textModel: TEXT_MODELS.GPT_4O })
            }
          >
            <Text
              style={[
                styles.modelOptionText,
                preferences.textModel === TEXT_MODELS.GPT_4O &&
                  styles.selectedModelOptionText,
              ]}
            >
              {TEXT_MODELS.GPT_4O}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modelOption,
              preferences.textModel === TEXT_MODELS.GEMINI_2_5_PRO &&
                styles.selectedModelOption,
            ]}
            onPress={() =>
              onUpdatePreferences({ textModel: TEXT_MODELS.GEMINI_2_5_PRO })
            }
          >
            <Text
              style={[
                styles.modelOptionText,
                preferences.textModel === TEXT_MODELS.GEMINI_2_5_PRO &&
                  styles.selectedModelOptionText,
              ]}
            >
              {TEXT_MODELS.GEMINI_2_5_PRO}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {preferences.textModel === TEXT_MODELS.GEMINI_2_5_PRO && (
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Gemini thinking budget</Text>
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
              onPress={() => onUpdatePreferences({ geminiThinkingBudget: -1 })}
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
              onPress={() => onUpdatePreferences({ geminiThinkingBudget: 128 })}
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
        <Text style={styles.settingLabel}>Cover image model</Text>
        <View style={styles.modelOptions}>
          <TouchableOpacity
            style={[
              styles.modelOption,
              preferences.coverImageModel === IMAGE_MODELS.GPT_IMAGE_1 &&
                styles.selectedModelOption,
            ]}
            onPress={() =>
              onUpdatePreferences({ coverImageModel: IMAGE_MODELS.GPT_IMAGE_1 })
            }
          >
            <Text
              style={[
                styles.modelOptionText,
                preferences.coverImageModel === IMAGE_MODELS.GPT_IMAGE_1 &&
                  styles.selectedModelOptionText,
              ]}
            >
              {IMAGE_MODELS.GPT_IMAGE_1}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modelOption,
              preferences.coverImageModel ===
                IMAGE_MODELS.GEMINI_2_5_FLASH_IMAGE_PREVIEW &&
                styles.selectedModelOption,
            ]}
            onPress={() =>
              onUpdatePreferences({
                coverImageModel: IMAGE_MODELS.GEMINI_2_5_FLASH_IMAGE_PREVIEW,
              })
            }
          >
            <Text
              style={[
                styles.modelOptionText,
                preferences.coverImageModel ===
                  IMAGE_MODELS.GEMINI_2_5_FLASH_IMAGE_PREVIEW &&
                  styles.selectedModelOptionText,
              ]}
            >
              {IMAGE_MODELS.GEMINI_2_5_FLASH_IMAGE_PREVIEW}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Page image model</Text>
        <View style={styles.modelOptions}>
          <TouchableOpacity
            style={[
              styles.modelOption,
              preferences.pageImageModel === IMAGE_MODELS.GPT_IMAGE_1 &&
                styles.selectedModelOption,
            ]}
            onPress={() =>
              onUpdatePreferences({ pageImageModel: IMAGE_MODELS.GPT_IMAGE_1 })
            }
          >
            <Text
              style={[
                styles.modelOptionText,
                preferences.pageImageModel === IMAGE_MODELS.GPT_IMAGE_1 &&
                  styles.selectedModelOptionText,
              ]}
            >
              {IMAGE_MODELS.GPT_IMAGE_1}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modelOption,
              preferences.pageImageModel ===
                IMAGE_MODELS.GEMINI_2_5_FLASH_IMAGE_PREVIEW &&
                styles.selectedModelOption,
            ]}
            onPress={() =>
              onUpdatePreferences({
                pageImageModel: IMAGE_MODELS.GEMINI_2_5_FLASH_IMAGE_PREVIEW,
              })
            }
          >
            <Text
              style={[
                styles.modelOptionText,
                preferences.pageImageModel ===
                  IMAGE_MODELS.GEMINI_2_5_FLASH_IMAGE_PREVIEW &&
                  styles.selectedModelOptionText,
              ]}
            >
              {IMAGE_MODELS.GEMINI_2_5_FLASH_IMAGE_PREVIEW}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.xxxl,
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
