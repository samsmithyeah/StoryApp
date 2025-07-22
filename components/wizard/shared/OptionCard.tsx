import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Theme";
import React from "react";
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Dimensions,
} from "react-native";

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

interface Option {
  id: string;
  title: string;
  description: string;
  icon: string;
}

interface OptionCardProps {
  option: Option;
  isSelected: boolean;
  onSelect: (optionId: string) => void;
  style?: any;
}

export const OptionCard: React.FC<OptionCardProps> = ({
  option,
  isSelected,
  onSelect,
  style,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.optionCard,
        isSelected && styles.selectedCard,
        style,
      ]}
      onPress={() => onSelect(option.id)}
    >
      <View
        style={[
          styles.iconContainer,
          isSelected
            ? styles.selectedIconContainer
            : styles.unselectedIconContainer,
        ]}
      >
        <IconSymbol name={option.icon as any} size={24} color={Colors.textDark} />
      </View>
      <View style={styles.optionInfo}>
        <Text style={[styles.optionTitle, isSelected && styles.selectedText]}>
          {option.title}
        </Text>
        <Text
          style={[
            styles.optionDescription,
            isSelected && styles.selectedDescription,
          ]}
        >
          {option.description}
        </Text>
      </View>
      {isSelected && (
        <View style={styles.checkmark}>
          <Text style={styles.checkmarkText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedCard: {
    backgroundColor: "rgba(212, 175, 55, 0.2)",
    borderColor: Colors.primary,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  selectedIconContainer: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  unselectedIconContainer: {
    opacity: 0.6,
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: isTablet ? 14 : 12,
    color: Colors.textSecondary,
    lineHeight: 16,
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
    backgroundColor: Colors.success,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  checkmarkText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "bold",
  },
});