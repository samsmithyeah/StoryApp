import { useStorageUrl } from "@/hooks/useStorageUrl";
import { Story } from "@/types/story.types";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  ImageBackground,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Colors, Shadows, Spacing, Typography } from "../../constants/Theme";
import { LoadingSpinner } from "../shared/LoadingSpinner";
import { Button } from "../ui/Button";
import { CloseButton } from "../ui/CloseButton";

interface StoryTitleScreenProps {
  story: Story;
  onStartReading: () => void;
  onGoBack: () => void;
}

export const StoryTitleScreen: React.FC<StoryTitleScreenProps> = React.memo(
  ({ story, onStartReading, onGoBack }) => {
    const { width, height } = useWindowDimensions();

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    const isLandscape = width > height;
    const minDim = Math.min(width, height);
    const maxDim = Math.max(width, height);
    const isTablet = maxDim >= 768 && minDim >= 500;
    const isVerySmallScreen = height < 650;

    const [imageLoading, setImageLoading] = useState(true);
    const [imageError, setImageError] = useState(false);

    const coverImageUrl = useStorageUrl(story.coverImageUrl);
    const hasCoverImagePath = !!story.coverImageUrl;
    const isGeneratingCover =
      !story.coverImageUrl &&
      story.generationPhase !== "cover_complete" &&
      story.generationPhase !== "all_complete";
    const shouldShowImage = hasCoverImagePath && !imageError && coverImageUrl;
    const shouldShowSpinner =
      (hasCoverImagePath && imageLoading && !imageError) || isGeneratingCover;

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
      () =>
        createStyles({
          width,
          height,
          isTablet,
          isLandscape,
          isVerySmallScreen,
        }),
      [width, height, isTablet, isLandscape, isVerySmallScreen]
    );

    return (
      <ImageBackground
        source={require("../../assets/images/background-landscape.png")}
        resizeMode={isTablet ? "cover" : "none"}
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
          {/* Header with close button */}
          <View style={styles.header}>
            <View style={styles.placeholder} />
            <View style={styles.headerContent} />
            <CloseButton onPress={onGoBack} style={{ padding: 8 }} />
          </View>
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
                  {!isLandscape && (hasCoverImagePath || isGeneratingCover) && (
                    <View style={styles.imagePortrait}>
                      {shouldShowSpinner && (
                        <View style={styles.imageLoader}>
                          {isGeneratingCover ? (
                            <LoadingSpinner size="medium" showGlow={false} />
                          ) : (
                            <ActivityIndicator
                              size="large"
                              color={Colors.primary}
                            />
                          )}
                        </View>
                      )}
                      {shouldShowImage && (
                        <Image
                          source={{ uri: coverImageUrl }}
                          style={styles.coverImage}
                          contentFit="cover"
                          onLoad={() => setImageLoading(false)}
                          onError={() => {
                            setImageLoading(false);
                            setImageError(true);
                          }}
                        />
                      )}
                    </View>
                  )}

                  {/* Portrait or no-image fallback */}
                  {(!isLandscape ||
                    (!hasCoverImagePath && !isGeneratingCover)) && (
                    <Text style={styles.detailsLine}>
                      {story.storyContent.length} pages
                    </Text>
                  )}

                  <Button
                    title="Start reading"
                    onPress={onStartReading}
                    variant="wizard"
                    size={isVerySmallScreen ? "medium" : "large"}
                  />
                </View>

                {/* LANDSCAPE: image right, bigger on phones, pages below */}
                {isLandscape && (hasCoverImagePath || isGeneratingCover) && (
                  <View style={styles.imageColumn}>
                    <View style={styles.imageLandscape}>
                      {shouldShowSpinner && (
                        <View style={styles.imageLoader}>
                          {isGeneratingCover ? (
                            <LoadingSpinner size="medium" showGlow={false} />
                          ) : (
                            <ActivityIndicator
                              size="large"
                              color={Colors.primary}
                            />
                          )}
                        </View>
                      )}
                      {shouldShowImage && (
                        <Image
                          source={{ uri: coverImageUrl }}
                          style={styles.coverImage}
                          contentFit="cover"
                          onLoad={() => setImageLoading(false)}
                          onError={() => {
                            setImageLoading(false);
                            setImageError(true);
                          }}
                        />
                      )}
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
  }
);

StoryTitleScreen.displayName = "StoryTitleScreen";

type StyleParams = {
  width: number;
  height: number;
  isTablet: boolean;
  isLandscape: boolean;
  isVerySmallScreen: boolean;
};

const createStyles = ({
  width,
  height,
  isTablet,
  isLandscape,
  isVerySmallScreen,
}: StyleParams) => {
  const supportsGap =
    Platform.OS !== "android" || Number(Platform.Version) >= 33;

  const portraitSize = isTablet ? 550 : isVerySmallScreen ? 200 : 300;

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
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 24,
      paddingTop: Platform.select({
        android: StatusBar.currentHeight || 0,
        ios: isTablet ? 20 : 0,
      }),
    },
    placeholder: {
      padding: 8,
      minWidth: 40,
    },
    headerContent: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
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
      marginBottom: isVerySmallScreen ? Spacing.xl : Spacing.massive,
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
        : isVerySmallScreen
          ? Typography.fontSize.h2
          : Typography.fontSize.h1Phone,
      color: Colors.primary,
      textAlign: "center",
      marginBottom: isVerySmallScreen ? Spacing.xl : Spacing.huge,
      textShadowColor: "rgba(0,0,0,0.3)",
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
      fontWeight: Typography.fontWeight.bold,
    },
    imagePortrait: {
      width: portraitSize,
      height: portraitSize,
      marginBottom: isVerySmallScreen ? Spacing.lg : Spacing.xxl,
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
    imageLoader: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1,
    },
    detailsLine: {
      fontSize: isVerySmallScreen
        ? Typography.fontSize.small
        : Typography.fontSize.medium,
      color: Colors.text,
      marginBottom: isVerySmallScreen ? Spacing.xl : Spacing.huge,
      textAlign: "center",
      fontWeight: Typography.fontWeight.medium,
    },
    detailsLineBelowImage: {
      fontSize: isVerySmallScreen
        ? Typography.fontSize.small
        : Typography.fontSize.medium,
      color: Colors.text,
      marginTop: isVerySmallScreen ? Spacing.md : Spacing.lg,
      textAlign: "center",
      fontWeight: Typography.fontWeight.medium,
    },
  });
};
