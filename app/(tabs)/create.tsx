import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  StatusBar as RNStatusBar,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackgroundContainer } from "../../components/shared/BackgroundContainer";
import { Button } from "../../components/ui/Button";
import { CreditIndicator } from "../../components/ui/CreditIndicator";
import { InsufficientCreditsModal } from "../../components/ui/InsufficientCreditsModal";
import {
  Colors,
  CommonStyles,
  Spacing,
  Typography,
} from "../../constants/Theme";
import { useChildren } from "../../hooks/useChildren";
import { useCredits } from "../../hooks/useCredits";

export default function CreateScreen() {
  const { children } = useChildren();
  const { balance, loading: creditsLoading } = useCredits();
  const insets = useSafeAreaInsets();
  const [showInsufficientCreditsModal, setShowInsufficientCreditsModal] =
    useState(false);

  const handleCreateStory = () => {
    if (children.length === 0) {
      Alert.alert(
        "No children added",
        "Please add at least one child profile in settings before creating a story.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Go to settings",
            onPress: () => router.push("/(tabs)/settings"),
          },
        ]
      );
      return;
    }

    // Check if user has enough credits (minimum 1 for a story)
    if (balance < 1) {
      setShowInsufficientCreditsModal(true);
      return;
    }

    router.push("/wizard" as any);
  };

  return (
    <BackgroundContainer showDecorations={true}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={[styles.scrollView, { marginTop: -insets.top }]}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop:
                insets.top +
                60 +
                (Platform.select({
                  android: RNStatusBar.currentHeight || 0,
                  ios: 0,
                }) || 0),
            },
          ]}
          contentInsetAdjustmentBehavior="never"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.headerSection}>
              <CreditIndicator />
            </View>

            <Text style={styles.title}>Create a story</Text>
            <Text style={styles.subtitle}>
              Create a personalised bedtime story for your child
            </Text>

            <Button
              title="Start"
              onPress={handleCreateStory}
              variant="primary"
              size="large"
              disabled={creditsLoading}
              style={{
                paddingHorizontal: 48,
                paddingVertical: 16,
                borderRadius: 25,
                marginBottom: 48,
              }}
            />

            <View style={styles.features}>
              <View style={styles.featureItem}>
                <Text style={styles.bullet}>●</Text>
                <Text style={styles.featureText}>
                  Feature your children in the story
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.bullet}>●</Text>
                <Text style={styles.featureText}>
                  Choose the theme and characters
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.bullet}>●</Text>
                <Text style={styles.featureText}>
                  Customise the length and illustrations
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.bullet}>●</Text>
                <Text style={styles.featureText}>AI-powered creativity</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Insufficient Credits Modal */}
      <InsufficientCreditsModal
        visible={showInsufficientCreditsModal}
        onClose={() => setShowInsufficientCreditsModal(false)}
        currentBalance={balance}
        message="You need credits to create stories. Each credit creates one page. Would you like to purchase credits or choose from our subscription plans?"
        showAlternativeAction={false}
      />
    </BackgroundContainer>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing.screenPadding,
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    maxWidth: 400,
    width: "100%",
  },
  headerSection: {
    marginBottom: Spacing.xxxl,
  },

  // Header
  title: {
    ...CommonStyles.brandTitle,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    fontSize: Typography.fontSize.large,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.huge,
    lineHeight: 26,
  },

  // Features section
  features: {
    width: "100%",
    maxWidth: 300,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.lg,
  },
  bullet: {
    color: Colors.primary,
    fontSize: Typography.fontSize.small,
    marginRight: Spacing.md,
    marginTop: 2,
  },
  featureText: {
    fontSize: Typography.fontSize.medium,
    color: Colors.text,
    flex: 1,
    lineHeight: 22,
  },
});
