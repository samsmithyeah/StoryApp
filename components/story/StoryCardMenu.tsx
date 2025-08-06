import React from "react";
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Colors, Shadows } from "../../constants/Theme";
import { IconSymbol } from "../ui/IconSymbol";
import { Story } from "../../types/story.types";
import { reportStory, deleteStory } from "../../services/firebase/stories";

interface StoryCardMenuProps {
  visible: boolean;
  onClose: () => void;
  story: Story;
  isReporting: boolean;
  setIsReporting: (reporting: boolean) => void;
  isDeleting: boolean;
  setIsDeleting: (deleting: boolean) => void;
}

export const StoryCardMenu: React.FC<StoryCardMenuProps> = ({
  visible,
  onClose,
  story,
  isReporting,
  setIsReporting,
  isDeleting,
  setIsDeleting,
}) => {
  const handleReportStory = async () => {
    onClose();
    
    Alert.alert(
      "Report story",
      "Are you sure you want to report this story for inappropriate content?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Report",
          style: "destructive",
          onPress: async () => {
            try {
              setIsReporting(true);
              await reportStory(story.id, story);
              Alert.alert(
                "Story reported",
                "Thank you for your report. We will review this story promptly.",
                [{ text: "OK" }]
              );
            } catch (error) {
              Alert.alert(
                "Error",
                "Failed to report story. Please try again.",
                [{ text: "OK" }]
              );
            } finally {
              setIsReporting(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteStory = async () => {
    onClose();
    
    Alert.alert(
      "Delete story",
      "Are you sure you want to permanently delete this story? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setIsDeleting(true);
              await deleteStory(story.id);
              Alert.alert(
                "Story deleted",
                "The story has been permanently deleted.",
                [{ text: "OK" }]
              );
            } catch (error) {
              Alert.alert(
                "Error",
                "Failed to delete story. Please try again.",
                [{ text: "OK" }]
              );
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.menuModal}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleReportStory}
                disabled={isReporting}
              >
                <IconSymbol name="flag" size={20} color="#EF4444" />
                <Text style={styles.menuItemText}>Report story</Text>
              </TouchableOpacity>

              <View style={styles.menuDivider} />
              
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleDeleteStory}
                disabled={isDeleting}
              >
                <IconSymbol name="trash" size={20} color="#EF4444" />
                <Text style={styles.menuItemText}>Delete story</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  menuModal: {
    backgroundColor: "#1A1B3A",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
    padding: 8,
    minWidth: 200,
    ...Shadows.glowMedium,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: "#FFFFFF",
    flex: 1,
  },
  menuDivider: {
    height: 1,
    backgroundColor: "rgba(212, 175, 55, 0.2)",
    marginVertical: 4,
  },
});