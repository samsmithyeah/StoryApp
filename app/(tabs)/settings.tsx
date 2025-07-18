import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Alert,
  Dimensions,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ChildProfileCard } from "../../components/settings/ChildProfileCard";
import { ChildProfileForm } from "../../components/settings/ChildProfileForm";
import { Button } from "../../components/ui/Button";
import { IconSymbol } from "../../components/ui/IconSymbol";
import {
  Colors,
  CommonStyles,
  Spacing,
  Typography,
} from "../../constants/Theme";
import { useAuth } from "../../hooks/useAuth";
import { useChildren } from "../../hooks/useChildren";
import { Child } from "../../types/child.types";

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const {
    children,
    loading,
    error,
    addChild,
    updateChild,
    deleteChild,
    clearError,
  } = useChildren();

  const [showForm, setShowForm] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);

  const handleAddChild = () => {
    setEditingChild(null);
    setShowForm(true);
  };

  const handleEditChild = (child: Child) => {
    setEditingChild(child);
    setShowForm(true);
  };

  const handleSaveChild = async (childData: Omit<Child, "id">) => {
    try {
      if (editingChild) {
        await updateChild(editingChild.id, childData);
      } else {
        await addChild(childData);
      }
      setShowForm(false);
      setEditingChild(null);
    } catch (error) {
      // Error handled in hook
      console.error("Save child error:", error);
    }
  };

  const handleDeleteChild = async (childId: string) => {
    try {
      await deleteChild(childId);
    } catch (error) {
      Alert.alert("Error", "Failed to delete child profile");
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingChild(null);
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: signOut,
      },
    ]);
  };

  if (showForm) {
    return (
      <ImageBackground
        source={require("../../assets/images/background-landscape.png")}
        resizeMode="cover"
        style={styles.container}
      >
        <LinearGradient
          colors={[
            Colors.backgroundGradientStart,
            Colors.backgroundGradientEnd,
          ]}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.formHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleCancelForm}
            >
              <IconSymbol
                name="chevron.left"
                size={24}
                color={Colors.primary}
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Settings</Text>
            <View style={styles.headerSpacer} />
          </View>

          <ChildProfileForm
            child={editingChild || undefined}
            onSave={handleSaveChild}
            onCancel={handleCancelForm}
            loading={loading}
          />
        </SafeAreaView>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={require("../../assets/images/background-landscape.png")}
      resizeMode="cover"
      style={styles.container}
    >
      <LinearGradient
        colors={[Colors.backgroundGradientStart, Colors.backgroundGradientEnd]}
        style={StyleSheet.absoluteFill}
      />

      <Decorations />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Settings</Text>
            <Text style={styles.subtitle}>
              Manage your family and app preferences
            </Text>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={clearError}>
                <IconSymbol name="xmark.circle" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Children's profiles</Text>
              <Text style={styles.sectionDescription}>
                Add your children to create personalised stories
              </Text>
            </View>

            {children.length === 0 ? (
              <View style={styles.emptyState}>
                <IconSymbol
                  name="figure.child.circle"
                  size={64}
                  color="#D1D5DB"
                />
                <Text style={styles.emptyStateTitle}>
                  No children added yet
                </Text>
                <Text style={styles.emptyStateText}>
                  Add your first child to start creating magical personalized
                  stories
                </Text>
              </View>
            ) : (
              <View style={styles.childrenList}>
                {children.map((child) => (
                  <ChildProfileCard
                    key={child.id}
                    child={child}
                    onEdit={handleEditChild}
                    onDelete={handleDeleteChild}
                  />
                ))}
              </View>
            )}

            <Button
              title="Add another child"
              onPress={handleAddChild}
              leftIcon="plus"
              variant="outline"
              style={styles.addButton}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>

            <View style={styles.accountInfo}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>
                  {user?.displayName?.charAt(0).toUpperCase() ||
                    user?.email?.charAt(0).toUpperCase() ||
                    "?"}
                </Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>
                  {user?.displayName || "User"}
                </Text>
                <Text style={styles.userEmail}>{user?.email}</Text>
              </View>
            </View>

            <Button
              title="Sign out"
              onPress={handleSignOut}
              variant="danger"
              style={styles.signOutButton}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

// Decorations component for background elements
function Decorations() {
  return (
    <>
      {/* Stars */}
      {STAR_POSITIONS.map((pos, i) => (
        <Image
          key={`star-${i}`}
          source={require("../../assets/images/star.png")}
          style={[styles.star, pos]}
        />
      ))}
    </>
  );
}

const STAR_POSITIONS = [
  { top: 80, left: 40 },
  { top: 120, right: 60 },
  { top: 200, left: 100 },
  { bottom: 150, left: 60 },
  { bottom: 100, right: 80 },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
  },
  formHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing.lg,
    backgroundColor: "transparent",
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: Typography.fontSize.h3,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary,
    fontFamily: Typography.fontFamily.primary,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing.screenPadding,
  },
  header: {
    marginBottom: Spacing.xxxl,
    alignItems: "center",
  },
  title: {
    ...CommonStyles.brandTitle,
    fontSize: isTablet
      ? Typography.fontSize.h1Tablet
      : Typography.fontSize.h1Phone,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    fontSize: Typography.fontSize.medium,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    marginBottom: Spacing.screenPadding,
  },
  errorText: {
    flex: 1,
    fontSize: Typography.fontSize.small,
    color: Colors.error,
  },
  section: {
    marginBottom: Spacing.xxxl,
  },
  sectionHeader: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary,
    marginBottom: Spacing.xs,
    fontFamily: Typography.fontFamily.primary,
  },
  sectionDescription: {
    fontSize: Typography.fontSize.small,
    color: Colors.textSecondary,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing.huge,
    paddingHorizontal: Spacing.screenPadding,
  },
  emptyStateTitle: {
    fontSize: Typography.fontSize.large,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyStateText: {
    fontSize: Typography.fontSize.small,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  childrenList: {
    marginBottom: Spacing.lg,
  },
  addButton: {
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: "dashed",
  },
  accountInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: Spacing.lg,
    borderRadius: 16,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  userAvatarText: {
    fontSize: Typography.fontSize.large,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textDark,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: Typography.fontSize.medium,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: Typography.fontSize.small,
    color: Colors.textSecondary,
  },
  signOutButton: {
    borderColor: Colors.error,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  star: {
    position: "absolute",
    width: 10,
    height: 10,
    opacity: 0.6,
  },
});
