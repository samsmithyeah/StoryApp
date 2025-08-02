import React from "react";
import {
  Dimensions,
  Platform,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Colors } from "../../constants/Theme";
import { IconSymbol } from "./IconSymbol";

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

interface CloseButtonProps {
  onPress: () => void;
  style?: any;
}

export const CloseButton: React.FC<CloseButtonProps> = ({ onPress, style }) => {
  return (
    <TouchableOpacity style={[styles.cancelButton, style]} onPress={onPress}>
      <IconSymbol
        name="xmark"
        size={Platform.select({
          ios: isTablet ? 24 : 20,
          android: 24,
        })}
        color={Colors.primary}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cancelButton: {
    minWidth: 24, // Just the icon size
    minHeight: 24,
    justifyContent: "center",
    alignItems: "center",
  },
});
