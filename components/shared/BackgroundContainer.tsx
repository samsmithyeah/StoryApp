import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { ImageBackground, StyleSheet, useWindowDimensions } from "react-native";
import { Colors } from "../../constants/Theme";

interface BackgroundContainerProps {
  children: React.ReactNode;
  showDecorations?: boolean;
}

export const BackgroundContainer: React.FC<BackgroundContainerProps> = ({
  children,
  showDecorations = true,
}) => {
  const { width: winWidth, height: winHeight } = useWindowDimensions();
  const isTablet = Math.min(winWidth, winHeight) >= 768;
  return (
    <ImageBackground
      source={require("../../assets/images/background-landscape.png")}
      resizeMode={isTablet ? "cover" : "none"}
      style={styles.container}
    >
      <LinearGradient
        colors={[Colors.backgroundGradientStart, Colors.backgroundGradientEnd]}
        style={StyleSheet.absoluteFill}
      />

      {showDecorations && <Decorations />}

      {children}
    </ImageBackground>
  );
};

// Decorations component for background elements
function Decorations() {
  return (
    <>
      {/* Butterfly - top right */}
      <Image
        source={require("../../assets/images/butterfly.png")}
        style={styles.butterfly}
      />

      {/* Leaves - various positions */}
      <Image
        source={require("../../assets/images/leaves.png")}
        style={[styles.leaves, styles.leaves1]}
      />
      <Image
        source={require("../../assets/images/leaves.png")}
        style={[styles.leaves, styles.leaves2]}
      />

      {/* Stars */}
      {STAR_POSITIONS.map((pos, i) => (
        <Image
          key={`star-${i}`}
          source={require("../../assets/images/star.png")}
          style={[styles.star, pos]}
        />
      ))}
    </>
  );
}

const STAR_POSITIONS = [
  { top: 80, left: 40 },
  { top: 120, right: 60 },
  { top: 200, left: 100 },
  { top: 250, right: 40 },
  { bottom: 150, left: 60 },
  { bottom: 100, right: 80 },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Decorative elements
  butterfly: {
    position: "absolute",
    top: 60,
    right: 30,
    width: 100,
    height: 100,
    opacity: 0.8,
  },
  leaves: {
    position: "absolute",
    width: 100,
    height: 100,
    opacity: 0.3,
  },
  leaves1: {
    top: 100,
    left: -30,
  },
  leaves2: {
    bottom: 80,
    right: -20,
  },
  star: {
    position: "absolute",
    width: 10,
    height: 10,
    opacity: 0.6,
  },
});
