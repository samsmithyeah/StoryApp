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
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useStorageUrls } from "@/hooks/useStorageUrl";
import { Story } from "@/types/story.types";
import {
  BorderRadius,
  Colors,
  Shadows,
  Spacing,
  Typography,
} from "../../constants/Theme";
import { IconSymbol } from "../ui/IconSymbol";

const CREAM_COLOR = "#F5E6C8";

interface StoryViewerProps {
  story: Story;
  onClose?: () => void;
}

export const StoryViewer: React.FC<StoryViewerProps> = ({ story, onClose }) => {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isTablet = Math.min(width, height) >= 768;
  const insets = useSafeAreaInsets();

  const [currentPage, setCurrentPage] = useState(0);
  const [imageLoading, setImageLoading] = useState<boolean[]>([]);

  const scrollViewRef = useRef<ScrollView>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const imagePaths = story.storyContent?.map((p) => p.imageUrl) || [];
  const imageUrls = useStorageUrls(imagePaths);
  const hasImages = story.storyConfiguration?.enableIllustrations !== false;

  const headerHeight = isTablet ? 72 : 56;
  const cardChrome = 10 + 6;
  const availableHeight =
    height - (insets.top + insets.bottom + headerHeight + cardChrome);

  const textPanelMaxPct = isTablet ? (isLandscape ? 0.38 : 0.44) : 0.48;
  const textPanelMaxHeight = Math.round(availableHeight * textPanelMaxPct);

  useEffect(() => {
    if (Array.isArray(story.storyContent)) {
      setImageLoading(Array(story.storyContent.length).fill(true));
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

  // keep correct offset after rotation
  useEffect(() => {
    scrollViewRef.current?.scrollTo({
      x: currentPage * width,
      y: 0,
      animated: false,
    });
  }, [width, currentPage]);

  const handleImageLoad = (idx: number) =>
    setImageLoading((prev) => {
      const next = [...prev];
      next[idx] = false;
      return next;
    });

  const goToPage = useCallback(
    (idx: number) => {
      if (!story.storyContent) return;
      if (idx < 0 || idx >= story.storyContent.length) return;
      
      // Only scroll if we have a valid ref, don't update state until scroll completes
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ x: idx * width, y: 0, animated: true });
        // The handleHorizontalScroll will update currentPage when scroll completes
      }
    },
    [story.storyContent, width]
  );

  const handleHorizontalScroll = (e: any) => {
    const pageIdx = Math.round(e.nativeEvent.contentOffset.x / width);
    if (pageIdx !== currentPage) setCurrentPage(pageIdx);
  };

  const renderPage = (page: any, index: number) => {
    const pageText = page.text || "";
    const imageUrl = imageUrls[index];

    return (
      <View key={index} style={[styles.pageContainer, { width }]}>
        <View style={styles.pageContent}>
          <View style={[styles.storyCard, { height: availableHeight }]}>
            {hasImages && (
              <View style={[styles.imageContainer, styles.imageFlex]}>
                {imageLoading[index] && (
                  <ActivityIndicator
                    size="large"
                    color={Colors.primary}
                    style={styles.imageLoader}
                  />
                )}
                {imageUrl ? (
                  <Image
                    source={{ uri: imageUrl }}
                    style={styles.pageImage}
                    contentFit="cover"
                    onLoad={() => handleImageLoad(index)}
                  />
                ) : (
                  <View style={styles.placeholderImage}>
                    <IconSymbol
                      name="photo"
                      size={48}
                      color={Colors.textMuted}
                    />
                  </View>
                )}
              </View>
            )}

            <View
              style={[
                styles.textPanel,
                !hasImages && styles.textPanelNoImages,
                { maxHeight: hasImages ? textPanelMaxHeight : availableHeight },
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
    );
  };

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
              onPress={onClose || (() => router.replace("/(tabs)"))}
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

  const isFirst = currentPage === 0;
  const isLast = currentPage === story.storyContent.length - 1;

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
        <View style={[styles.header, { height: headerHeight }]}>
          <View style={styles.closeButtonContainer}>
            <TouchableOpacity
              onPress={onClose || (() => router.replace("/(tabs)"))}
              style={styles.closeButton}
            >
              <IconSymbol name="xmark" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
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
          <View style={{ width: 40 }} />
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
              style={styles.scrollView}
              scrollEnabled={true}
              decelerationRate="fast"
            >
              {story.storyContent.map((p, i) => renderPage(p, i))}
            </ScrollView>
          </Animated.View>

          {/* NAV ARROWS (positioned over content) */}
          <TouchableOpacity
            onPress={() => goToPage(currentPage - 1)}
            disabled={isFirst}
            style={[styles.navArrowLeft, isFirst && styles.navArrowDisabled]}
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
            style={[styles.navArrowRight, isLast && styles.navArrowDisabled]}
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
    justifyContent: "space-between",
    paddingHorizontal: Spacing.screenPadding,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  closeButtonContainer: { width: 40, alignItems: "flex-start" },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -8,
  },
  title: {
    fontFamily: Typography.fontFamily.primary,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary,
    flex: 1,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  scrollView: { flex: 1 },

  pageContainer: { flex: 1 },
  pageContent: {
    flex: 1,
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },

  storyCard: {
    flex: 1,
    flexDirection: "column",
    borderRadius: BorderRadius.large,
    borderWidth: 3,
    borderColor: Colors.primary,
    overflow: "hidden",
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
    transform: [{ translateX: -20 }, { translateY: -20 }],
  },
  placeholderImage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
    fontSize: Typography.fontSize.medium,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: Spacing.lg,
  },
});
