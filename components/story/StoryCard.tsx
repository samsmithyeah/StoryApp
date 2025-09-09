// components/story/StoryCard.tsx
import { useStorageUrl } from "@/hooks/useStorageUrl";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { Story } from "@/types/story.types";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors, Shadows } from "../../constants/Theme";
import { LoadingSpinner } from "../shared/LoadingSpinner";
import { IconSymbol } from "../ui/IconSymbol";
import { StoryCardMenu } from "./StoryCardMenu";

/* ---------- typography constants ---------- */
// Typography constants
const TITLE_LINE_HEIGHT_ADJUSTMENT = 2;

/* ---------- component ---------- */
interface StoryCardProps {
  story: Story;
  onPress: (storyId: string) => void;
}

export const StoryCard: React.FC<StoryCardProps> = React.memo(
  ({ story, onPress }) => {
    const {
      cardWidth: cardW,
      cardHeight: cardH,
      titleSize,
      subtitleSize,
    } = useResponsiveLayout();
    const [imageError, setImageError] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);
    const [menuVisible, setMenuVisible] = useState(false);
    const [isReporting, setIsReporting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const storagePath = useMemo(
      () => story.coverImageUrl || story.storyContent?.[0]?.imageUrl,
      [story.coverImageUrl, story.storyContent]
    );
    const imageUrl = useStorageUrl(storagePath);

    const isGeneratingCover =
      !story.coverImageUrl &&
      story.generationPhase !== "cover_complete" &&
      story.generationPhase !== "all_complete";
    const hasCoverPath = !!storagePath;
    const shouldShowSpinner =
      (hasCoverPath && imageLoading && !imageError) || isGeneratingCover;

    const formatDate = (date: Date) =>
      new Date(date).toLocaleDateString("en-GB", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });

    const pageCount = story.storyContent?.length ?? 0;

    const handleMenuPress = () => {
      setMenuVisible(true);
    };

    /* ---------- render ---------- */
    return (
      <View style={[styles.card, { width: cardW, height: cardH }]}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => onPress(story.id)}
          style={StyleSheet.absoluteFill}
        >
          {/* cover (or placeholder) */}
          {!imageError && imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              cachePolicy="memory-disk"
              onLoad={() => setImageLoading(false)}
              onError={() => {
                setImageLoading(false);
                setImageError(true);
              }}
            />
          ) : (
            <View style={styles.placeholder}>
              {shouldShowSpinner ? (
                <View style={styles.spinnerContainer}>
                  {isGeneratingCover ? (
                    <LoadingSpinner size="small" showGlow={false} />
                  ) : (
                    <ActivityIndicator size="large" color="#D4AF37" />
                  )}
                </View>
              ) : (
                <IconSymbol name="book.closed.fill" size={24} color="#D4AF37" />
              )}
            </View>
          )}
        </TouchableOpacity>

        {/* menu button -------------------------------------------------- */}
        <TouchableOpacity
          style={styles.menuButton}
          onPress={handleMenuPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <IconSymbol
            name="ellipsis"
            size={20}
            color="rgba(255, 255, 255, 0.7)"
          />
        </TouchableOpacity>

        {/* status badge -------------------------------------------------- */}
        {story.imageGenerationStatus &&
          ["generating", "failed"].includes(story.imageGenerationStatus) && (
            <View
              style={[
                styles.imageStatusBadge,
                story.imageGenerationStatus === "failed" &&
                  styles.imageStatusError,
              ]}
            >
              {story.imageGenerationStatus === "generating" ? (
                <>
                  <ActivityIndicator size="small" color="#6366F1" />
                  <Text style={styles.imageStatusText}>
                    {story.imagesGenerated}/{story.totalImages}
                  </Text>
                </>
              ) : (
                <IconSymbol
                  name="exclamationmark.circle.fill"
                  size={16}
                  color="#EF4444"
                />
              )}
            </View>
          )}

        {/* vignette for legibility -------------------------------------- */}
        <LinearGradient
          colors={["transparent", "rgba(15,17,41,0.96)"]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {/* meta block ---------------------------------------------------- */}
        <View style={styles.meta} pointerEvents="none">
          <Text
            numberOfLines={4}
            style={[
              styles.title,
              {
                fontSize: titleSize,
                lineHeight: titleSize + TITLE_LINE_HEIGHT_ADJUSTMENT,
              },
            ]}
          >
            {story.title}
          </Text>
          <Text style={[styles.subtitle, { fontSize: subtitleSize }]}>
            {formatDate(story.createdAt)} – {pageCount} pages
          </Text>
        </View>

        <StoryCardMenu
          visible={menuVisible}
          onClose={() => setMenuVisible(false)}
          story={story}
          isReporting={isReporting}
          setIsReporting={setIsReporting}
          isDeleting={isDeleting}
          setIsDeleting={setIsDeleting}
        />

        {/* Deletion overlay */}
        {isDeleting && (
          <View style={styles.deletionOverlay}>
            <ActivityIndicator size="large" color="#D4AF37" />
          </View>
        )}
      </View>
    );
  }
);

StoryCard.displayName = "StoryCard";

/* ---------- styles ---------- */

const styles = StyleSheet.create({
  card: {
    borderWidth: 2,
    borderColor: "#D4AF37",
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: Colors.cardBackground,
    ...Shadows.glowStrong,
  },

  placeholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(26,27,58,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },

  spinnerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },

  deletionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
  },

  /* menu button */
  menuButton: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },

  /* status badge */
  imageStatusBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(26,27,58,0.85)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  imageStatusError: { paddingHorizontal: 4 },
  imageStatusText: { fontSize: 12, color: "#D4AF37", fontWeight: "500" },

  /* meta */
  meta: { position: "absolute", left: 18, right: 18, bottom: 20 },
  title: {
    fontFamily: Platform.select({
      ios: "PlayfairDisplay-Regular",
      android: "PlayfairDisplay-Regular",
      default: "serif", // Fallback for testing
    }),
    color: "#D4AF37",
    marginBottom: 4,
    // fontSize and lineHeight are set dynamically via inline styles
  },
  subtitle: {
    color: "#fff",
    // fontSize is set dynamically via inline styles
  },
  tag: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.14)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagTxt: { fontSize: 12, color: "#fff" },
});
