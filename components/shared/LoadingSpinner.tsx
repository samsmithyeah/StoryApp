import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Theme";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  View,
} from "react-native";

interface LoadingSpinnerProps {
  size?: "small" | "medium" | "large";
  color?: string;
  showGlow?: boolean;
}

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "medium",
  color = Colors.primary,
  showGlow = true,
}) => {
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  const getSizeValues = () => {
    switch (size) {
      case "small":
        return {
          circleSize: isTablet ? 60 : 48,
          iconSize: isTablet ? 32 : 24,
        };
      case "large":
        return {
          circleSize: isTablet ? 160 : 120,
          iconSize: isTablet ? 80 : 64,
        };
      default: // medium
        return {
          circleSize: isTablet ? 100 : 80,
          iconSize: isTablet ? 48 : 40,
        };
    }
  };

  const { circleSize, iconSize } = getSizeValues();

  useEffect(() => {
    // Rotation animation
    const startRotation = () => {
      rotationAnim.setValue(0);
      Animated.loop(
        Animated.timing(rotationAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    };

    // Pulse animation - subtle
    const startPulse = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    // Glow animation - subtle
    const startGlow = () => {
      if (!showGlow) return;
      
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 0.6,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.4,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ])
      ).start();
    };

    startRotation();
    startPulse();
    startGlow();

    return () => {
      rotationAnim.stopAnimation();
      pulseAnim.stopAnimation();
      glowAnim.stopAnimation();
    };
  }, [rotationAnim, pulseAnim, glowAnim, showGlow]);

  const spin = rotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.magicCircle,
          {
            width: circleSize,
            height: circleSize,
            borderRadius: circleSize / 2,
            shadowOpacity: showGlow ? glowAnim : 0,
            shadowColor: color,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.innerCircle,
            {
              width: circleSize,
              height: circleSize,
              borderRadius: circleSize / 2,
              borderColor: color,
              transform: [{ rotate: spin }, { scale: pulseAnim }],
            },
          ]}
        >
          <View style={styles.iconContainer}>
            <IconSymbol
              name="wand.and.stars"
              size={iconSize}
              color={color}
            />
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  magicCircle: {
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 20,
    elevation: 10,
  },
  innerCircle: {
    backgroundColor: "rgba(212, 175, 55, 0.15)",
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
});