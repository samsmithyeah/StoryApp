import { IconSymbol } from "@/components/ui/IconSymbol";
import { Shadows } from "@/constants/Theme";
import React from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

interface Mood {
  id: string;
  title: string;
  icon: string;
  description: string;
}

interface MoodCardProps {
  mood: Mood;
  isSelected: boolean;
  onSelect: (moodId: string) => void;
}

export const MoodCard: React.FC<MoodCardProps> = ({
  mood,
  isSelected,
  onSelect,
}) => {
  return (
    <TouchableOpacity
      style={[
        isTablet ? styles.moodListCardTablet : styles.moodListCard,
        isSelected && styles.selectedListCard,
      ]}
      onPress={() => onSelect(mood.id)}
    >
      <View
        style={[
          styles.iconContainer,
          isSelected
            ? styles.selectedIconContainer
            : styles.unselectedIconContainer,
        ]}
      >
        <IconSymbol name={mood.icon as any} size={24} color="#1a1b3a" />
      </View>
      <View style={styles.moodInfo}>
        <Text style={[styles.moodName, isSelected && styles.selectedText]}>
          {mood.title}
        </Text>
        <Text
          style={[
            styles.moodDescription,
            isSelected && styles.selectedDescription,
          ]}
        >
          {mood.description}
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
  moodListCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: "transparent",
  },
  moodListCardTablet: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: "transparent",
    width: "49%",
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
});
