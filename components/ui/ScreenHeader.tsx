import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, Spacing, Typography } from "../../constants/Theme";
import { BackButton } from "./BackButton";

interface ScreenHeaderProps {
  title: string;
  showBackButton?: boolean;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  showBackButton = true,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.backButtonContainer}>
          {showBackButton && <BackButton style={styles.backButton} />}
        </View>

        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
        </View>

        <View style={styles.rightContainer} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    height: Spacing.navigationBarHeight,
    paddingHorizontal: Spacing.md,
  },
  backButtonContainer: {
    width: Spacing.navigationBarHeight,
    height: Spacing.navigationBarHeight,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  backButton: {
    marginBottom: 0, // Override the default margin from BackButton
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: Typography.fontSize.large,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.primary,
    textAlign: "center",
  },
  rightContainer: {
    width: 44,
    height: 44,
  },
});
