import { Colors, Shadows } from "@/constants/Theme";
import { useChildren } from "@/hooks/useChildren";
import { useCredits } from "@/hooks/useCredits";
import { Child } from "@/types/child.types";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Dimensions,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WizardFooter } from "../shared/WizardFooter";
import { WizardStepHeader } from "../shared/WizardStepHeader";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Button } from "@/components/ui/Button";
import { Typography, Spacing } from "@/constants/Theme";

interface ChildSelectionProps {
  selectedChildren: string[];
  onUpdate: (data: { selectedChildren?: string[] }) => void;
  onNext: () => void;
  onCancel: () => void;
}

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

export const ChildSelection: React.FC<ChildSelectionProps> = ({
  selectedChildren,
  onUpdate,
  onNext,
  onCancel,
}) => {
  const { children } = useChildren();
  const { balance } = useCredits();

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
  const isLowCredits = balance < 5; // Show warning if less than 5 credits

  const handleBuyCredits = () => {
    router.push("/credits-modal");
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require("@/assets/images/background-landscape.png")}
        resizeMode={isTablet ? "cover" : "none"}
        style={StyleSheet.absoluteFillObject}
      >
        <LinearGradient
          colors={["rgba(15,17,41,0.72)", "rgba(15,17,41,0.96)"]}
          style={StyleSheet.absoluteFill}
        />
        <WizardStepHeader
          title="Audience selection"
          subtitle={`Who's the story for? This will help us tailor the content to their age and interests. • ${balance} credits available`}
          stepNumber={1}
          totalSteps={7}
          onBack={() => {}}
          onCancel={onCancel}
          showBackButton={false}
        />

        {/* Low credits warning */}
        {isLowCredits && (
          <View style={styles.warningBanner}>
            <IconSymbol name="info.circle" size={20} color={Colors.primary} />
            <View style={styles.warningContent}>
              <Text style={styles.warningText}>
                You have {balance} credits. Consider getting more credits for
                longer stories.
              </Text>
            </View>
            <Button
              title="Get credits"
              onPress={handleBuyCredits}
              variant="outline"
              size="small"
              style={styles.warningButton}
            />
          </View>
        )}

        {/* Children List */}
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.childrenContainer}>
            <View style={styles.childrenGrid}>
              {children.map((child) => {
                const isSelected = selectedChildren.includes(child.id);
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
                    ></Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Add Child Link */}
            <TouchableOpacity
              style={styles.addChildLink}
              onPress={() => router.push("/child-profile")}
            >
              <Text style={styles.addChildText}>+ Add another child</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Footer */}
        <WizardFooter onNext={onNext} nextDisabled={isNextDisabled} />
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
    paddingTop: 20,
    paddingHorizontal: 20,
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
    ...Shadows.glowStrong,
  },
  checkmark: {
    position: "absolute",
    top: 12,
    right: 12,
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
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
    borderRadius: 12,
    padding: Spacing.md,
    marginHorizontal: 24,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  warningContent: {
    flex: 1,
  },
  warningText: {
    fontSize: Typography.fontSize.small,
    color: Colors.text,
    lineHeight: 18,
  },
  warningButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
});
