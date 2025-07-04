// components/story/StoryCard.tsx
import { Story } from "@/types/story.types";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { IconSymbol } from "../ui/IconSymbol";

/* ---------- sizing helpers ---------- */
const { width } = Dimensions.get("window");
const COLS = 3; // 3-up grid (tweak if you want 2-up on phones)
const GAP = 20; // must match LibraryScreen.grid.gap
const CARD_W = (width - 2 * 24 - (COLS - 1) * GAP) / COLS;
const CARD_H = CARD_W * 1.46; // ≈ 2 : 3 portrait ratio

/* ---------- component ---------- */
interface StoryCardProps {
  story: Story;
  onPress: () => void;
}

export const StoryCard: React.FC<StoryCardProps> = ({ story, onPress }) => {
  const [imageError, setImageError] = React.useState(false);
  const imageUrl = story.coverImageUrl || story.storyContent?.[0]?.imageUrl;

  /* helpers */
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

      {/* status badge (top-right) */}
      {["generating", "failed"].includes(story.imageGenerationStatus) && (
        <View
          style={[
            styles.imageStatusBadge,
            story.imageGenerationStatus === "failed" && styles.imageStatusError,
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

      {/* bottom vignette for legibility */}
      <LinearGradient
        colors={["transparent", "rgba(15,17,41,0.96)"]}
        style={StyleSheet.absoluteFill}
      />

      {/* meta */}
      <View style={styles.meta}>
        <Text numberOfLines={2} style={styles.title}>
          {story.title}
        </Text>
        <Text style={styles.subtitle}>
          {formatDate(story.createdAt)} – {pageCount} pages
        </Text>
        {!!story.storyConfiguration.theme && (
          <View style={styles.tag}>
            <Text style={styles.tagTxt}>
              Theme: {story.storyConfiguration.theme}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

/* ---------- styles ---------- */
const glow = {
  shadowColor: "#D4AF37",
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.55,
  shadowRadius: 12,
  elevation: 10,
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 2,
    borderColor: "#D4AF37",
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: GAP,
    backgroundColor: "rgba(255,255,255,0.02)",
    ...glow,
  },

  /* placeholder cover */
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

  /* meta block (bottom) */
  meta: { position: "absolute", left: 18, right: 18, bottom: 20 },
  title: {
    fontFamily: "PlayfairDisplay-Regular",
    fontSize: 24,
    lineHeight: 28,
    color: "#D4AF37",
    marginBottom: 6,
  },
  subtitle: { fontSize: 14, color: "#fff", marginBottom: 10 },
  tag: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.14)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagTxt: { fontSize: 12, color: "#fff" },
});
