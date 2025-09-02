import React from "react";
import {
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { StarsDecorations } from "@/components/credits/StarsDecorations";
import { BackgroundContainer } from "@/components/shared/BackgroundContainer";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Colors, Spacing, Typography } from "@/constants/Theme";

const SUPPORT_EMAIL = "support@dreamweaver-app.com";

export default function HelpScreen() {
  const handleEmailSupport = () => {
    const subject = encodeURIComponent("DreamWeaver App Support Request");
    const body = encodeURIComponent(
      "Hi DreamWeaver team,\n\nI need help with:\n\n"
    );
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`);
  };

  return (
    <BackgroundContainer showDecorations={false}>
      <StarsDecorations />

      <ScreenHeader title="Help & support" />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Get help</Text>

            <TouchableOpacity
              style={styles.contactItem}
              onPress={handleEmailSupport}
            >
              <View style={styles.contactIcon}>
                <IconSymbol name="envelope" size={24} color={Colors.primary} />
              </View>
              <View style={styles.contactContent}>
                <Text style={styles.contactTitle}>Email support</Text>
                <Text style={styles.contactDescription}>{SUPPORT_EMAIL}</Text>
              </View>
              <IconSymbol
                name="arrow.up.forward"
                size={20}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Report an issue</Text>
            <Text style={styles.reportDescription}>
              If you encounter inappropriate content in a story, please use the
              "Report story" button within the story viewer. We take all reports
              seriously and review them promptly.
            </Text>
            <Text style={styles.reportDescription}>
              For technical issues or other concerns, please contact us via
              email support above.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </BackgroundContainer>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    marginTop: Spacing.lg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing.xxxl,
  },
  section: {
    marginBottom: Spacing.xxxl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary,
    marginBottom: Spacing.lg,
    fontFamily: Typography.fontFamily.primary,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: Spacing.lg,
    borderRadius: 16,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.2)",
  },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  contactContent: {
    flex: 1,
  },
  contactTitle: {
    fontSize: Typography.fontSize.medium,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text,
    marginBottom: 2,
  },
  contactDescription: {
    fontSize: Typography.fontSize.small,
    color: Colors.textSecondary,
  },
  reportDescription: {
    fontSize: Typography.fontSize.medium,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: Spacing.md,
  },
});
