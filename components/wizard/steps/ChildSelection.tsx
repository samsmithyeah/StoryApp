import { useChildren } from "@/hooks/useChildren";
import { Child } from "@/types/child.types";
import { WizardFooter } from '../shared/WizardFooter';
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Dimensions,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface ChildSelectionProps {
  selectedChildren: string[];
  childrenAsCharacters: boolean;
  onUpdate: (data: {
    selectedChildren?: string[];
    childrenAsCharacters?: boolean;
  }) => void;
  onNext: () => void;
  onCancel: () => void;
}

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

export const ChildSelection: React.FC<ChildSelectionProps> = ({
  selectedChildren,
  childrenAsCharacters,
  onUpdate,
  onNext,
  onCancel,
}) => {
  const { children } = useChildren();

  const calculateAge = (dateOfBirth: Date) => {
    const today = new Date();
    const age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();
    const dayDiff = today.getDate() - dateOfBirth.getDate();
    return monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
  };

  const handleChildSelect = (child: Child) => {
    if (selectedChildren.includes(child.id)) {
      onUpdate({
        selectedChildren: selectedChildren.filter((id) => id !== child.id),
      });
    } else {
      onUpdate({ selectedChildren: [...selectedChildren, child.id] });
    }
  };

  const isNextDisabled = selectedChildren.length === 0;

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require("@/assets/images/background-landscape.png")}
        resizeMode="cover"
        style={StyleSheet.absoluteFillObject}
      >
        <LinearGradient
          colors={["rgba(15,17,41,0.72)", "rgba(15,17,41,0.96)"]}
          style={StyleSheet.absoluteFill}
        />
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.brand}>DreamWeaver</Text>
            <Text style={styles.stepIndicator}>Step 1 of 4</Text>
          </View>

          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Who's the story for?</Text>
          <Text style={styles.subtitle}>Select one or more children</Text>
        </View>

        {/* Children List */}
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.childrenContainer}>
            <View style={styles.childrenGrid}>
              {children.map((child) => {
                const isSelected = selectedChildren.includes(child.id);
                const age = calculateAge(child.dateOfBirth);

                return (
                  <TouchableOpacity
                    key={child.id}
                    style={[
                      styles.childCard,
                      isSelected && styles.selectedCard,
                    ]}
                    onPress={() => handleChildSelect(child)}
                  >
                    <View style={styles.avatarContainer}>
                      <View
                        style={[
                          styles.avatar,
                          isSelected && styles.selectedAvatar,
                        ]}
                      >
                        <Text
                          style={[
                            styles.avatarText,
                            isSelected && styles.selectedAvatarText,
                          ]}
                        >
                          {child.childName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      {isSelected && (
                        <View style={styles.checkmark}>
                          <Text style={styles.checkmarkText}>✓</Text>
                        </View>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.childName,
                        isSelected && styles.selectedText,
                      ]}
                    >
                      {child.childName}
                    </Text>
                    <Text
                      style={[
                        styles.childAge,
                        isSelected && styles.selectedText,
                      ]}
                    >
                      Age {age} • {child.childPreferences || "No interests set"}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Always show main character toggle */}
            <View style={styles.characterOption}>
              <View style={styles.switchContainer}>
                <Text style={styles.switchTitle}>
                  Feature in the story as characters
                </Text>
                <Switch
                  value={childrenAsCharacters}
                  onValueChange={(value) =>
                    onUpdate({ childrenAsCharacters: value })
                  }
                  trackColor={{ false: "#374151", true: "#D4AF37" }}
                  thumbColor={childrenAsCharacters ? "#FFFFFF" : "#9CA3AF"}
                />
              </View>
            </View>
            {/* Add Child Link */}
            <TouchableOpacity
              style={styles.addChildLink}
              onPress={() => router.push("/(tabs)/settings")}
            >
              <Text style={styles.addChildText}>+ Add another child</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Footer */}
        <WizardFooter
          onNext={onNext}
          nextDisabled={isNextDisabled}
        />
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f1129",
  },
  header: {
    position: "relative",
    paddingHorizontal: 24,
    paddingTop: isTablet ? 60 : 10,
    paddingBottom: 8,
  },
  cancelButton: {
    position: "absolute",
    top: isTablet ? 10 : -10,
    right: 24,
    padding: 8,
  },
  cancelText: {
    color: "#D4AF37",
    fontSize: isTablet ? 32 : 24,
    fontWeight: "400",
  },
  headerContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  brand: {
    fontSize: isTablet ? 48 : 32,
    fontWeight: "600",
    color: "#D4AF37",
    fontFamily: "PlayfairDisplay-Regular",
  },
  stepIndicator: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 2,
  },
  titleSection: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    alignItems: "center",
  },
  title: {
    fontSize: isTablet ? 32 : 24,
    fontWeight: "600",
    color: "#D4AF37",
    marginBottom: 4,
    textAlign: "center",
    fontFamily: "PlayfairDisplay-Regular",
  },
  subtitle: {
    fontSize: isTablet ? 20 : 14,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 22,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  childrenContainer: {
    paddingBottom: 20,
  },
  childrenGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  childCard: {
    alignItems: "center",
    backgroundColor: "transparent",
    padding: 8,
    width: isTablet ? 200 : (width - 48) / 3 - 16,
    marginHorizontal: 8,
    marginBottom: 16,
  },
  selectedCard: {
    backgroundColor: "transparent",
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: isTablet ? 100 : 70,
    height: isTablet ? 100 : 70,
    borderRadius: isTablet ? 50 : 35,
    backgroundColor: "#D4AF37",
    alignItems: "center",
    justifyContent: "center",
  },
  selectedAvatar: {
    backgroundColor: "#D4AF37",
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  checkmark: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#D4AF37",
    alignItems: "center",
    justifyContent: "center",
  },
  checkmarkText: {
    color: "#1a1b3a",
    fontSize: 14,
    fontWeight: "bold",
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1a1b3a",
  },
  selectedAvatarText: {
    color: "#1a1b3a",
  },
  childName: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 4,
  },
  childAge: {
    fontSize: isTablet ? 14 : 12,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 16,
  },
  selectedText: {
    color: "#D4AF37",
  },
  addChildLink: {
    alignSelf: "center",
    padding: 8,
  },
  addChildText: {
    fontSize: 16,
    color: "#D4AF37",
    fontWeight: "600",
    textAlign: "center",
  },
  characterOption: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  switchTitle: {
    fontSize: isTablet ? 20 : 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
