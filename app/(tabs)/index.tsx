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
import { StatusBar } from "expo-status-bar";
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
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StoryCard } from "../../components/story/StoryCard";
import { useAuth } from "../../hooks/useAuth";
import { db } from "../../services/firebase/config";
import { getStories } from "../../services/firebase/stories";
import { Story } from "../../types/story.types";

const { width, height } = Dimensions.get("window");
const isTablet = width >= 768;
const isPhoneMiddle = width < 430; // iPhone 14/15, Pixel 7
const isPhoneSmall = width < 380; // iPhone SE / 13 mini
const GAP = isTablet ? 20 : 16;
const emptyTop = Math.round(height * (isTablet ? 0.25 : 0.18));

/* --------------------------------------------------------------------- */

export default function LibraryScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /* realtime listener -------------------------------------------------- */
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "stories"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate() || new Date(),
      })) as Story[];
      setStories(list);
      setLoading(false);
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

  const openStory = (s: Story) =>
    router.push({ pathname: "/story/[id]", params: { id: s.id } });

  /* ------------------------------------------------------------------ */
  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  /* hero offset so it never sits under the CTA */
  const heroTop = isTablet ? 32 : insets.top + 32;

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

      <StatusBar style="light" />

      <SafeAreaView style={styles.safeArea}>
        {/* floating CTA -------------------------------------------------- */}
        <TouchableOpacity
          style={[styles.cta, { top: insets.top + 12 }]}
          activeOpacity={0.85}
          onPress={() => router.push("/create")}
        >
          <Text style={styles.ctaTxt}>Create Story</Text>
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
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
              <View style={[styles.hero, { marginTop: heroTop }]}>
                <Text style={styles.brand}>DreamWeaver</Text>
                <Text style={styles.tagline}>Your bedtime adventures</Text>
              </View>

              <Text style={styles.sectionLabel}>LIBRARY</Text>

              <View style={styles.grid}>
                {stories.map((s) => (
                  <StoryCard
                    key={s.id}
                    story={s}
                    onPress={() => openStory(s)}
                  />
                ))}
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

/* --------------------------------------------------------------------- */
/* decorations (moon, stars, etc.)                                       */
/* --------------------------------------------------------------------- */

function Decorations() {
  const moonSize = isTablet ? 160 : 120;
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
      <TouchableOpacity
        style={styles.emptyBtn}
        onPress={() => router.push("/create")}
        activeOpacity={0.85}
      >
        <Text style={styles.emptyBtnTxt}>Create Story</Text>
      </TouchableOpacity>
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

const glow = {
  shadowColor: "#D4AF37",
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.55,
  shadowRadius: 10,
  elevation: 8,
};

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: "#0f1129" },
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 56 },
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0f1129",
  },

  /* hero -------------------------------------------------------------- */
  hero: { alignItems: "center", marginBottom: isTablet ? 48 : 32 },
  brand: {
    fontFamily: "PlayfairDisplay-Regular",
    fontSize: isTablet ? 64 : isPhoneSmall ? 34 : isPhoneMiddle ? 40 : 48,
    color: "#D4AF37",
  },
  tagline: {
    fontSize: isTablet ? 24 : isPhoneSmall ? 14 : 18,
    color: "#B8B8B8",
    marginTop: 6,
  },

  /* floating CTA ------------------------------------------------------ */
  cta: {
    position: "absolute",
    right: 24,
    backgroundColor: "#D4AF37",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 26,
    zIndex: 20,
    ...glow,
  },
  ctaTxt: { color: "#1a1b3a", fontSize: 16, fontWeight: "600" },

  /* library grid ------------------------------------------------------ */
  sectionLabel: {
    //fontSize: 20,
    fontSize: isTablet ? 20 : isPhoneSmall ? 14 : 16,
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
    paddingBottom: 80,
  },
  emptyBear: { width: 140, height: 140, marginBottom: 24, opacity: 0.95 },
  emptyBrand: {
    fontSize: 48,
    fontFamily: "PlayfairDisplay-Regular",
    color: "#FCD34D",
    marginBottom: 6,
  },
  emptyText: { fontSize: 20, color: "#fff", marginBottom: 32 },
  emptyBtn: {
    backgroundColor: "#FBBF24",
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 999,
    shadowColor: "#FCD34D",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  emptyBtnTxt: { fontSize: 18, color: "#1a1b3a", fontWeight: "600" },
  emptyButterfly: {
    position: "absolute",
    top: 30,
    right: 36,
    width: 48,
    height: 48,
    opacity: 0.9,
  },
});
