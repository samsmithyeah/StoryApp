// components/story/StoryCard.tsx
import { Story } from "@/types/story.types";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Shadows } from "../../constants/Theme";
import { IconSymbol } from "../ui/IconSymbol";
import { useStorageUrl } from "@/hooks/useStorageUrl";

/* ---------- sizing helpers ---------- */
const { width } = Dimensions.get("window");
const COLS = width >= 768 ? 3 : 2; // 3 on tablets, 2 on phones
const GAP = 20; // must match LibraryScreen.grid.gap
const CARD_W = (width - 2 * 24 - (COLS - 1) * GAP) / COLS;
const CARD_H = CARD_W * 1.46; // ≈ 2 : 3 portrait ratio
const TITLE_SIZE = width >= 768 ? 36 : width < 360 ? 14 : width < 390 ? 16 : 18;
const SUBTITLE_SIZE =
  width >= 768 ? 18 : width < 360 ? 10 : width < 390 ? 11 : 12;

/* ---------- component ---------- */
interface StoryCardProps {
  story: Story;
  onPress: () => void;
}

export const StoryCard: React.FC<StoryCardProps> = ({ story, onPress }) => {
  const [imageError, setImageError] = React.useState(false);
  const storagePath = story.coverImageUrl || story.storyContent?.[0]?.imageUrl;
  const imageUrl = useStorageUrl(storagePath);

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString("en-GB", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  const pageCount = story.storyContent?.length ?? 0;

  /* ---------- render ---------- */
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.card, { width: CARD_W, height: CARD_H }]}
    >
      {/* cover (or placeholder) */}
      {!imageError && imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <View style={styles.placeholder}>
          <IconSymbol name="book.closed.fill" size={24} color="#D4AF37" />
        </View>
      )}

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
      />

      {/* meta block ---------------------------------------------------- */}
      <View style={styles.meta}>
        <Text numberOfLines={4} style={styles.title}>
          {story.title}
        </Text>
        <Text style={styles.subtitle}>
          {formatDate(story.createdAt)} – {pageCount} pages
        </Text>
      </View>
    </TouchableOpacity>
  );
};

/* ---------- styles ---------- */

const styles = StyleSheet.create({
  card: {
    borderWidth: 2,
    borderColor: "#D4AF37",
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: GAP,
    backgroundColor: "rgba(255,255,255,0.02)",
    ...Shadows.glowStrong,
    // Android requires explicit background for elevation shadows
    ...(Platform.OS === "android" && {
      backgroundColor: "rgba(26,27,58,0.8)",
    }),
  },

  placeholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(26,27,58,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },

  /* status badge */
  imageStatusBadge: {
    position: "absolute",
    top: 8,
    right: 8,
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
    fontSize: TITLE_SIZE,
    lineHeight: TITLE_SIZE + 2,
    color: "#D4AF37",
    marginBottom: 4,
  },
  subtitle: { fontSize: SUBTITLE_SIZE, color: "#fff" },
  tag: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.14)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagTxt: { fontSize: 12, color: "#fff" },
});
