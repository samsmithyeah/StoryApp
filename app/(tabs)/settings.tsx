import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Dimensions,
  ImageBackground,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WelcomeOnboarding } from "../../components/onboarding/WelcomeOnboarding";
import { ChildProfileCard } from "../../components/settings/ChildProfileCard";
import { SavedCharacterCard } from "../../components/settings/SavedCharacterCard";
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
import { useSavedCharacters } from "../../hooks/useSavedCharacters";
import { useUserPreferences } from "../../hooks/useUserPreferences";
import { Child } from "../../types/child.types";
import { SavedCharacter } from "../../types/savedCharacter.types";

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

export default function SettingsScreen() {
  const router = useRouter();
  const { user, signOut, deleteAccount } = useAuth();
  const insets = useSafeAreaInsets();
  const {
    children,
    loading: _loading,
    error,
    addChild: _addChild,
    updateChild: _updateChild,
    deleteChild,
    clearError,
  } = useChildren();
  const {
    savedCharacters,
    loading: _savedCharsLoading,
    error: savedCharsError,
    deleteSavedCharacter,
    clearError: clearSavedCharsError,
  } = useSavedCharacters();
  const { preferences, updatePreferences } = useUserPreferences();

  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [showWelcomeWizard, setShowWelcomeWizard] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Only show advanced settings for admin users
  const isAdmin = user?.isAdmin === true;

  const handleAddChild = () => {
    router.push("/child-profile");
  };

  const handleEditChild = (child: Child) => {
    router.push(`/child-profile?childId=${child.id}`);
  };

  const handleDeleteChild = async (childId: string) => {
    try {
      await deleteChild(childId);
    } catch (error) {
      Alert.alert("Error", "Failed to delete child profile");
    }
  };

  const handleAddSavedCharacter = () => {
    router.push("/saved-character-profile");
  };

  const handleEditSavedCharacter = (character: SavedCharacter) => {
    router.push(`/saved-character-profile?characterId=${character.id}`);
  };

  const handleDeleteSavedCharacter = async (characterId: string) => {
    try {
      await deleteSavedCharacter(characterId);
    } catch (error) {
      Alert.alert("Error", "Failed to delete saved character");
    }
  };

  const handleSignOut = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Sign out",
        style: "destructive",
        onPress: signOut,
      },
    ]);
  };

  const handleDeleteAccount = () => {
    if (isDeleting) return; // Prevent multiple attempts
    
    Alert.alert(
      "Delete account",
      "This will permanently delete your account and all associated data including children profiles, saved characters, and stories. This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete account",
          style: "destructive",
          onPress: async () => {
            try {
              setIsDeleting(true);
              console.log("Starting account deletion...");
              console.log("Current user before deletion:", user?.uid);
              
              await deleteAccount();
              
              console.log("Delete account completed, current user:", user?.uid);
              
              // Show success message briefly before redirect
              Alert.alert(
                "Account deleted",
                "Your account and all data have been successfully deleted.",
                [{ 
                  text: "OK",
                  onPress: () => {
                    // Force navigation to login if auth state hasn't changed yet
                    console.log("User clicked OK, navigating to login");
                    router.replace("/(auth)/login");
                  }
                }]
              );
            } catch (error) {
              console.error("Delete account error:", error);
              Alert.alert(
                "Error", 
                "Failed to delete account. Please try again or contact support if the problem persists."
              );
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleShowWelcomeWizard = () => {
    setShowWelcomeWizard(true);
  };

  const handleWelcomeWizardComplete = () => {
    setShowWelcomeWizard(false);
  };

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
          style={[styles.scrollView, { marginTop: -insets.top }]}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop:
                insets.top +
                Spacing.screenPadding +
                (Platform.select({
                  android: StatusBar.currentHeight || 0,
                  ios: 0,
                }) || 0),
            },
          ]}
          contentInsetAdjustmentBehavior="never"
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
            </View>
            <Text style={styles.sectionDescription}>
              Add your children to create personalised stories
            </Text>

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
              title={
                children.length === 0 ? "Add a child" : "Add another child"
              }
              onPress={handleAddChild}
              leftIcon="plus"
              variant="outline"
              style={styles.addButton}
            />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Saved characters</Text>
            </View>
            <Text style={styles.sectionDescription}>
              Create reusable characters for your stories
            </Text>

            {savedCharsError && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{savedCharsError}</Text>
                <TouchableOpacity onPress={clearSavedCharsError}>
                  <IconSymbol name="xmark.circle" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            )}

            {savedCharacters.length === 0 ? (
              <View style={styles.emptyState}>
                <IconSymbol name="person.2.circle" size={64} color="#D1D5DB" />
                <Text style={styles.emptyStateTitle}>
                  No saved characters yet
                </Text>
                <Text style={styles.emptyStateText}>
                  Create characters that can be reused across multiple stories
                </Text>
              </View>
            ) : (
              <View style={styles.childrenList}>
                {savedCharacters.map((character) => (
                  <SavedCharacterCard
                    key={character.id}
                    character={character}
                    onEdit={handleEditSavedCharacter}
                    onDelete={handleDeleteSavedCharacter}
                  />
                ))}
              </View>
            )}

            <Button
              title={
                savedCharacters.length === 0
                  ? "Create a character"
                  : "Create another character"
              }
              onPress={handleAddSavedCharacter}
              leftIcon="plus"
              variant="outline"
              style={styles.addButton}
            />
          </View>

          {isAdmin && (
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => setShowAdvancedSettings(!showAdvancedSettings)}
              >
                <View>
                  <Text style={styles.sectionTitle}>Advanced Settings</Text>
                  <Text style={styles.sectionDescription}>
                    Configure AI model preferences
                  </Text>
                </View>
                <IconSymbol
                  name={showAdvancedSettings ? "chevron.up" : "chevron.down"}
                  size={20}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>

              {showAdvancedSettings && (
                <View style={styles.advancedSettingsContent}>
                  <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Story Text Model</Text>
                    <View style={styles.modelOptions}>
                      <TouchableOpacity
                        style={[
                          styles.modelOption,
                          preferences.textModel === "gpt-4o" &&
                            styles.selectedModelOption,
                        ]}
                        onPress={() =>
                          updatePreferences({ textModel: "gpt-4o" })
                        }
                      >
                        <Text
                          style={[
                            styles.modelOptionText,
                            preferences.textModel === "gpt-4o" &&
                              styles.selectedModelOptionText,
                          ]}
                        >
                          GPT-4o
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.modelOption,
                          preferences.textModel === "gemini-2.5-pro" &&
                            styles.selectedModelOption,
                        ]}
                        onPress={() =>
                          updatePreferences({ textModel: "gemini-2.5-pro" })
                        }
                      >
                        <Text
                          style={[
                            styles.modelOptionText,
                            preferences.textModel === "gemini-2.5-pro" &&
                              styles.selectedModelOptionText,
                          ]}
                        >
                          Gemini 2.5 Pro
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {preferences.textModel === "gemini-2.5-pro" && (
                    <View style={styles.settingItem}>
                      <Text style={styles.settingLabel}>
                        Gemini Thinking Budget
                      </Text>
                      <Text style={styles.settingDescription}>
                        Control how much reasoning the model applies to complex
                        tasks
                      </Text>
                      <View style={styles.modelOptions}>
                        <TouchableOpacity
                          style={[
                            styles.modelOption,
                            preferences.geminiThinkingBudget === -1 &&
                              styles.selectedModelOption,
                          ]}
                          onPress={() =>
                            updatePreferences({ geminiThinkingBudget: -1 })
                          }
                        >
                          <Text
                            style={[
                              styles.modelOptionText,
                              preferences.geminiThinkingBudget === -1 &&
                                styles.selectedModelOptionText,
                            ]}
                          >
                            Dynamic
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.modelOption,
                            preferences.geminiThinkingBudget === 128 &&
                              styles.selectedModelOption,
                          ]}
                          onPress={() =>
                            updatePreferences({ geminiThinkingBudget: 128 })
                          }
                        >
                          <Text
                            style={[
                              styles.modelOptionText,
                              preferences.geminiThinkingBudget === 128 &&
                                styles.selectedModelOptionText,
                            ]}
                          >
                            Minimal (128)
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.modelOption,
                            preferences.geminiThinkingBudget === 1024 &&
                              styles.selectedModelOption,
                          ]}
                          onPress={() =>
                            updatePreferences({ geminiThinkingBudget: 1024 })
                          }
                        >
                          <Text
                            style={[
                              styles.modelOptionText,
                              preferences.geminiThinkingBudget === 1024 &&
                                styles.selectedModelOptionText,
                            ]}
                          >
                            Low (1024)
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.modelOption,
                            preferences.geminiThinkingBudget === 4096 &&
                              styles.selectedModelOption,
                          ]}
                          onPress={() =>
                            updatePreferences({ geminiThinkingBudget: 4096 })
                          }
                        >
                          <Text
                            style={[
                              styles.modelOptionText,
                              preferences.geminiThinkingBudget === 4096 &&
                                styles.selectedModelOptionText,
                            ]}
                          >
                            Medium (4096)
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.modelOption,
                            preferences.geminiThinkingBudget === 16384 &&
                              styles.selectedModelOption,
                          ]}
                          onPress={() =>
                            updatePreferences({ geminiThinkingBudget: 16384 })
                          }
                        >
                          <Text
                            style={[
                              styles.modelOptionText,
                              preferences.geminiThinkingBudget === 16384 &&
                                styles.selectedModelOptionText,
                            ]}
                          >
                            High (16384)
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Temperature</Text>
                    <Text style={styles.settingDescription}>
                      Controls creativity and randomness (0.1 - 2.0)
                    </Text>
                    <TextInput
                      style={styles.temperatureInput}
                      value={preferences.temperature.toString()}
                      onChangeText={(text) => {
                        const value = parseFloat(text);
                        if (!isNaN(value) && value >= 0.1 && value <= 2.0) {
                          updatePreferences({ temperature: value });
                        }
                      }}
                      keyboardType="decimal-pad"
                      placeholder="0.9"
                      placeholderTextColor={Colors.textSecondary}
                    />
                  </View>

                  <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Cover Image Model</Text>
                    <View style={styles.modelOptions}>
                      <TouchableOpacity
                        style={[
                          styles.modelOption,
                          preferences.coverImageModel === "gpt-image-1" &&
                            styles.selectedModelOption,
                        ]}
                        onPress={() =>
                          updatePreferences({ coverImageModel: "gpt-image-1" })
                        }
                      >
                        <Text
                          style={[
                            styles.modelOptionText,
                            preferences.coverImageModel === "gpt-image-1" &&
                              styles.selectedModelOptionText,
                          ]}
                        >
                          GPT Image-1
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.modelOption,
                          preferences.coverImageModel === "dall-e-3" &&
                            styles.selectedModelOption,
                        ]}
                        onPress={() =>
                          updatePreferences({ coverImageModel: "dall-e-3" })
                        }
                      >
                        <Text
                          style={[
                            styles.modelOptionText,
                            preferences.coverImageModel === "dall-e-3" &&
                              styles.selectedModelOptionText,
                          ]}
                        >
                          DALL-E 3
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.modelOption,
                          preferences.coverImageModel ===
                            "gemini-2.0-flash-preview-image-generation" &&
                            styles.selectedModelOption,
                        ]}
                        onPress={() =>
                          updatePreferences({
                            coverImageModel:
                              "gemini-2.0-flash-preview-image-generation",
                          })
                        }
                      >
                        <Text
                          style={[
                            styles.modelOptionText,
                            preferences.coverImageModel ===
                              "gemini-2.0-flash-preview-image-generation" &&
                              styles.selectedModelOptionText,
                          ]}
                        >
                          Gemini
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Page Image Model</Text>
                    <View style={styles.modelOptions}>
                      <TouchableOpacity
                        style={[
                          styles.modelOption,
                          preferences.pageImageModel === "gpt-image-1" &&
                            styles.selectedModelOption,
                        ]}
                        onPress={() =>
                          updatePreferences({ pageImageModel: "gpt-image-1" })
                        }
                      >
                        <Text
                          style={[
                            styles.modelOptionText,
                            preferences.pageImageModel === "gpt-image-1" &&
                              styles.selectedModelOptionText,
                          ]}
                        >
                          GPT Image-1
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.modelOption,
                          preferences.pageImageModel === "flux" &&
                            styles.selectedModelOption,
                        ]}
                        onPress={() =>
                          updatePreferences({ pageImageModel: "flux" })
                        }
                      >
                        <Text
                          style={[
                            styles.modelOptionText,
                            preferences.pageImageModel === "flux" &&
                              styles.selectedModelOptionText,
                          ]}
                        >
                          FLUX
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.modelOption,
                          preferences.pageImageModel === "gemini" &&
                            styles.selectedModelOption,
                        ]}
                        onPress={() =>
                          updatePreferences({ pageImageModel: "gemini" })
                        }
                      >
                        <Text
                          style={[
                            styles.modelOptionText,
                            preferences.pageImageModel === "gemini" &&
                              styles.selectedModelOptionText,
                          ]}
                        >
                          Gemini
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
            </View>
          )}

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

            {isAdmin && (
              <Button
                title="Show welcome wizard"
                onPress={handleShowWelcomeWizard}
                variant="outline"
                style={styles.debugButton}
              />
            )}

            <Button
              title="Sign out"
              onPress={handleSignOut}
              variant="danger"
              style={styles.signOutButton}
            />

            <Button
              title={isDeleting ? "Deleting account..." : "Delete my account"}
              onPress={handleDeleteAccount}
              variant="danger"
              style={StyleSheet.flatten([styles.deleteAccountButton, isDeleting && styles.disabledButton])}
              textStyle={styles.deleteAccountButtonText}
              loading={isDeleting}
              disabled={isDeleting}
            />
          </View>
        </ScrollView>
      </SafeAreaView>

      <WelcomeOnboarding
        visible={showWelcomeWizard}
        onComplete={handleWelcomeWizardComplete}
      />
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
    marginBottom: Spacing.lg,
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
  debugButton: {
    marginBottom: Spacing.lg,
    borderColor: Colors.primary,
    backgroundColor: "rgba(212, 175, 55, 0.1)",
  },
  signOutButton: {
    borderColor: Colors.error,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    marginBottom: Spacing.lg,
  },
  deleteAccountButton: {
    borderColor: "#DC2626",
    backgroundColor: "#DC2626",
    borderWidth: 0,
  },
  deleteAccountButtonText: {
    color: Colors.text,
  },
  disabledButton: {
    opacity: 0.6,
  },
  star: {
    position: "absolute",
    width: 10,
    height: 10,
    opacity: 0.6,
  },
  advancedSettingsContent: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "rgba(212, 175, 55, 0.2)",
  },
  settingItem: {
    marginBottom: Spacing.xl,
  },
  settingLabel: {
    fontSize: Typography.fontSize.medium,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  settingDescription: {
    fontSize: Typography.fontSize.small,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  modelOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  modelOption: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  selectedModelOption: {
    backgroundColor: "rgba(212, 175, 55, 0.2)",
    borderColor: Colors.primary,
  },
  modelOptionText: {
    fontSize: Typography.fontSize.small,
    color: Colors.textSecondary,
  },
  selectedModelOptionText: {
    color: Colors.primary,
    fontWeight: Typography.fontWeight.semibold,
  },
  temperatureInput: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.medium,
    color: Colors.text,
    marginTop: Spacing.sm,
    maxWidth: 120,
  },
});
