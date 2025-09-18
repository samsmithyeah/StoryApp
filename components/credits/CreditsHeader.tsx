import { IconSymbol } from "@/components/ui/IconSymbol";
import {
  BorderRadius,
  Colors,
  CommonStyles,
  Spacing,
  Typography,
} from "@/constants/Theme";
import React, { useMemo } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import type { CreditsHeaderProps } from "./types";

export function CreditsHeader({
  userCredits,
  scaleAnim,
  fadeAnim,
}: CreditsHeaderProps) {
  const { width, height } = useWindowDimensions();
  const styles = useMemo(
    () =>
      createStyles({
        width,
        height,
      }),
    [width, height]
  );

  return (
    <View style={styles.header}>
      <Text style={styles.title}>Credits</Text>
      <View style={styles.headerBalance}>
        <Animated.View
          style={[
            {
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim,
            },
          ]}
        >
          <Animated.Text style={styles.headerBalanceAmount}>
            {userCredits?.balance || 0}
          </Animated.Text>
        </Animated.View>
        <IconSymbol name="sparkles" size={16} color={Colors.primary} />
      </View>
    </View>
  );
}

type StyleParams = {
  width: number;
  height: number;
};

const createStyles = ({ width, height }: StyleParams) => {
  const isTablet = width >= 768;
  const isNarrowPhone = !isTablet && width < 380;
  const isCompactHeight = height < 720;

  let titleFontSize = isTablet
    ? Typography.fontSize.h1Tablet
    : Typography.fontSize.h1Phone;

  if (!isTablet) {
    if (isCompactHeight) {
      titleFontSize *= 0.86;
    }
    if (isNarrowPhone) {
      titleFontSize *= 0.9;
    }
    titleFontSize = Math.max(titleFontSize, Typography.fontSize.h2 * 1.1);
  }

  const titleLineHeight = titleFontSize * (isTablet ? 1.08 : 1.05);
  const titleMarginBottom = isCompactHeight ? Spacing.md : Spacing.lg;
  const headerPaddingTop = isCompactHeight ? Spacing.xs : Spacing.sm;

  const badgePaddingHorizontal = isCompactHeight ? Spacing.xs : Spacing.sm;
  const badgePaddingVertical = isCompactHeight ? 4 : Spacing.xs;

  return StyleSheet.create({
    header: {
      marginBottom: titleMarginBottom,
      alignItems: "center",
      position: "relative",
      paddingTop: headerPaddingTop,
      minHeight: titleLineHeight + Spacing.lg,
    },
    title: {
      ...CommonStyles.brandTitle,
      fontSize: titleFontSize,
      lineHeight: titleLineHeight,
      textAlign: "center",
    },
    headerBalance: {
      position: "absolute",
      top: isCompactHeight ? Spacing.xs : 0,
      right: isNarrowPhone ? -4 : 0,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(212, 175, 55, 0.1)",
      borderRadius: BorderRadius.small,
      paddingHorizontal: badgePaddingHorizontal,
      paddingVertical: badgePaddingVertical,
      borderWidth: 1,
      borderColor: "rgba(212, 175, 55, 0.3)",
    },
    headerBalanceAmount: {
      fontSize: isNarrowPhone
        ? Typography.fontSize.small
        : Typography.fontSize.medium,
      fontWeight: Typography.fontWeight.bold,
      color: Colors.primary,
      marginRight: Spacing.xs,
    },
  });
};
