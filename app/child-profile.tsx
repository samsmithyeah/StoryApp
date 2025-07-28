import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useRef } from "react";
import {
  Alert,
  ImageBackground,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ChildProfileForm } from "../components/settings/ChildProfileForm";
import { Colors, Spacing, Typography } from "../constants/Theme";
import { useChildren } from "../hooks/useChildren";
import { Child } from "../types/child.types";

export default function ChildProfileScreen() {
  const router = useRouter();
  const { childId } = useLocalSearchParams<{ childId?: string }>();
  const { children, loading, addChild, updateChild } = useChildren();
  const formRef = useRef<{
    handleSave: () => void;
    hasUnsavedChanges: () => boolean;
  }>(null);

  const child = childId ? children?.find((c) => c.id === childId) : undefined;

  const handleSave = async (childData: Omit<Child, "id">) => {
    try {
      if (childId && child) {
        await updateChild(childId, childData);
      } else {
        await addChild(childData);
      }
      router.back();
    } catch (error) {
      // Error handled in hook
      console.error("Save child error:", error);
    }
  };

  const handleCancel = () => {
    const hasChanges = formRef.current?.hasUnsavedChanges();

    if (hasChanges) {
      Alert.alert(
        "Discard changes?",
        "You have unsaved changes. Are you sure you want to discard them?",
        [
          {
            text: "Keep editing",
            style: "cancel",
          },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => router.back(),
          },
        ]
      );
    } else {
      router.back();
    }
  };

  return (
    <ImageBackground
      source={require("../assets/images/background-landscape.png")}
      resizeMode="cover"
      style={styles.container}
    >
      <LinearGradient
        colors={[Colors.backgroundGradientStart, Colors.backgroundGradientEnd]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={handleCancel}>
            <Text style={styles.headerButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {""}
          </Text>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => {
              // We'll need to trigger save from the form
              formRef.current?.handleSave();
            }}
            disabled={loading}
          >
            <Text
              style={[styles.headerButtonText, loading && styles.disabledText]}
            >
              Save
            </Text>
          </TouchableOpacity>
        </View>

        <ChildProfileForm
          ref={formRef}
          child={child}
          onSave={handleSave}
          onCancel={handleCancel}
          showCancelButton={false}
          loading={loading}
        />
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing.md,
  },
  headerButton: {
    padding: Spacing.sm,
    minWidth: 60,
  },
  headerButtonText: {
    fontSize: Typography.fontSize.medium,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.primary,
    textAlign: "center",
  },
  disabledText: {
    opacity: 0.5,
  },
  headerTitle: {
    flex: 1,
    fontSize: Typography.fontSize.h3,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary,
    textAlign: "center",
    fontFamily: Typography.fontFamily.primary,
  },
});
