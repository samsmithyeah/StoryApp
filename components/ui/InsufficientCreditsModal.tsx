import { Button } from "@/components/ui/Button";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { BorderRadius, Colors, Spacing, Typography } from "@/constants/Theme";
import { useRouter } from "expo-router";
import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface InsufficientCreditsModalProps {
  visible: boolean;
  onClose: () => void;
  currentBalance: number;
  creditsNeeded?: number;
  title?: string;
  message?: string;
  showAlternativeAction?: boolean;
  alternativeActionText?: string;
  onAlternativeAction?: () => void;
}

export const InsufficientCreditsModal: React.FC<
  InsufficientCreditsModalProps
> = ({
  visible,
  onClose,
  currentBalance,
  creditsNeeded,
  title = "More credits needed",
  message,
  showAlternativeAction = false,
  alternativeActionText = "Cancel",
  onAlternativeAction,
}) => {
  const router = useRouter();

  const handleBuyCredits = () => {
    onClose();
    router.push("/credits-modal");
  };

  const handleAlternativeAction = () => {
    if (onAlternativeAction) {
      onAlternativeAction();
    } else {
      onClose();
    }
  };

  const defaultMessage = creditsNeeded
    ? `You need ${creditsNeeded} more credit${creditsNeeded !== 1 ? "s" : ""} to create this story.`
    : "You need credits to create stories. Each credit creates one page.";

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <IconSymbol name="sparkles" size={32} color={Colors.primary} />
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <IconSymbol name="xmark" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalTitle}>{title}</Text>

          <Text style={styles.modalText}>{message || defaultMessage}</Text>

          <Text style={styles.modalSubText}>
            You currently have {currentBalance} credit
            {currentBalance !== 1 ? "s" : ""}. Each credit creates one page of
            your story.
          </Text>

          <View style={styles.modalButtons}>
            <Button
              title="Get credits"
              onPress={handleBuyCredits}
              variant="primary"
              size="large"
              style={styles.primaryModalButton}
            />

            {showAlternativeAction && (
              <Button
                title={alternativeActionText}
                onPress={handleAlternativeAction}
                variant="outline"
                size="large"
                style={styles.secondaryModalButton}
              />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: Typography.fontSize.h3,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    fontFamily: Typography.fontFamily.primary,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  modalText: {
    fontSize: Typography.fontSize.medium,
    color: Colors.text,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  modalSubText: {
    fontSize: Typography.fontSize.small,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  modalButtons: {
    gap: Spacing.md,
  },
  primaryModalButton: {
    marginBottom: 0,
  },
  secondaryModalButton: {
    marginBottom: 0,
  },
});
