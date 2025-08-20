// StoryViewer.tsx
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  ImageBackground,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { useStorageUrls } from "@/hooks/useStorageUrl";
import { Story } from "@/types/story.types";
import {
  BorderRadius,
  Colors,
  Shadows,
  Spacing,
  Typography,
} from "../../constants/Theme";
import { LoadingSpinner } from "../shared/LoadingSpinner";
import { CloseButton } from "../ui/CloseButton";
import { IconSymbol } from "../ui/IconSymbol";
import { TheEndScreen } from "./TheEndScreen";

const CREAM_COLOR = "#F5E6C8";

interface StoryViewerProps {
  story: Story;
  onClose?: () => void;
}

export const StoryViewer: React.FC<StoryViewerProps> = ({ story, onClose }) => {
  const { width: winWidth, height: winHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const isLandscape = winWidth > winHeight;
  const isTablet = Math.min(winWidth, winHeight) >= 768;
  const isIPhoneLandscape = Platform.OS === "ios" && !isTablet && isLandscape;

  // **Critical piece** – this is the width we actually use for paging/layout
  const pageWidth = isIPhoneLandscape
    ? winWidth - (insets.left + insets.right)
    : winWidth;

  const [currentPage, setCurrentPage] = useState(0);
  const [imageLoading, setImageLoading] = useState<boolean[]>([]);
  const [imageErrors, setImageErrors] = useState<boolean[]>([]);

  const scrollViewRef = useRef<ScrollView>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const imagePaths = story.storyContent?.map((p) => p.imageUrl) || [];
  const imageUrls = useStorageUrls(imagePaths);
  const hasImages = true;

  const headerHeight = isTablet ? 72 : 56;
  const cardChrome = 10 + 6;

  // Height can still use total height minus top/bottom insets
  const availableHeight =
    winHeight - (insets.top + insets.bottom + headerHeight + cardChrome);

  const textPanelMaxPct = isTablet ? (isLandscape ? 0.38 : 0.44) : 0.48;
  const textPanelMaxHeight = Math.round(availableHeight * textPanelMaxPct);

  const totalPages = story.storyContent ? story.storyContent.length + 1 : 0; // +1 for the end screen

  useEffect(() => {
    if (Array.isArray(story.storyContent)) {
      // Initialize based on each page's current state
      const initialLoading = story.storyContent.map((page) => {
        // Show loading if there's an imageUrl (needs to load) or if generation is active
        return (
          !!page.imageUrl ||
          (!page.imageUrl &&
            (story.imageGenerationStatus === "generating" ||
              story.imageGenerationStatus === "pending"))
        );
      });

      const initialErrors = story.storyContent.map((page) => {
        // Show error if no imageUrl and generation is not active (completed, failed, or not_requested)
        return (
          !page.imageUrl &&
          story.imageGenerationStatus !== "generating" &&
          story.imageGenerationStatus !== "pending"
        );
      });

      setImageLoading(initialLoading);
      setImageErrors(initialErrors);
    }
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [story, fadeAnim, slideAnim]);

  // keep correct offset after rotation / inset change
  useEffect(() => {
    scrollViewRef.current?.scrollTo({
      x: currentPage * pageWidth,
      y: 0,
      animated: false,
    });
  }, [pageWidth, currentPage]);

  const handleImageLoad = (idx: number) =>
    setImageLoading((prev) => {
      const next = [...prev];
      next[idx] = false;
      return next;
    });

  const handleImageError = (idx: number) => {
    setImageLoading((prev) => {
      const next = [...prev];
      next[idx] = false;
      return next;
    });
    setImageErrors((prev) => {
      const next = [...prev];
      next[idx] = true;
      return next;
    });
  };

  const goToPage = useCallback(
    (idx: number) => {
      if (!story.storyContent) return;
      if (idx < 0 || idx >= totalPages) return;

      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({
          x: idx * pageWidth,
          y: 0,
          animated: true,
        });
      }
    },
    [story.storyContent, pageWidth, totalPages]
  );

  const handleHorizontalScroll = (e: any) => {
    const pageIdx = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
    if (pageIdx !== currentPage) setCurrentPage(pageIdx);
  };

  const renderPage = (page: any, index: number) => {
    const pageText = page.text || "";
    const imageUrl = imageUrls[index];

    return (
      <View key={index} style={[styles.pageContainer, { width: pageWidth }]}>
        <View style={styles.pageContent}>
          <View style={styles.storyCardWrapper}>
            <View style={[styles.storyCard, { height: availableHeight }]}>
              {hasImages && (
                <View style={[styles.imageContainer, styles.imageFlex]}>
                  {imageLoading[index] && !imageErrors[index] && (
                    <View style={styles.imageLoader}>
                      {!page.imageUrl &&
                      (story.imageGenerationStatus === "generating" ||
                        story.imageGenerationStatus === "pending") ? (
                        <LoadingSpinner size="medium" showGlow={false} />
                      ) : (
                        <ActivityIndicator
                          size="large"
                          color={Colors.primary}
                        />
                      )}
                    </View>
                  )}
                  {imageErrors[index] ? (
                    <View style={styles.errorImage}>
                      <IconSymbol
                        name="exclamationmark.triangle"
                        size={48}
                        color={Colors.error}
                      />
                      <Text style={styles.errorText}>
                        {story.imageGenerationStatus === "failed"
                          ? "Image generation failed"
                          : "Image failed to load"}
                      </Text>
                    </View>
                  ) : imageUrl ? (
                    <Image
                      source={{ uri: imageUrl }}
                      style={styles.pageImage}
                      contentFit="cover"
                      onLoad={() => handleImageLoad(index)}
                      onError={() => handleImageError(index)}
                    />
                  ) : !imageLoading[index] ? (
                    <View style={styles.errorImage}>
                      <IconSymbol
                        name="photo.badge.exclamationmark"
                        size={48}
                        color={Colors.textMuted}
                      />
                      <Text style={styles.errorText}>No image available</Text>
                    </View>
                  ) : null}
                </View>
              )}

              <View
                style={[
                  styles.textPanel,
                  !hasImages && styles.textPanelNoImages,
                  {
                    maxHeight: hasImages ? textPanelMaxHeight : availableHeight,
                  },
                ]}
              >
                <ScrollView
                  nestedScrollEnabled
                  showsVerticalScrollIndicator={false}
                  style={{
                    flexGrow: 0,
                    maxHeight: hasImages
                      ? textPanelMaxHeight - 24
                      : availableHeight - 28,
                  }}
                  contentContainerStyle={{ paddingBottom: Spacing.sm }}
                >
                  <Text
                    style={[
                      styles.pageText,
                      !hasImages && styles.pageTextLarge,
                      { textAlign: "center" },
                    ]}
                  >
                    {pageText}
                  </Text>
                </ScrollView>
                <Text style={styles.pageNumber}>
                  Page {page.page} of {story.storyContent?.length || 0}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (!Array.isArray(story.storyContent) || story.storyContent.length === 0) {
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
        <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{story.title}</Text>
            </View>
            <CloseButton
              onPress={onClose || (() => router.replace("/(tabs)"))}
              style={styles.closeButton}
            />
          </View>
          <View style={styles.errorContainer}>
            <IconSymbol
              name="exclamationmark.circle"
              size={48}
              color={Colors.primary}
            />
            <Text style={styles.errorText}>Story content is loading...</Text>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  const isFirst = currentPage === 0;
  const isLast = currentPage === totalPages - 1;

  return (
    <ImageBackground
      source={require("../../assets/images/background-landscape.png")}
      resizeMode={isTablet ? "cover" : "none"}
      style={styles.container}
    >
      <LinearGradient
        colors={[Colors.backgroundGradientStart, Colors.backgroundGradientEnd]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text
              style={[
                styles.title,
                {
                  fontSize: isTablet
                    ? Typography.fontSize.h2
                    : Typography.fontSize.h4,
                },
              ]}
            >
              {story.title}
            </Text>
          </View>
          <CloseButton
            onPress={onClose || (() => router.replace("/(tabs)"))}
            style={styles.closeButton}
          />
        </View>

        {/* CONTENT CONTAINER */}
        <View style={{ flex: 1 }}>
          {/* PAGES */}
          <Animated.View
            style={{
              flex: 1,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            <ScrollView
              ref={scrollViewRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handleHorizontalScroll}
              style={[
                styles.scrollView,
                { width: pageWidth, alignSelf: "center" },
              ]}
              scrollEnabled={true}
              decelerationRate="fast"
            >
              {story.storyContent.map((p, i) => renderPage(p, i))}
              {/* The End Screen */}
              <View
                key="end-screen"
                style={[styles.pageContainer, { width: pageWidth }]}
              >
                <TheEndScreen
                  onNewStory={() => router.replace("/(tabs)/create")}
                  onBackToLibrary={() => router.replace("/(tabs)")}
                />
              </View>
            </ScrollView>
          </Animated.View>

          {/* NAV ARROWS */}
          <TouchableOpacity
            onPress={() => goToPage(currentPage - 1)}
            disabled={isFirst}
            style={[
              styles.navArrowLeft,
              isFirst && styles.navArrowDisabled,
              // Keep them visually inside safe area on iPhone landscape
              isIPhoneLandscape && { left: Spacing.xs + insets.left },
            ]}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            activeOpacity={0.7}
          >
            <IconSymbol
              name="chevron.left"
              size={24}
              color={isFirst ? Colors.textMuted : Colors.text}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => goToPage(currentPage + 1)}
            disabled={isLast}
            style={[
              styles.navArrowRight,
              isLast && styles.navArrowDisabled,
              isIPhoneLandscape && { right: Spacing.xs + insets.right },
            ]}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            activeOpacity={0.7}
          >
            <IconSymbol
              name="chevron.right"
              size={24}
              color={isLast ? Colors.textMuted : Colors.text}
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};

/* ---------- STYLES ---------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  safeArea: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    position: "relative",
    minHeight: 56,
  },
  titleContainer: {
    flex: 1,
    paddingHorizontal: 56,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontFamily: Typography.fontFamily.primary,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  closeButton: {
    position: "absolute",
    right: Spacing.screenPadding,
    top: Spacing.md,
    padding: 8,
    marginRight: -8,
  },

  scrollView: { flex: 1 },

  pageContainer: { flex: 1 },
  pageContent: {
    flex: 1,
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },

  storyCardWrapper: { flex: 1 },

  storyCard: {
    flex: 1,
    flexDirection: "column",
    borderRadius: BorderRadius.large,
    borderWidth: 3,
    borderColor: Colors.primary,
    overflow: "hidden",
    backgroundColor: Colors.cardBackground,
    ...Shadows.glow,
  },

  imageContainer: {
    backgroundColor: Colors.placeholderBackground,
    position: "relative",
    width: "100%",
  },
  imageFlex: { flex: 1, minHeight: 120 },
  pageImage: { width: "100%", height: "100%" },
  imageLoader: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -50 }, { translateY: -50 }],
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderImage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorImage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },

  textPanel: {
    backgroundColor: CREAM_COLOR,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginTop: "auto",
    width: "100%",
  },
  textPanelNoImages: {
    flex: 1,
    justifyContent: "space-between",
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
  },
  pageText: {
    fontFamily: Typography.fontFamily.primary,
    color: Colors.textDark,
    fontWeight: Typography.fontWeight.regular,
    fontSize: Typography.fontSize.medium,
    lineHeight: 22,
  },
  pageTextLarge: {
    fontSize: Typography.fontSize.h3,
    lineHeight: 32,
    fontWeight: Typography.fontWeight.medium,
  },
  pageNumber: {
    fontSize: Typography.fontSize.small,
    color: "#8B7355",
    textAlign: "center",
    marginTop: Spacing.sm,
    fontWeight: Typography.fontWeight.medium,
  },

  navArrowLeft: {
    position: "absolute",
    left: Spacing.xs,
    top: "50%",
    transform: [{ translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    ...(Platform.OS === "android" ? { elevation: 10 } : {}),
  },
  navArrowRight: {
    position: "absolute",
    right: Spacing.xs,
    top: "50%",
    transform: [{ translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    ...(Platform.OS === "android" ? { elevation: 10 } : {}),
  },
  navArrowDisabled: { opacity: 0.3 },

  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xxxl,
  },
  errorText: {
    fontSize: Typography.fontSize.small,
    color: Colors.error,
    textAlign: "center",
    marginTop: Spacing.sm,
    fontWeight: Typography.fontWeight.medium,
  },
});
