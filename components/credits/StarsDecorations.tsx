import { Image } from "expo-image";
import React from "react";
import { StyleSheet } from "react-native";

export function StarsDecorations() {
  return (
    <>
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
  { bottom: 150, left: 60 },
  { bottom: 100, right: 80 },
];

const styles = StyleSheet.create({
  star: {
    position: "absolute",
    width: 10,
    height: 10,
    opacity: 0.6,
  },
});
