import { useStorageUrl } from "@/hooks/useStorageUrl";
import { Story } from "@/types/story.types";
import { Image } from "expo-image";
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
import { Colors, Shadows, Spacing, Typography } from "../../constants/Theme";
import { Button } from "../ui/Button";

interface StoryTitleScreenProps {
  story: Story;
  onStartReading: () => void;
  onGoBack: () => void;
}

export const StoryTitleScreen: React.FC<StoryTitleScreenProps> = ({
  story,
  onStartReading,
  onGoBack,
}) => {
  const { width, height } = useWindowDimensions();
  const coverImageUrl = useStorageUrl(story.coverImageUrl);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const isLandscape = width > height;
  const minDim = Math.min(width, height);
  const maxDim = Math.max(width, height);
  const isTablet = maxDim >= 768 && minDim >= 500;

  const hasImage =
    story.storyConfiguration?.enableIllustrations !== false && !!coverImageUrl;

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
        colors={[Colors.backgroundGradientStart, Colors.backgroundGradientEnd]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          bounces={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent]}
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
              {/* TEXT COLUMN */}
              <View style={styles.textBlock}>
                <Text style={styles.title}>{story.title}</Text>

                {/* PORTRAIT: image under title */}
                {!isLandscape && hasImage && (
                  <View style={styles.imagePortrait}>
                    <Image
                      source={{ uri: coverImageUrl }}
                      style={styles.coverImage}
                      contentFit="cover"
                    />
                  </View>
                )}

                {/* Portrait or no-image fallback */}
                {(!isLandscape || !hasImage) && (
                  <Text style={styles.detailsLine}>
                    {story.storyContent.length} pages
                  </Text>
                )}

                <Button
                  title="Start reading"
                  onPress={onStartReading}
                  variant="wizard"
                  size="large"
                />

                <TouchableOpacity onPress={onGoBack}>
                  <Text style={styles.backText}>Back to library</Text>
                </TouchableOpacity>
              </View>

              {/* LANDSCAPE: image right, bigger on phones, pages below */}
              {isLandscape && hasImage && (
                <View style={styles.imageColumn}>
                  <View style={styles.imageLandscape}>
                    <Image
                      source={{ uri: coverImageUrl }}
                      style={styles.coverImage}
                      contentFit="cover"
                    />
                  </View>
                  <Text style={styles.detailsLineBelowImage}>
                    {story.storyContent.length} pages
                  </Text>
                </View>
              )}
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};

type StyleParams = {
  width: number;
  height: number;
  isTablet: boolean;
  isLandscape: boolean;
};

const createStyles = ({
  width,
  height,
  isTablet,
  isLandscape,
}: StyleParams) => {
  const supportsGap =
    Platform.OS !== "android" || Number(Platform.Version) >= 33;

  const portraitSize = isTablet ? 550 : 300;

  // Larger on phones in landscape; clamp by width so it doesn't overflow horizontally
  const baseShort = Math.min(width, height);
  const phoneLandscapeSize = Math.min(
    Math.floor(baseShort * 0.7),
    Math.floor(width * 0.7)
  );
  const tabletLandscapeSize = Math.floor(baseShort * 0.55);
  const landscapeSize = isTablet ? tabletLandscapeSize : phoneLandscapeSize;

  const commonImageFrame = {
    borderRadius: Spacing.xxl,
    overflow: "hidden" as const,
    borderWidth: isTablet ? 3 : 2,
    borderColor: Colors.primary,
    ...Shadows.glow,
  };

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    safeArea: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    animatedWrapper: {
      width: "100%",
      maxWidth: isLandscape ? width * 0.9 : "100%",
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    mainRow: {
      flexDirection: isLandscape ? "row" : "column",
      alignItems: "center",
      justifyContent: isLandscape ? "space-evenly" : "center",
      width: "100%",
    },
    textBlock: {
      flex: isLandscape ? 1 : undefined,
      alignItems: "center",
      justifyContent: "center",
      maxWidth: isLandscape ? width * 0.48 : "100%",
      ...(supportsGap ? {} : isLandscape ? { marginRight: Spacing.xxxl } : {}),
    },
    title: {
      fontFamily: Typography.fontFamily.primary,
      fontSize: isTablet
        ? Typography.fontSize.h1Tablet * 1.2
        : Typography.fontSize.h1Phone,
      color: Colors.primary,
      textAlign: "center",
      marginBottom: Spacing.huge,
      textShadowColor: "rgba(0,0,0,0.3)",
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
      fontWeight: Typography.fontWeight.bold,
    },
    imagePortrait: {
      width: portraitSize,
      height: portraitSize,
      marginBottom: Spacing.xxl,
      alignSelf: "center",
      ...commonImageFrame,
    },
    imageColumn: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    imageLandscape: {
      width: landscapeSize,
      aspectRatio: 1,
      alignSelf: "center",
      ...commonImageFrame,
    },
    coverImage: {
      width: "100%",
      height: "100%",
    },
    detailsLine: {
      fontSize: Typography.fontSize.medium,
      color: Colors.text,
      marginBottom: Spacing.huge,
      textAlign: "center",
      fontWeight: Typography.fontWeight.medium,
    },
    detailsLineBelowImage: {
      fontSize: Typography.fontSize.medium,
      color: Colors.text,
      marginTop: Spacing.lg,
      textAlign: "center",
      fontWeight: Typography.fontWeight.medium,
    },
    backText: {
      fontSize: Typography.fontSize.medium,
      color: Colors.text,
      opacity: 0.8,
      textAlign: "center",
      marginTop: Spacing.xl,
      textDecorationLine: "underline",
    },
  });
};
