import { Colors } from "@/constants/Theme";
import React from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");
const SLIDER_WIDTH = width - 96; // Account for container padding
const THUMB_SIZE = 48; // Size of the thumb container for better touch area

interface CustomSliderProps {
  value: number;
  onValueChange: (value: number) => void;
  minValue: number;
  maxValue: number;
}

export const CustomSlider: React.FC<CustomSliderProps> = ({
  value,
  onValueChange,
  minValue,
  maxValue,
}) => {
  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);

  // Update translateX when value changes
  React.useEffect(() => {
    const progress = (value - minValue) / (maxValue - minValue);
    // Position thumb so its center aligns with the progress
    translateX.value = progress * SLIDER_WIDTH - THUMB_SIZE / 2;
  }, [value, translateX, minValue, maxValue]);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startX.value = translateX.value;
    })
    .onUpdate((event) => {
      const newTranslateX = Math.max(
        -(THUMB_SIZE / 2),
        Math.min(
          SLIDER_WIDTH - THUMB_SIZE / 2,
          startX.value + event.translationX
        )
      );
      translateX.value = newTranslateX;

      // Convert thumb position back to progress (0-1)
      const progress = (newTranslateX + THUMB_SIZE / 2) / SLIDER_WIDTH;
      const newValue = Math.round(minValue + progress * (maxValue - minValue));
      runOnJS(onValueChange)(newValue);
    });

  const tapGesture = Gesture.Tap().onEnd((event) => {
    // Position thumb so its center is at the tap location
    const newTranslateX = Math.max(
      -(THUMB_SIZE / 2),
      Math.min(SLIDER_WIDTH - THUMB_SIZE / 2, event.x - THUMB_SIZE / 2)
    );
    translateX.value = newTranslateX;

    // Convert tap position to progress (0-1)
    const progress = event.x / SLIDER_WIDTH;
    const newValue = Math.round(minValue + progress * (maxValue - minValue));
    runOnJS(onValueChange)(newValue);
  });

  const composedGesture = Gesture.Race(panGesture, tapGesture);

  const thumbStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const progressStyle = useAnimatedStyle(() => {
    // Progress should go to the center of the thumb
    const thumbCenterX = translateX.value + THUMB_SIZE / 2;
    const percentage = (thumbCenterX / SLIDER_WIDTH) * 100;
    return {
      width: `${Math.max(0, Math.min(percentage, 100))}%`,
    };
  });

  return (
    <View style={styles.customSliderContainer}>
      <GestureDetector gesture={composedGesture}>
        <View style={styles.sliderInteractiveArea}>
          <View style={styles.sliderTrack}>
            <Animated.View style={[styles.sliderProgress, progressStyle]} />
          </View>
          <Animated.View style={[styles.sliderThumbContainer, thumbStyle]}>
            <View style={styles.sliderThumb} />
          </Animated.View>
        </View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  customSliderContainer: {
    marginTop: 10,
    height: 50, // Increased height for better touch area
  },
  sliderInteractiveArea: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: 13, // Large touch padding around the track
  },
  sliderTrack: {
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 2,
  },
  sliderProgress: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  sliderThumbContainer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 48, // Large touch area (48x50)
    justifyContent: "center",
    alignItems: "center",
  },
  sliderThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
});
