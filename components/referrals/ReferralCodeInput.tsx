import React, { forwardRef, useImperativeHandle, useCallback, useState } from "react";
import { ViewStyle } from "react-native";
import { Input } from "../ui/Input";
import { useReferrals } from "../../hooks/useReferrals";
import { REFERRAL_CONFIG } from "../../types/referral.types";

interface ReferralCodeInputProps {
  value: string;
  onChangeText: (text: string) => void;
  disabled?: boolean;
  style?: ViewStyle;
}

export interface ReferralCodeInputRef {
  validate: () => Promise<{ isValid: boolean; isBackendError: boolean }>;
}

export const ReferralCodeInput = forwardRef<ReferralCodeInputRef, ReferralCodeInputProps>(({
  value,
  onChangeText,
  disabled = false,
  style,
}, ref) => {
  const { validateReferralCode } = useReferrals();
  const [validationError, setValidationError] = useState("");

  const performValidation = useCallback(async (codeToValidate: string): Promise<{ isValid: boolean; isBackendError: boolean }> => {
    setValidationError(""); // Clear previous errors
    
    if (!codeToValidate.trim()) {
      return { isValid: true, isBackendError: false }; // Empty is valid (optional field)
    }

    // Basic format check - this is a client-side error
    if (codeToValidate.length !== REFERRAL_CONFIG.CODE_LENGTH) {
      setValidationError(`Code must be ${REFERRAL_CONFIG.CODE_LENGTH} characters`);
      return { isValid: false, isBackendError: false };
    }

    try {
      const result = await validateReferralCode(codeToValidate.trim().toUpperCase());
      if (!result.isValid) {
        setValidationError("Invalid referral code");
        return { isValid: false, isBackendError: true }; // This is a backend validation error
      }
      return { isValid: true, isBackendError: false };
    } catch {
      setValidationError("Error validating code");
      return { isValid: false, isBackendError: true }; // This is also a backend error
    }
  }, [validateReferralCode]);

  // Expose validate function to parent via ref
  useImperativeHandle(ref, () => ({
    validate: () => performValidation(value),
  }), [performValidation, value]);

  const handleChangeText = (text: string) => {
    const upperText = text.toUpperCase().slice(0, REFERRAL_CONFIG.CODE_LENGTH);
    onChangeText(upperText);
    // Clear validation error when user types
    if (validationError) {
      setValidationError("");
    }
  };

  return (
    <Input
      label="Referral code"
      optional
      value={value}
      onChangeText={handleChangeText}
      placeholder={`Enter ${REFERRAL_CONFIG.CODE_LENGTH}-character code`}
      autoCapitalize="characters"
      autoCorrect={false}
      disabled={disabled}
      maxLength={REFERRAL_CONFIG.CODE_LENGTH}
      helperText="Have a friend who uses DreamWeaver? Enter their referral code to get bonus credits!"
      error={validationError}
      style={style}
    />
  );
});

ReferralCodeInput.displayName = "ReferralCodeInput";