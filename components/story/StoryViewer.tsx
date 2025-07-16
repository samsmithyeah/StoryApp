import { useStorageUrls } from "@/hooks/useStorageUrl";
import { Story } from "@/types/story.types";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BorderRadius,
  Colors,
  Shadows,
  Spacing,
  Typography,
} from "../../constants/Theme";
import { IconSymbol } from "../ui/IconSymbol";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const isTablet = screenWidth >= 768;
const CREAM_COLOR = "#F5E6C8";

interface StoryViewerProps {
  story: Story;
  onClose?: () => void;
}

export const StoryViewer: React.FC<StoryViewerProps> = ({ story, onClose }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [imageLoading, setImageLoading] = useState<boolean[]>([]);
  /**
   * We keep a cache of measured text heights, one per page. Undefined until first layout pass.
   */
  const [textHeights, setTextHeights] = useState<(number | undefined)[]>([]);

  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Fetch signed URLs for all illustration images
  const imagePaths = story.storyContent?.map((p) => p.imageUrl) || [];
  const imageUrls = useStorageUrls(imagePaths);

  // Calculate some static paddings / sizes
  const headerHeight = 80;
  const cardExtraVertical = 10 /*cardPadding*/ + 6; /*border*/

  useEffect(() => {
    // Prepare loading + height caches when story changes
    if (Array.isArray(story.storyContent)) {
      setImageLoading(Array(story.storyContent.length).fill(true));
      setTextHeights(Array(story.storyContent.length).fill(undefined));
    }

    // Mount animation
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
  }, [story]);

  const handleImageLoad = (index: number) =>
    setImageLoading((prev) => {
      const next = [...prev];
      next[index] = false;
      return next;
    });

  const goToPage = (idx: number) => {
    if (!story.storyContent) return;
    if (idx < 0 || idx >= story.storyContent.length) return;
    setCurrentPage(idx);
    scrollViewRef.current?.scrollTo({ x: idx * screenWidth, animated: true });
  };

  /** Handle horizontal swipes */
  const handleScroll = (e: any) => {
    const pageIdx = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
    if (
      pageIdx !== currentPage &&
      pageIdx >= 0 &&
      pageIdx < (story.storyContent?.length || 0)
    )
      setCurrentPage(pageIdx);
  };

  /**
   * Given the measured number of lines for this page, compute the full panel height.
   */
  const resolvePanelHeight = (lineCount: number, fontLineHeight: number) => {
    const verticalPadding = isTablet ? Spacing.sm : Spacing.lg;
    const pageNumberBlock = fontLineHeight + Spacing.xs; // number + margin
    return lineCount * fontLineHeight + verticalPadding + pageNumberBlock;
  };

  /** The main renderer for every story page */
  const renderPage = (page: any, index: number) => {
    // Fallback text if page.text is undefined (should not happen in production)
    const pageText = page.text || "";
    const imageUrl = imageUrls[index];

    /**
     * Height of the entire card, minus safe‑area and header
     */
    const availableHeight =
      screenHeight -
      (insets.top + insets.bottom + headerHeight + cardExtraVertical);

    // If we haven't measured this page yet, use a placeholder height so layout is predictable.
    const measuredPanelHeight = textHeights[index] ?? 120;
    const imageDisplayHeight = availableHeight - measuredPanelHeight;

    /**
     * Callback invoked after RN lays out the <Text> element. We fire only once per page
     * to avoid endless re‑renders.
     */
    const handleTextLayout = (e: any) => {
      if (textHeights[index] !== undefined) return; // already cached
      const lines = e.nativeEvent.lines as { text: string }[];
      const baseLineHeight = isTablet ? 28 : 22;
      const panelHeight = resolvePanelHeight(lines.length, baseLineHeight);

      setTextHeights((prev) => {
        const next = [...prev];
        next[index] = panelHeight;
        return next;
      });
    };

    return (
      <View key={index} style={styles.pageContainer}>
        <View style={styles.pageContent}>
          <View style={[styles.storyCard, { height: availableHeight }]}>
            {imageUrl ? (
              <View
                style={[styles.imageContainer, { height: imageDisplayHeight }]}
              >
                {imageLoading[index] && (
                  <ActivityIndicator
                    size="large"
                    color={Colors.primary}
                    style={styles.imageLoader}
                  />
                )}
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.pageImage}
                  onLoad={() => handleImageLoad(index)}
                  contentFit="cover"
                />
              </View>
            ) : (
              <View
                style={[
                  styles.placeholderImage,
                  { height: imageDisplayHeight },
                ]}
              >
                <IconSymbol name="photo" size={48} color={Colors.textMuted} />
                {(story.imageGenerationStatus === "generating" ||
                  story.imageGenerationStatus === "pending") && (
                  <View style={styles.placeholderLoadingContainer}>
                    <ActivityIndicator
                      size="small"
                      color={Colors.primary}
                      style={styles.placeholderSpinner}
                    />
                    <Text style={styles.placeholderText}>
                      Image generating...
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* TEXT PANEL */}
            <View
              style={[styles.textPanel, { height: measuredPanelHeight }]}
              /**
               * Hide until we know the actual height to prevent flicker on first render
               */
            >
              <Text onTextLayout={handleTextLayout} style={styles.pageText}>
                {pageText}
              </Text>
              <Text style={styles.pageNumber}>
                Page {page.page} of {story.storyContent?.length || 0}
              </Text>
            </View>
          </View>
        </View>
        {index === currentPage && renderImageGenerationStatus()}
      </View>
    );
  };

  /** IMAGE‑GEN STATUS BANNER */
  const renderImageGenerationStatus = () => {
    if (
      story.imageGenerationStatus === "not_requested" ||
      !story.storyConfiguration?.illustrationStyle
    )
      return null;

    if (
      story.imageGenerationStatus === "pending" ||
      story.imageGenerationStatus === "generating"
    ) {
      const progress = (story.imagesGenerated || 0) / (story.totalImages || 1);
      return (
        <View style={styles.imageGenerationStatus}>
          <Text style={styles.imageGenerationText}>
            Generating illustrations... {story.imagesGenerated || 0} of{" "}
            {story.totalImages || 0}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${progress * 100}%` }]}
            />
          </View>
        </View>
      );
    }

    if (story.imageGenerationStatus === "failed") {
      return (
        <View style={styles.imageGenerationStatus}>
          <Text style={styles.imageGenerationErrorText}>
            Some illustrations couldn't be generated
          </Text>
        </View>
      );
    }
    return null;
  };

  /** EARLY RETURN UNTIL storyContent EXISTS */
  if (!Array.isArray(story.storyContent) || story.storyContent.length === 0) {
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
          <View style={styles.header}>
            <TouchableOpacity
              onPress={onClose || (() => router.back())}
              style={styles.closeButton}
            >
              <IconSymbol name="xmark" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.title}>{story.title}</Text>
            <View style={{ width: 40 }} />
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

  const isFirstPage = currentPage === 0;
  const isLastPage = currentPage === story.storyContent.length - 1;

  /** MAIN RENDER */
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
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.closeButtonContainer}>
            <TouchableOpacity
              onPress={onClose || (() => router.back())}
              style={styles.closeButton}
            >
              <IconSymbol name="xmark" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.title}>{story.title}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* CONTENT */}
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
            onMomentumScrollEnd={handleScroll}
            style={styles.scrollView}
          >
            {story.storyContent.map((p, i) => renderPage(p, i))}
          </ScrollView>

          {/* LEFT NAV */}
          <TouchableOpacity
            onPress={() => goToPage(currentPage - 1)}
            disabled={isFirstPage}
            style={[
              styles.navArrowLeft,
              isFirstPage && styles.navArrowDisabled,
            ]}
          >
            <IconSymbol
              name="chevron.left"
              size={24}
              color={isFirstPage ? Colors.textMuted : Colors.text}
            />
          </TouchableOpacity>

          {/* RIGHT NAV */}
          <TouchableOpacity
            onPress={() => goToPage(currentPage + 1)}
            disabled={isLastPage}
            style={[
              styles.navArrowRight,
              isLastPage && styles.navArrowDisabled,
            ]}
          >
            <IconSymbol
              name="chevron.right"
              size={24}
              color={isLastPage ? Colors.textMuted : Colors.text}
            />
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </ImageBackground>
  );
};

/** STYLE SHEET  */
const styles = StyleSheet.create({
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
    paddingLeft: Spacing.screenPadding,
    paddingRight: Spacing.screenPadding,
    paddingVertical: isTablet ? Spacing.lg : Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  closeButtonContainer: {
    width: 40,
    alignItems: "flex-start",
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -8,
  },
  title: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: isTablet ? Typography.fontSize.h2 : Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary,
    flex: 1,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  scrollView: {
    flex: 1,
  },
  pageContainer: {
    width: screenWidth,
    flex: 1,
  },
  pageContent: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  storyCard: {
    borderRadius: BorderRadius.large,
    borderWidth: 3,
    borderColor: Colors.primary,
    overflow: "hidden",
    ...Shadows.glow,
  },
  imageContainer: {
    backgroundColor: Colors.placeholderBackground,
    position: "relative",
  },
  pageImage: {
    width: "100%",
    height: "100%",
  },
  imageLoader: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -20 }, { translateY: -20 }],
  },
  placeholderImage: {
    backgroundColor: Colors.placeholderBackground,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    fontSize: Typography.fontSize.small,
    color: Colors.textSecondary,
  },
  placeholderLoadingContainer: {
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  placeholderSpinner: {
    marginBottom: Spacing.sm,
  },
  textPanel: {
    backgroundColor: CREAM_COLOR,
    paddingHorizontal: Spacing.lg,
    paddingVertical: isTablet ? Spacing.md : Spacing.xs / 2,
    justifyContent: "center",
    alignItems: "center",
  },
  pageText: {
    fontFamily: Typography.fontFamily.primary,
    color: Colors.textDark,
    textAlign: "center",
    fontWeight: Typography.fontWeight.regular,
    fontSize: isTablet ? Typography.fontSize.h3 : Typography.fontSize.medium,
    lineHeight: isTablet ? 28 : 22,
  },
  pageNumber: {
    fontSize: isTablet ? Typography.fontSize.small : Typography.fontSize.micro,
    color: "#8B7355",
    textAlign: "center",
    marginTop: isTablet ? Spacing.lg : Spacing.sm,
    marginBottom: isTablet ? Spacing.xs / 2 : Spacing.xs * 2,
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
  },
  navArrowDisabled: {
    opacity: 0.3,
  },
  imageGenerationStatus: {
    position: "absolute",
    bottom: 80,
    left: Spacing.screenPadding * 2,
    right: Spacing.screenPadding * 2,
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: Spacing.md,
    borderRadius: BorderRadius.medium,
  },
  imageGenerationText: {
    fontSize: Typography.fontSize.small,
    color: Colors.primary,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  imageGenerationErrorText: {
    fontSize: Typography.fontSize.small,
    color: Colors.error,
    textAlign: "center",
  },
  progressBar: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: 4,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xxxl,
  },
  errorText: {
    fontSize: Typography.fontSize.medium,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: Spacing.lg,
  },
});
