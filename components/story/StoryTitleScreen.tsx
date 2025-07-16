import { Story } from "@/types/story.types";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  Animated,
  Dimensions,
  ImageBackground,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors, Shadows, Spacing, Typography } from "../../constants/Theme";
import { Button } from "../ui/Button";
import { useStorageUrl } from "@/hooks/useStorageUrl";

const { width: screenWidth } = Dimensions.get("window");
const isTablet = screenWidth >= 768;

interface StoryTitleScreenProps {
  story: Story;
  onStartReading: () => void;
  onGoBack: () => void;
}

export const StoryTitleScreen: React.FC<StoryTitleScreenProps> = ({
  story,
  onStartReading,
  onGoBack,
}) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [scaleAnim] = useState(new Animated.Value(0.9));
  const coverImageUrl = useStorageUrl(story.coverImageUrl);

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
        <View style={styles.content}>
          <Animated.View
            style={[
              styles.titleContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
              },
            ]}
          >
            <Text style={styles.title}>{story.title}</Text>

            {story.storyConfiguration?.enableIllustrations !== false && coverImageUrl && (
              <View style={styles.coverImageContainer}>
                <Image
                  source={{ uri: coverImageUrl }}
                  style={styles.coverImage}
                  contentFit="cover"
                />
              </View>
            )}

            <Text style={styles.detailsLine}>8 pages ✦ Medium ✦ Fantasy</Text>

            <Button
              title="Start reading"
              onPress={onStartReading}
              variant="wizard"
              size="large"
            />

            <TouchableOpacity onPress={onGoBack}>
              <Text style={styles.backText}>Back to library</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.screenPadding,
  },
  titleContainer: {
    alignItems: "center",
  },
  title: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: isTablet
      ? Typography.fontSize.h1Tablet
      : Typography.fontSize.h1Phone,
    color: Colors.primary,
    textAlign: "center",
    marginBottom: Spacing.huge,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    fontWeight: Typography.fontWeight.bold,
  },
  coverImageContainer: {
    width: isTablet ? 600 : 280,
    height: isTablet ? 380 : 190,
    borderRadius: Spacing.xxl,
    overflow: "hidden",
    borderWidth: isTablet ? 3 : 2,
    borderColor: Colors.primary,
    ...Shadows.glow,
    marginBottom: Spacing.xxl,
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  detailsLine: {
    fontSize: Typography.fontSize.medium,
    color: Colors.text,
    marginBottom: Spacing.huge,
    textAlign: "center",
    fontWeight: Typography.fontWeight.medium,
  },
  backText: {
    fontSize: Typography.fontSize.medium,
    color: Colors.text,
    opacity: 0.8,
    textAlign: "center",
    marginTop: Spacing.xl,
    textDecorationLine: "underline",
  },
});
