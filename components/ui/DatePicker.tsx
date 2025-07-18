import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { IconSymbol } from "./IconSymbol";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
} from "../../constants/Theme";

interface DatePickerProps {
  label?: string;
  value?: Date;
  onChange: (date: Date) => void;
  placeholder?: string;
  maximumDate?: Date;
  minimumDate?: Date;
  leftIcon?: string;
  style?: any;
  error?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onChange,
  placeholder = "Select date",
  maximumDate,
  minimumDate,
  leftIcon,
  style,
  error,
}) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [currentDate, setCurrentDate] = useState(value || new Date());

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateForCalendar = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const handleDateSelect = (dateString: string) => {
    const selectedDate = new Date(dateString);
    onChange(selectedDate);
    setShowCalendar(false);
  };

  const handleYearSelect = (year: number) => {
    const newDate = new Date(currentDate);
    newDate.setFullYear(year);
    setCurrentDate(newDate);
    setShowYearPicker(false);
  };

  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year >= currentYear - 15; year--) {
      years.push(year);
    }
    return years;
  };

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <TouchableOpacity
        style={[styles.input, error && styles.inputError]}
        onPress={() => setShowCalendar(true)}
      >
        {leftIcon && (
          <View style={styles.iconContainer}>
            <IconSymbol name={leftIcon} size={20} color={Colors.textMuted} />
          </View>
        )}

        <Text style={[styles.text, !value && styles.placeholder]}>
          {value ? formatDate(value) : placeholder}
        </Text>

        <IconSymbol name="chevron.down" size={16} color={Colors.textMuted} />
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={showCalendar}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCalendar(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Date</Text>
              <TouchableOpacity
                onPress={() => setShowCalendar(false)}
                style={styles.closeButton}
              >
                <IconSymbol name="xmark" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.yearMonthSelector}>
              <TouchableOpacity
                style={styles.yearButton}
                onPress={() => setShowYearPicker(true)}
              >
                <Text style={styles.yearButtonText}>
                  {currentDate.getFullYear()}
                </Text>
                <IconSymbol
                  name="chevron.down"
                  size={16}
                  color={Colors.primary}
                />
              </TouchableOpacity>
            </View>

            {showYearPicker ? (
              <ScrollView
                style={styles.yearPicker}
                showsVerticalScrollIndicator={true}
              >
                {generateYears().map((year) => (
                  <TouchableOpacity
                    key={year}
                    style={styles.yearOption}
                    onPress={() => handleYearSelect(year)}
                  >
                    <Text
                      style={[
                        styles.yearOptionText,
                        currentDate.getFullYear() === year &&
                          styles.selectedYearText,
                      ]}
                    >
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <Calendar
                current={formatDateForCalendar(currentDate)}
                onDayPress={(day) => handleDateSelect(day.dateString)}
                markedDates={
                  value
                    ? {
                        [formatDateForCalendar(value)]: {
                          selected: true,
                          selectedColor: Colors.primary,
                        },
                      }
                    : {}
                }
                maxDate={
                  maximumDate ? formatDateForCalendar(maximumDate) : undefined
                }
                minDate={
                  minimumDate ? formatDateForCalendar(minimumDate) : undefined
                }
                onMonthChange={(month) => {
                  const newDate = new Date(month.dateString);
                  setCurrentDate(newDate);
                }}
                renderHeader={(date) => {
                  // The date parameter is an object with toString method, convert it properly
                  const dateObj = new Date(date.toString());
                  const monthName = dateObj.toLocaleDateString("en-US", {
                    month: "long",
                  });
                  return (
                    <View style={{ paddingVertical: 10 }}>
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: "600",
                          color: Colors.text,
                          textAlign: "center",
                        }}
                      >
                        {monthName}
                      </Text>
                    </View>
                  );
                }}
                theme={{
                  selectedDayBackgroundColor: Colors.primary,
                  selectedDayTextColor: Colors.textDark,
                  todayTextColor: Colors.primary,
                  dayTextColor: Colors.text,
                  textDisabledColor: Colors.textMuted,
                  dotColor: Colors.primary,
                  selectedDotColor: Colors.textDark,
                  arrowColor: Colors.primary,
                  monthTextColor: Colors.text,
                  indicatorColor: Colors.primary,
                  textDayFontWeight: "500",
                  textMonthFontWeight: "600",
                  textDayHeaderFontWeight: "500",
                  textDayFontSize: 16,
                  textMonthFontSize: 18,
                  textDayHeaderFontSize: 14,
                  backgroundColor: Colors.backgroundLight,
                  calendarBackground: Colors.backgroundLight,
                  textSectionTitleColor: Colors.textSecondary,
                }}
              />
            )}
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
  label: {
    fontSize: Typography.fontSize.small,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary,
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  input: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
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
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: "100%",
    maxWidth: 400,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.2)",
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
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
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  yearMonthSelector: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  yearButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.small,
    gap: Spacing.sm,
  },
  yearButtonText: {
    fontSize: Typography.fontSize.medium,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary,
  },
  yearPicker: {
    maxHeight: 300,
    marginBottom: Spacing.lg,
  },
  yearOption: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  yearOptionText: {
    fontSize: Typography.fontSize.medium,
    color: Colors.text,
    textAlign: "center",
  },
  selectedYearText: {
    color: Colors.primary,
    fontWeight: Typography.fontWeight.semibold,
  },
});
