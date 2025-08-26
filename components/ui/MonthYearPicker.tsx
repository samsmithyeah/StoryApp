import React, { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  BorderRadius,
  Colors,
  Shadows,
  Spacing,
  Typography,
} from "../../constants/Theme";
import { logger } from "../../utils/logger";
import { Button } from "./Button";
import { CloseButton } from "./CloseButton";
import { IconSymbol } from "./IconSymbol";

interface MonthYearPickerProps {
  label?: string;
  value?: Date;
  onChange: (date: Date) => void;
  placeholder?: string;
  maximumDate?: Date;
  minimumDate?: Date;
  leftIcon?: string;
  style?: any;
  error?: string;
  optional?: boolean;
}

export const MonthYearPicker: React.FC<MonthYearPickerProps> = ({
  label,
  value,
  onChange,
  placeholder = "Select month and year",
  maximumDate,
  minimumDate,
  leftIcon,
  style,
  error,
  optional = false,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(
    value?.getMonth() ?? new Date().getMonth()
  );
  const [selectedYear, setSelectedYear] = useState(
    value?.getFullYear() ?? new Date().getFullYear()
  );

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const formatMonthYear = (date: Date) => {
    // Handle invalid dates
    if (!date || isNaN(date.getTime())) {
      return "";
    }
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
  };

  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const minYear = minimumDate ? minimumDate.getFullYear() : currentYear - 18;
    const maxYear = maximumDate ? maximumDate.getFullYear() : currentYear;

    logger.debug("generateYears called", {
      currentYear,
      minYear,
      maxYear,
    });

    const years = [];
    for (let year = maxYear; year >= minYear; year--) {
      years.push(year);
    }

    return years;
  };

  const handleConfirm = () => {
    const newDate = new Date(selectedYear, selectedMonth, 1);
    onChange(newDate);
    setShowPicker(false);
  };

  const handleCancel = () => {
    if (value) {
      setSelectedMonth(value.getMonth());
      setSelectedYear(value.getFullYear());
    }
    setShowPicker(false);
  };

  return (
    <View style={[styles.container, style]}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{label}</Text>
          {optional && <Text style={styles.optionalText}>(optional)</Text>}
        </View>
      )}

      <TouchableOpacity
        style={[styles.input, error && styles.inputError]}
        onPress={() => setShowPicker(true)}
      >
        {leftIcon && (
          <View style={styles.iconContainer}>
            <IconSymbol name={leftIcon} size={20} color={Colors.textMuted} />
          </View>
        )}

        {(() => {
          const formatted = value ? formatMonthYear(value) : "";
          const hasValidDate = formatted.length > 0;
          return (
            <Text style={[styles.text, !hasValidDate && styles.placeholder]}>
              {hasValidDate ? formatted : placeholder}
            </Text>
          );
        })()}

        <IconSymbol name="chevron.down" size={16} color={Colors.textMuted} />
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={showPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select month & year</Text>
              <CloseButton onPress={handleCancel} />
            </View>

            <View style={styles.pickerContainer}>
              <View style={styles.column}>
                <Text style={styles.columnHeader}>Month</Text>
                <ScrollView
                  style={styles.scrollView}
                  showsVerticalScrollIndicator={true}
                >
                  {months.map((month, index) => (
                    <TouchableOpacity
                      key={month}
                      style={[
                        styles.option,
                        selectedMonth === index && styles.selectedOption,
                      ]}
                      onPress={() => setSelectedMonth(index)}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          selectedMonth === index && styles.selectedOptionText,
                        ]}
                      >
                        {month}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.divider} />

              <View style={styles.column}>
                <Text style={styles.columnHeader}>Year</Text>
                <ScrollView
                  style={styles.scrollView}
                  showsVerticalScrollIndicator={true}
                >
                  {generateYears().map((year) => (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.option,
                        selectedYear === year && styles.selectedOption,
                      ]}
                      onPress={() => setSelectedYear(year)}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          selectedYear === year && styles.selectedOptionText,
                        ]}
                      >
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={handleCancel}
                style={styles.cancelButton}
              />
              <Button
                title="Confirm"
                variant="primary"
                onPress={handleConfirm}
                style={styles.confirmButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 0,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: Typography.fontSize.small,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  optionalText: {
    fontSize: Typography.fontSize.tiny,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
    fontWeight: Typography.fontWeight.regular,
  },
  input: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: BorderRadius.medium,
    paddingHorizontal: Spacing.lg,
    minHeight: 52,
  },
  iconContainer: {
    marginRight: Spacing.md,
  },
  text: {
    flex: 1,
    fontSize: Typography.fontSize.medium,
    color: Colors.text,
    fontFamily: Typography.fontFamily.primary,
  },
  placeholder: {
    color: Colors.textMuted,
  },
  inputError: {
    borderColor: Colors.error,
    backgroundColor: "rgba(239, 68, 68, 0.05)",
  },
  errorText: {
    fontSize: Typography.fontSize.tiny,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.backgroundOverlay,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  modalContent: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.glow,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  modalTitle: {
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary,
    fontFamily: Typography.fontFamily.primary,
  },
  pickerContainer: {
    flexDirection: "row",
    height: 300,
    marginBottom: Spacing.xl,
  },
  column: {
    flex: 1,
  },
  columnHeader: {
    fontSize: Typography.fontSize.large,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    marginBottom: Spacing.md,
    textAlign: "center",
    letterSpacing: Typography.letterSpacing.wide,
  },
  divider: {
    width: 1,
    backgroundColor: Colors.borderLight,
    marginHorizontal: Spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  option: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.small,
    marginHorizontal: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  selectedOption: {
    backgroundColor: Colors.placeholderBackground,
  },
  optionText: {
    fontSize: Typography.fontSize.medium,
    color: Colors.text,
    textAlign: "center",
  },
  selectedOptionText: {
    color: Colors.primary,
    fontWeight: Typography.fontWeight.semibold,
  },
  modalActions: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
  },
  confirmButton: {
    flex: 1,
  },
});
