import React from "react";
import { Dimensions, StyleSheet, Text, TouchableOpacity } from "react-native";
import { Colors } from "../../constants/Theme";

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

interface CloseButtonProps {
  onPress: () => void;
  style?: any;
}

export const CloseButton: React.FC<CloseButtonProps> = ({ onPress, style }) => {
  return (
    <TouchableOpacity style={[styles.cancelButton, style]} onPress={onPress}>
      <Text style={styles.cancelText}>✕</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cancelButton: {
    padding: 8,
    minWidth: 40,
  },
  cancelText: {
    color: Colors.primary,
    fontSize: isTablet ? 32 : 24,
    fontWeight: "400",
  },
});
