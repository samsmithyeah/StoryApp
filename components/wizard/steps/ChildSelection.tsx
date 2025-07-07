import { useChildren } from "@/hooks/useChildren";
import { Child } from "@/types/child.types";
import { Colors } from "@/constants/Theme";
import { WizardFooter } from '../shared/WizardFooter';
import { WizardStepHeader } from '../shared/WizardStepHeader';
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
        <WizardStepHeader
          title="Who's the story for?"
          subtitle="Select one or more children"
          stepNumber={1}
          totalSteps={3}
          onBack={() => {}}
          onCancel={onCancel}
        />

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
                  trackColor={{ false: "#374151", true: Colors.primary }}
                  thumbColor={childrenAsCharacters ? "#FFFFFF" : Colors.textSecondary}
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
    backgroundColor: Colors.background,
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
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedAvatar: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
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
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  checkmarkText: {
    color: Colors.textDark,
    fontSize: 14,
    fontWeight: "bold",
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: Colors.textDark,
  },
  selectedAvatarText: {
    color: Colors.textDark,
  },
  childName: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: "600",
    color: Colors.text,
    textAlign: "center",
    marginBottom: 4,
  },
  childAge: {
    fontSize: isTablet ? 14 : 12,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 16,
  },
  selectedText: {
    color: Colors.primary,
  },
  addChildLink: {
    alignSelf: "center",
    padding: 8,
  },
  addChildText: {
    fontSize: 16,
    color: Colors.primary,
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
    color: Colors.text,
  },
});
