import React, { useState } from "react";
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from "react-native";
import { IconSymbol } from "./IconSymbol";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
} from "../../constants/Theme";

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoCorrect?: boolean;
  error?: string;
  disabled?: boolean;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  multiline?: boolean;
  numberOfLines?: number;
  optional?: boolean;
  maxLength?: number;
  helperText?: string;
  showCharacterCount?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = "default",
  autoCapitalize = "sentences",
  autoCorrect = true,
  error,
  disabled = false,
  style,
  inputStyle,
  leftIcon,
  rightIcon,
  onRightIconPress,
  multiline = false,
  numberOfLines = 1,
  optional = false,
  maxLength,
  helperText,
  showCharacterCount = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry);

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleTogglePassword = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const containerStyle = [styles.container, style];

  const inputContainerStyle = [
    styles.inputContainer,
    isFocused && styles.focused,
    error && styles.error,
    disabled && styles.disabled,
  ];

  const textInputStyle = [
    styles.input,
    leftIcon && styles.inputWithLeftIcon,
    (rightIcon || secureTextEntry) && styles.inputWithRightIcon,
    inputStyle,
  ];

  return (
    <View style={containerStyle}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{label}</Text>
          {optional && <Text style={styles.optionalText}>(optional)</Text>}
        </View>
      )}

      <View style={inputContainerStyle}>
        {leftIcon && (
          <IconSymbol
            name={leftIcon}
            size={20}
            color={Colors.textMuted}
            style={styles.leftIcon}
          />
        )}

        <TextInput
          style={textInputStyle}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          editable={!disabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          multiline={multiline}
          numberOfLines={numberOfLines}
          placeholderTextColor={Colors.textMuted}
          blurOnSubmit={false}
          selectTextOnFocus={false}
          maxLength={maxLength}
        />

        {secureTextEntry && (
          <TouchableOpacity
            onPress={handleTogglePassword}
            style={styles.rightIcon}
          >
            <IconSymbol
              name={isPasswordVisible ? "eye.slash" : "eye"}
              size={20}
              color={Colors.textMuted}
            />
          </TouchableOpacity>
        )}

        {rightIcon && !secureTextEntry && (
          <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon}>
            <IconSymbol name={rightIcon} size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {!error && helperText && (
        <Text style={styles.helperText}>{helperText}</Text>
      )}

      {showCharacterCount && maxLength && (
        <Text style={styles.characterCount}>
          {value.length}/{maxLength}
        </Text>
      )}
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
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
    borderRadius: BorderRadius.medium,
    paddingHorizontal: Spacing.lg,
    minHeight: 52,
  },
  focused: {
    borderColor: Colors.primary,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  error: {
    borderColor: Colors.error,
    backgroundColor: "rgba(239, 68, 68, 0.05)",
  },
  disabled: {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    opacity: 0.5,
  },
  input: {
    flex: 1,
    fontSize: Typography.fontSize.medium,
    color: Colors.text,
    paddingVertical: Spacing.md,
    fontFamily: Typography.fontFamily.primary,
  },
  inputWithLeftIcon: {
    marginLeft: Spacing.md,
  },
  inputWithRightIcon: {
    marginRight: Spacing.md,
  },
  leftIcon: {
    marginRight: 0,
  },
  rightIcon: {
    padding: Spacing.xs,
    marginLeft: 0,
  },
  errorText: {
    fontSize: Typography.fontSize.tiny,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
  helperText: {
    fontSize: Typography.fontSize.tiny,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  characterCount: {
    fontSize: Typography.fontSize.tiny,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
    textAlign: "right",
  },
});
