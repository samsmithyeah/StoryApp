import { Colors } from "@/constants/Theme";
import React from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

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
  const sliderWidth = useSharedValue(0);

  // Memoized function to calculate thumb position from value
  const calculateThumbPosition = React.useCallback(
    (currentValue: number, width: number) => {
      const progress = (currentValue - minValue) / (maxValue - minValue);
      return progress * width - THUMB_SIZE / 2;
    },
    [minValue, maxValue]
  );

  // Memoized worklet to handle position changes
  const onPositionChange = React.useCallback(
    (newTranslateX: number) => {
      "worklet";
      if (sliderWidth.value > 0) {
        const progress = (newTranslateX + THUMB_SIZE / 2) / sliderWidth.value;
        const newValue = Math.round(
          minValue + progress * (maxValue - minValue)
        );
        runOnJS(onValueChange)(newValue);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps -- sliderWidth is a SharedValue
    },
    [minValue, maxValue, onValueChange]
  );

  // Update translateX when value changes
  React.useEffect(() => {
    if (sliderWidth.value > 0) {
      translateX.value = calculateThumbPosition(value, sliderWidth.value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sliderWidth and translateX are SharedValues
  }, [value, calculateThumbPosition]);

  const panGesture = React.useMemo(
    () =>
      Gesture.Pan()
        .onStart(() => {
          startX.value = translateX.value;
        })
        .onUpdate((event) => {
          if (sliderWidth.value > 0) {
            const newTranslateX = Math.max(
              -(THUMB_SIZE / 2),
              Math.min(
                sliderWidth.value - THUMB_SIZE / 2,
                startX.value + event.translationX
              )
            );
            translateX.value = newTranslateX;
            onPositionChange(newTranslateX);
          }
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- SharedValues are stable references
    [onPositionChange]
  );

  const tapGesture = React.useMemo(
    () =>
      Gesture.Tap().onEnd((event) => {
        if (sliderWidth.value > 0) {
          // Position thumb so its center is at the tap location
          const newTranslateX = Math.max(
            -(THUMB_SIZE / 2),
            Math.min(
              sliderWidth.value - THUMB_SIZE / 2,
              event.x - THUMB_SIZE / 2
            )
          );
          translateX.value = newTranslateX;
          onPositionChange(newTranslateX);
        }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- SharedValues are stable references
    [onPositionChange]
  );

  const composedGesture = React.useMemo(
    () => Gesture.Race(panGesture, tapGesture),
    [panGesture, tapGesture]
  );

  const thumbStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const progressStyle = useAnimatedStyle(() => {
    if (sliderWidth.value > 0) {
      // Progress should go to the center of the thumb
      const thumbCenterX = translateX.value + THUMB_SIZE / 2;
      const percentage = (thumbCenterX / sliderWidth.value) * 100;
      return {
        width: `${Math.max(0, Math.min(percentage, 100))}%`,
      };
    }
    return { width: "0%" };
  });

  const onLayout = React.useCallback(
    (event: LayoutChangeEvent) => {
      const { width } = event.nativeEvent.layout;
      sliderWidth.value = width;
      // Re-calculate thumb position when layout changes
      if (width > 0) {
        translateX.value = calculateThumbPosition(value, width);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps -- SharedValues are stable references
    },
    [value, calculateThumbPosition]
  );

  return (
    <View style={styles.customSliderContainer}>
      <GestureDetector gesture={composedGesture}>
        <View style={styles.sliderInteractiveArea} onLayout={onLayout}>
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
