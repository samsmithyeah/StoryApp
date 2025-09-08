import type { FirebaseFirestoreTypes } from "@react-native-firebase/firestore";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "@react-native-firebase/firestore";
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
  Dimensions,
  Easing,
  ImageBackground,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StoryCard } from "../../components/story/StoryCard";
import { Button } from "../../components/ui/Button";
import { TAGLINE } from "../../constants/UIText";
import { useAuth } from "../../hooks/useAuth";
import { db } from "../../services/firebase/config";
import { getStories } from "../../services/firebase/stories";
import { Story } from "../../types/story.types";
import { imageCache } from "../../services/imageCache";

import {
  isTablet,
  isPhoneMiddle,
  isPhoneSmall,
  isVerySmallScreen,
} from "../../constants/Theme";

const { height } = Dimensions.get("window"); // Still needed for emptyTop calculation
const GAP = isTablet() ? 20 : 16;
const emptyTop = Math.round(
  height * (isTablet() ? 0.25 : isVerySmallScreen() ? 0.12 : 0.18)
);

/* --------------------------------------------------------------------- */

export default function LibraryScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const createButtonTranslateY = useRef(new Animated.Value(0)).current;

  /* realtime listener -------------------------------------------------- */
  useEffect(() => {
    if (!user) {
      setStories([]);
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, "stories"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(
        (d: FirebaseFirestoreTypes.QueryDocumentSnapshot) => ({
          id: d.id,
          ...d.data(),
          createdAt: d.data().createdAt?.toDate() || new Date(),
        })
      ) as Story[];
      setStories(list);
      setLoading(false);

      // Clear orphaned cache entries for stories that no longer exist (handles multi-device sync)
      if (list.length > 0) {
        const existingStoryIds = list.map((story) => story.id);
        imageCache
          .clearOrphanedStoryCache(existingStoryIds, user.uid)
          .catch((error) => {
            // Silently handle cache cleanup errors - don't affect UI
            console.warn("Failed to clear orphaned cache", error);
          });
      }
    });
    return unsub;
  }, [user]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      setStories(await getStories());
    } finally {
      setRefreshing(false);
    }
  }, []);

  const openStory = useCallback(
    (storyId: string) =>
      router.push({ pathname: "/story/[id]", params: { id: storyId } }),
    []
  );

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        const buttonHeight = 52;
        const ctaBottomPosition = insets.top + 12 + buttonHeight;
        // Different trigger points for mobile vs tablet
        const triggerOffset = isTablet() ? 190 : 90;
        const triggerPoint = heroTop + triggerOffset - ctaBottomPosition;

        if (offsetY > triggerPoint) {
          const maxPushDistance = buttonHeight + 80;
          const pushDistance = Math.min(
            offsetY - triggerPoint,
            maxPushDistance
          );
          createButtonTranslateY.setValue(-pushDistance);
        } else {
          createButtonTranslateY.setValue(0);
        }
      },
    }
  );

  /* ------------------------------------------------------------------ */
  if (loading) {
    return (
      <ImageBackground
        source={require("../../assets/images/background-landscape.png")}
        resizeMode="cover"
        style={styles.bg}
      >
        <LinearGradient
          colors={["rgba(15,17,41,0.72)", "rgba(15,17,41,0.96)"]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.loadingScreen}>
          <ActivityIndicator size="large" color="#D4AF37" />
        </View>
      </ImageBackground>
    );
  }

  /* hero offset so it never sits under the CTA */
  const ctaHeight = 52; // button height + padding
  const heroTop = isTablet() ? 120 : insets.top + ctaHeight + 100;

  return (
    <ImageBackground
      source={require("../../assets/images/background-landscape.png")}
      resizeMode="cover"
      style={styles.bg}
    >
      <LinearGradient
        colors={["rgba(15,17,41,0.72)", "rgba(15,17,41,0.96)"]}
        style={StyleSheet.absoluteFill}
      />

      <Decorations />

      <View style={styles.container}>
        {/* floating CTA -------------------------------------------------- */}
        <Animated.View
          style={[
            styles.ctaContainer,
            {
              top: insets.top + 12,
              transform: [{ translateY: createButtonTranslateY }],
            },
          ]}
        >
          <Button
            title="Create story"
            onPress={() => router.push("/create")}
            variant="primary"
            size="medium"
            style={{
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 26,
            }}
          />
        </Animated.View>

        <Animated.ScrollView
          style={[styles.scrollView, { marginTop: -insets.top }]}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: heroTop },
          ]}
          contentInsetAdjustmentBehavior="never"
          onScroll={handleScroll}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#D4AF37"
            />
          }
        >
          {stories.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <View style={styles.hero}>
                <Text style={styles.brand}>DreamWeaver</Text>
                <Text style={styles.tagline}>{TAGLINE}</Text>
              </View>

              <Text style={styles.sectionLabel}>LIBRARY</Text>

              <View style={styles.grid}>
                {stories.map((s) => (
                  <StoryCard key={s.id} story={s} onPress={openStory} />
                ))}
              </View>
            </>
          )}
        </Animated.ScrollView>
      </View>
    </ImageBackground>
  );
}

/* --------------------------------------------------------------------- */
/* decorations (moon, stars, etc.)                                       */
/* --------------------------------------------------------------------- */

function Decorations() {
  const moonSize = isTablet() ? 160 : 120;
  return (
    <>
      <Image
        source={require("../../assets/images/moon.png")}
        style={[styles.moon, { width: moonSize, height: moonSize }]}
      />

      {STAR_COORDS.map((p, i) => (
        <Image
          key={i}
          source={require("../../assets/images/star.png")}
          style={[styles.star, p]}
        />
      ))}
      {DANDELION_COORDS.map((p, i) => (
        <Image
          key={i}
          source={require("../../assets/images/dandelion.png")}
          style={[styles.seed, p]}
        />
      ))}
      {LEAF_COORDS.map((p, i) => (
        <Image
          key={i}
          source={require("../../assets/images/leaves.png")}
          style={[styles.leaf, p]}
        />
      ))}
    </>
  );
}

/* --------------------------------------------------------------------- */
/* empty-state component (unchanged)                                     */
/* --------------------------------------------------------------------- */

function EmptyState() {
  const drift = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: -8,
          duration: 3500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(drift, {
          toValue: 0,
          duration: 3500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [drift]);

  const butterflyStyle = useMemo(
    () => [{ transform: [{ translateY: drift }] }, styles.emptyButterfly],
    [drift]
  );

  return (
    <View style={[styles.emptyContainer, { paddingTop: emptyTop }]}>
      <Animated.Image
        source={require("../../assets/images/butterfly.png")}
        style={butterflyStyle}
      />
      <Image
        source={require("../../assets/images/teddy.png")}
        style={styles.emptyBear}
      />
      <Text style={styles.emptyBrand}>DreamWeaver</Text>
      <Text style={styles.emptyText}>No stories yet</Text>
      <Button
        title="Create story"
        onPress={() => router.push("/create")}
        variant="primary"
        size={isVerySmallScreen() ? "medium" : "large"}
        style={{
          paddingHorizontal: isVerySmallScreen() ? 24 : 36,
          paddingVertical: isVerySmallScreen() ? 10 : 14,
          borderRadius: 999,
        }}
      />
    </View>
  );
}

/* --------------------------------------------------------------------- */
/* asset placement arrays                                                */
/* --------------------------------------------------------------------- */

const STAR_COORDS = [
  { top: 120, left: 40 },
  { top: 160, left: 220 },
  { top: 90, right: 60 },
  { top: 210, right: 140 },
  { top: 260, left: 120 },
];
const DANDELION_COORDS = [
  { top: 140, left: 100, width: 28, height: 28, opacity: 0.25 },
  { top: 60, right: 80, width: 32, height: 32, opacity: 0.3 },
  { top: 220, right: 40, width: 24, height: 24, opacity: 0.2 },
];
const LEAF_COORDS = [
  { top: 20, right: -30, width: 220, height: 220, opacity: 0.12 },
  { bottom: -40, left: -60, width: 260, height: 260, opacity: 0.12 },
];

/* --------------------------------------------------------------------- */
/* styles                                                                */
/* --------------------------------------------------------------------- */

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: "#0f1129" },
  container: { flex: 1 },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 56,
  },
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0f1129",
  },

  /* hero -------------------------------------------------------------- */
  hero: { alignItems: "center", marginBottom: isTablet() ? 48 : 32 },
  brand: {
    fontFamily: "PlayfairDisplay-Regular",
    fontSize: isTablet() ? 64 : isPhoneSmall() ? 34 : isPhoneMiddle() ? 40 : 48,
    color: "#D4AF37",
  },
  tagline: {
    fontSize: isTablet() ? 24 : isPhoneSmall() ? 14 : 18,
    color: "#B8B8B8",
    marginTop: 6,
  },

  /* floating CTA ------------------------------------------------------ */
  ctaContainer: {
    position: "absolute",
    right: 24,
    zIndex: 20,
  },

  /* library grid ------------------------------------------------------ */
  sectionLabel: {
    //fontSize: 20,
    fontSize: isTablet() ? 20 : isPhoneSmall() ? 14 : 16,
    color: "#FFF",
    letterSpacing: 1.6,
    marginBottom: 24,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: GAP,
  },

  /* decorative sprites ------------------------------------------------ */
  moon: { position: "absolute", top: 36, left: 24, opacity: 0.7 },
  star: { position: "absolute", width: 15, height: 15, opacity: 0.8 },
  seed: { position: "absolute" },
  leaf: { position: "absolute" },

  /* empty-state ------------------------------------------------------- */
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingBottom: isVerySmallScreen() ? 40 : 80,
  },
  emptyBear: {
    width: isVerySmallScreen() ? 100 : 140,
    height: isVerySmallScreen() ? 100 : 140,
    marginBottom: isVerySmallScreen() ? 16 : 24,
    opacity: 0.95,
  },
  emptyBrand: {
    fontSize: isVerySmallScreen() ? 32 : 48,
    fontFamily: "PlayfairDisplay-Regular",
    color: "#FCD34D",
    marginBottom: isVerySmallScreen() ? 4 : 6,
  },
  emptyText: {
    fontSize: isVerySmallScreen() ? 16 : 20,
    color: "#fff",
    marginBottom: isVerySmallScreen() ? 20 : 32,
  },
  emptyButterfly: {
    position: "absolute",
    top: 30,
    right: 36,
    width: 48,
    height: 48,
    opacity: 0.9,
  },
});
