import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { IconSymbol } from './IconSymbol';

interface DatePickerProps {
  label?: string;
  value?: Date;
  onChange: (date: Date) => void;
  placeholder?: string;
  maximumDate?: Date;
  minimumDate?: Date;
  leftIcon?: string;
  style?: any;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Select date',
  maximumDate,
  minimumDate,
  leftIcon,
  style,
}) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [currentDate, setCurrentDate] = useState(value || new Date());

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateForCalendar = (date: Date) => {
    return date.toISOString().split('T')[0];
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
        style={styles.input}
        onPress={() => setShowCalendar(true)}
      >
        {leftIcon && (
          <View style={styles.iconContainer}>
            <IconSymbol name={leftIcon} size={20} color="#6B7280" />
          </View>
        )}
        
        <Text style={[styles.text, !value && styles.placeholder]}>
          {value ? formatDate(value) : placeholder}
        </Text>
        
        <IconSymbol name="chevron.down" size={16} color="#6B7280" />
      </TouchableOpacity>

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
                <IconSymbol name="xmark" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.yearMonthSelector}>
              <TouchableOpacity 
                style={styles.yearButton}
                onPress={() => setShowYearPicker(true)}
              >
                <Text style={styles.yearButtonText}>{currentDate.getFullYear()}</Text>
                <IconSymbol name="chevron.down" size={16} color="#6366F1" />
              </TouchableOpacity>
            </View>
            
            {showYearPicker ? (
              <ScrollView style={styles.yearPicker} showsVerticalScrollIndicator={true}>
                {generateYears().map((year) => (
                  <TouchableOpacity
                    key={year}
                    style={styles.yearOption}
                    onPress={() => handleYearSelect(year)}
                  >
                    <Text style={[
                      styles.yearOptionText,
                      currentDate.getFullYear() === year && styles.selectedYearText
                    ]}>
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <Calendar
                current={formatDateForCalendar(currentDate)}
                onDayPress={(day) => handleDateSelect(day.dateString)}
                markedDates={value ? {
                  [formatDateForCalendar(value)]: {
                    selected: true,
                    selectedColor: '#6366F1',
                  }
                } : {}}
                maxDate={maximumDate ? formatDateForCalendar(maximumDate) : undefined}
                minDate={minimumDate ? formatDateForCalendar(minimumDate) : undefined}
                onMonthChange={(month) => {
                  const newDate = new Date(month.dateString);
                  setCurrentDate(newDate);
                }}
                renderHeader={(date) => {
                  // The date parameter is an object with toString method, convert it properly
                  const dateObj = new Date(date.toString());
                  const monthName = dateObj.toLocaleDateString('en-US', { month: 'long' });
                  return (
                    <View style={{ paddingVertical: 10 }}>
                      <Text style={{ fontSize: 18, fontWeight: '600', color: '#2d4150', textAlign: 'center' }}>
                        {monthName}
                      </Text>
                    </View>
                  );
                }}
                theme={{
                  selectedDayBackgroundColor: '#6366F1',
                  selectedDayTextColor: '#ffffff',
                  todayTextColor: '#6366F1',
                  dayTextColor: '#2d4150',
                  textDisabledColor: '#d9e1e8',
                  dotColor: '#6366F1',
                  selectedDotColor: '#ffffff',
                  arrowColor: '#6366F1',
                  monthTextColor: '#2d4150',
                  indicatorColor: '#6366F1',
                  textDayFontWeight: '500',
                  textMonthFontWeight: '600',
                  textDayHeaderFontWeight: '500',
                  textDayFontSize: 16,
                  textMonthFontSize: 18,
                  textDayHeaderFontSize: 14,
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
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 52,
  },
  iconContainer: {
    marginRight: 12,
  },
  text: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  placeholder: {
    color: '#9CA3AF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearMonthSelector: {
    alignItems: 'center',
    marginBottom: 16,
  },
  yearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  yearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366F1',
  },
  yearPicker: {
    maxHeight: 300,
    marginBottom: 16,
  },
  yearOption: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  yearOptionText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
  },
  selectedYearText: {
    color: '#6366F1',
    fontWeight: '600',
  },
});