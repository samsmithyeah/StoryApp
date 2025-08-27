import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  ImageBackground,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import {
  BorderRadius,
  Colors,
  Shadows,
  Spacing,
  Typography,
} from "../../constants/Theme";
import { Button } from "../ui/Button";

interface TheEndScreenProps {
  onNewStory: () => void;
  onBackToLibrary: () => void;
}

const CREAM = "#F5E6C8";

export const TheEndScreen: React.FC<TheEndScreenProps> = React.memo(
  ({ onNewStory, onBackToLibrary }) => {
    const { width, height } = useWindowDimensions();

    // Same animation pattern as StoryTitleScreen
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const scaleAnim = useRef(new Animated.Value(0.98)).current;

    const isLandscape = width > height;
    const minDim = Math.min(width, height);
    const maxDim = Math.max(width, height);
    const isTablet = maxDim >= 768 && minDim >= 500;

    useEffect(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]).start();
    }, [fadeAnim, slideAnim, scaleAnim]);

    const styles = useMemo(
      () => createStyles({ width, height, isTablet, isLandscape }),
      [width, height, isTablet, isLandscape]
    );

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
          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <Animated.View
              style={[
                styles.animatedWrapper,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
                },
              ]}
            >
              <View style={styles.mainRow}>
                {/* CARD COLUMN */}
                <View style={styles.cardColumn}>
                  {/* Single-layer card: matches StoryViewer.storyCard */}
                  <View style={styles.card}>
                    <Text accessibilityRole="header" style={styles.title}>
                      {`THE\nEND`}
                    </Text>
                  </View>
                </View>

                {/* CTA COLUMN (right on landscape, below on portrait) */}
                <View style={styles.ctaColumn}>
                  <View style={styles.ctaStack}>
                    <Button
                      title="Generate a new story"
                      onPress={onNewStory}
                      variant="wizard"
                      size="large"
                    />
                    <TouchableOpacity onPress={onBackToLibrary}>
                      <Text style={styles.backText}>Back to library</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      </ImageBackground>
    );
  }
);

TheEndScreen.displayName = "TheEndScreen";

type StyleParams = {
  width: number;
  height: number;
  isTablet: boolean;
  isLandscape: boolean;
};

const createStyles = ({ width, isTablet, isLandscape }: StyleParams) => {
  const supportsGap =
    Platform.OS !== "android" || Number(Platform.Version) >= 33;

  const cardMax = isLandscape
    ? Math.min(700, Math.floor(width * 0.55))
    : Math.min(560, Math.floor(width * 0.9));

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    safeArea: { flex: 1 },
    scrollContent: {
      flexGrow: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: Spacing.lg,
    },
    animatedWrapper: {
      width: "100%",
      maxWidth: isLandscape ? width * 0.9 : "100%",
      alignItems: "center",
      justifyContent: "center",
    },

    // Two-column layout (mirrors StoryTitleScreen)
    mainRow: {
      width: "100%",
      flexDirection: isLandscape ? "row" : "column",
      alignItems: "center",
      justifyContent: isLandscape ? "space-evenly" : "center",
      ...(supportsGap ? { gap: Spacing.huge } : {}),
    },
    cardColumn: {
      flex: isLandscape ? 1 : undefined,
      alignItems: "center",
      justifyContent: "center",
      maxWidth: isLandscape ? width * 0.55 : "100%",
      ...(supportsGap ? {} : isLandscape ? { marginRight: Spacing.xxxl } : {}),
    },
    ctaColumn: {
      flex: isLandscape ? 1 : undefined,
      alignItems: "center",
      justifyContent: "center",
      maxWidth: isLandscape ? width * 0.35 : "100%",
      marginTop: isLandscape ? 0 : Spacing.huge,
    },

    // Card style copied from StoryViewer.storyCard (plus padding)
    card: {
      backgroundColor: CREAM,
      width: "100%",
      maxWidth: cardMax,
      borderRadius: BorderRadius.large,
      borderWidth: 3,
      borderColor: Colors.primary,
      overflow: "hidden",
      ...Shadows.glow,
      paddingVertical: isTablet ? Spacing.xxxl * 2 : Spacing.xxxl * 1.6,
      paddingHorizontal: isTablet ? Spacing.xxxl * 1.6 : Spacing.xxxl * 1.2,
      alignItems: "center",
      justifyContent: "center",
      // iOS continuous curve for nicer corners (optional)
      ...(Platform.OS === "ios" ? { borderCurve: "continuous" as any } : {}),
    },

    // Black title to match other text components
    title: {
      fontFamily: Typography.fontFamily.primary,
      fontSize: isTablet
        ? Typography.fontSize.h1Tablet * 2.0
        : Typography.fontSize.h1Phone * 1.55,
      lineHeight: isTablet
        ? Typography.fontSize.h1Tablet * 2.0 * 1.05
        : Typography.fontSize.h1Phone * 1.55 * 1.05,
      color: Colors.textDark,
      textAlign: "center",
      letterSpacing: isTablet ? 8 : 6,
      textShadowColor: "rgba(0,0,0,0.12)",
      textShadowOffset: { width: 2, height: 2 },
      textShadowRadius: 3,
      fontWeight: Typography.fontWeight.bold,
    },

    // CTAs
    ctaStack: {
      alignItems: "center",
      width: "100%",
    },
    backText: {
      fontSize: Typography.fontSize.medium,
      color: Colors.text,
      opacity: 0.85,
      textAlign: "center",
      marginTop: Spacing.xl,
      textDecorationLine: "underline",
      fontWeight: Typography.fontWeight.medium,
    },
  });
};
