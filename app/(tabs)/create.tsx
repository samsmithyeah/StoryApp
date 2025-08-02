import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackgroundContainer } from "../../components/shared/BackgroundContainer";
import { Button } from "../../components/ui/Button";
import {
  Colors,
  CommonStyles,
  Spacing,
  Typography,
} from "../../constants/Theme";
import { useChildren } from "../../hooks/useChildren";

export default function CreateScreen() {
  const { children } = useChildren();
  const insets = useSafeAreaInsets();

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
    router.push("/wizard" as any);
  };

  return (
    <BackgroundContainer showDecorations={true}>
      <StatusBar style="light" />

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
            <Text style={styles.title}>Create a story</Text>
            <Text style={styles.subtitle}>
              Create a personalised bedtime story for your child
            </Text>

            <Button
              title="Start"
              onPress={handleCreateStory}
              variant="primary"
              size="large"
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
