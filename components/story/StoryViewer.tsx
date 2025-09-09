// StoryViewer.tsx
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
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
import { logger } from "../../utils/logger";
import { Analytics } from "../../utils/analytics";
import {
  BorderRadius,
  Colors,
  Shadows,
  Spacing,
  Typography,
} from "../../constants/Theme";
import { LoadingSpinner } from "../shared/LoadingSpinner";
import { Button } from "../ui/Button";
import { CloseButton } from "../ui/CloseButton";
import { IconSymbol } from "../ui/IconSymbol";
import { TheEndScreen } from "./TheEndScreen";

const CREAM_COLOR = "#F5E6C8";

interface StoryViewerProps {
  story: Story;
  onClose?: () => void;
  onRetryImageGeneration?: (storyId: string, pageIndex: number) => void;
}

const StoryViewerComponent: React.FC<StoryViewerProps> = ({
  story,
  onClose,
  onRetryImageGeneration,
}) => {
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
  const [retryingGeneration, setRetryingGeneration] = useState(false);
  const [readingStartTime] = useState(Date.now());
  const hasTrackedCompletion = useRef(false);

  const listRef = useRef<FlatList<number>>(null);

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

  // Memoize the FlatList data array to prevent unnecessary re-renders
  const flatListData = useMemo(
    () => Array.from({ length: totalPages }, (_, i) => i),
    [totalPages]
  );

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
        // Also clear errors if we're retrying (status changed from failed to pending/generating)
        return (
          !page.imageUrl &&
          story.imageGenerationStatus !== "generating" &&
          story.imageGenerationStatus !== "pending" &&
          !retryingGeneration
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
  }, [story, fadeAnim, slideAnim, retryingGeneration]);

  // Track reading completion when user reaches the end screen
  useEffect(() => {
    const isOnEndScreen = currentPage === totalPages - 1;

    if (isOnEndScreen && !hasTrackedCompletion.current && totalPages > 1) {
      hasTrackedCompletion.current = true;

      const readingTime = Date.now() - readingStartTime;
      Analytics.logReadingSessionCompleted({
        story_id: story.id,
        pages_read: story.storyContent.length,
        total_pages: story.storyContent.length,
        reading_time_ms: readingTime,
      });
    }

    // Track reading abandonment if component unmounts before completion
    return () => {
      if (!hasTrackedCompletion.current && totalPages > 1) {
        const readingTime = Date.now() - readingStartTime;
        const pagesRead = Math.max(0, currentPage); // currentPage is 0-indexed
        const abandonPoint = totalPages > 0 ? pagesRead / (totalPages - 1) : 0; // Exclude end screen from total

        Analytics.logStoryReadingAbandoned({
          story_id: story.id,
          pages_read: pagesRead,
          abandon_point: abandonPoint,
          time_spent_ms: readingTime,
        });
      }
    };
  }, [
    currentPage,
    totalPages,
    story.id,
    story.storyContent.length,
    readingStartTime,
  ]);

  // keep correct offset after rotation / inset change
  useEffect(() => {
    // Ensure we stay on the same page index when dimensions change
    listRef.current?.scrollToIndex({ index: currentPage, animated: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageWidth]); // intentionally omitting currentPage - only for dimension changes

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

  const handleRetryClick = useCallback(
    async (pageIndex: number) => {
      if (!onRetryImageGeneration) return;

      setRetryingGeneration(true);

      // Store original states in case we need to revert
      const originalImageErrors = [...imageErrors];
      const originalImageLoading = [...imageLoading];

      try {
        // Optimistically update UI before the call
        setImageErrors((prev) => {
          const next = [...prev];
          next[pageIndex] = false;
          return next;
        });
        setImageLoading((prev) => {
          const next = [...prev];
          next[pageIndex] = true;
          return next;
        });

        logger.info(
          `StoryViewer calling retry for story ${story.id}, page ${pageIndex}`
        );
        await onRetryImageGeneration(story.id, pageIndex);
        // If we get here, the call succeeded and UI is already updated correctly
      } catch (error) {
        // If retry failed, revert to original states
        logger.error("Retry failed, reverting UI state:", error);
        setImageErrors(originalImageErrors);
        setImageLoading(originalImageLoading);
        // Parent component will show user-facing error messages via toast
      } finally {
        setRetryingGeneration(false);
      }
    },
    [onRetryImageGeneration, story.id, imageErrors, imageLoading]
  );

  const goToPage = useCallback(
    (idx: number) => {
      if (!story.storyContent) return;
      if (idx < 0 || idx >= totalPages) return;

      listRef.current?.scrollToIndex({ index: idx, animated: true });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [story.storyContent] // intentionally omitting totalPages - it's derived from story.storyContent
  );

  const handleNewStory = useCallback(() => {
    router.replace("/(tabs)/create");
  }, []);

  const handleBackToLibrary = useCallback(() => {
    router.replace("/(tabs)");
  }, []);

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
                      {story.imageGenerationStatus === "failed" &&
                        onRetryImageGeneration && (
                          <Button
                            title={retryingGeneration ? "Retrying..." : "Retry"}
                            onPress={() => handleRetryClick(index)}
                            variant="outline"
                            size="small"
                            style={styles.retryButton}
                            disabled={retryingGeneration}
                          />
                        )}
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
            <FlatList
              ref={listRef}
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
              data={flatListData}
              keyExtractor={(i) => String(i)}
              renderItem={({ index }) =>
                index < (story.storyContent?.length || 0) ? (
                  renderPage(story.storyContent[index], index)
                ) : (
                  <View style={[styles.pageContainer, { width: pageWidth }]}>
                    <TheEndScreen
                      onNewStory={handleNewStory}
                      onBackToLibrary={handleBackToLibrary}
                    />
                  </View>
                )
              }
              getItemLayout={(_, index) => ({
                length: pageWidth,
                offset: pageWidth * index,
                index,
              })}
              initialScrollIndex={0}
              onScrollToIndexFailed={(info) => {
                // In rare cases right after layout change, try again quickly
                setTimeout(() => {
                  listRef.current?.scrollToIndex({
                    index: info.index,
                    animated: false,
                  });
                }, 50);
              }}
              extraData={{
                pageWidth,
                imageLoading,
                imageErrors,
                textPanelMaxHeight,
                availableHeight,
              }}
            />
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

// Custom comparison function to prevent unnecessary re-renders during image generation
export const StoryViewer = React.memo(
  StoryViewerComponent,
  (prevProps, nextProps) => {
    // Always re-render if onClose function changes
    if (prevProps.onClose !== nextProps.onClose) {
      return false;
    }

    const prevStory = prevProps.story;
    const nextStory = nextProps.story;

    // Re-render if core story properties that affect UI have changed
    if (
      prevStory.id !== nextStory.id ||
      prevStory.title !== nextStory.title ||
      prevStory.imageGenerationStatus !== nextStory.imageGenerationStatus
    ) {
      return false;
    }

    const prevContent = prevStory.storyContent;
    const nextContent = nextStory.storyContent;

    // If references are the same, content is the same.
    if (prevContent === nextContent) {
      return true;
    }

    // If one is falsy or lengths differ, they are not equal.
    if (
      !prevContent ||
      !nextContent ||
      prevContent.length !== nextContent.length
    ) {
      return false;
    }

    // Deep compare each page.
    for (let i = 0; i < prevContent.length; i++) {
      const prevPage = prevContent[i];
      const nextPage = nextContent[i];

      // Defensive check (shouldn't be needed due to length check above)
      if (!prevPage || !nextPage) {
        return false;
      }

      if (
        prevPage.page !== nextPage.page ||
        prevPage.text !== nextPage.text ||
        prevPage.imageUrl !== nextPage.imageUrl
      ) {
        return false; // Page content is different
      }
    }

    // All UI-relevant props are the same, skip re-render
    return true;
  }
);

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
    gap: Spacing.md,
  },
  retryButton: {
    marginTop: Spacing.sm,
    minWidth: 80,
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
