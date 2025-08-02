import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Dimensions, ImageBackground, StyleSheet, View } from "react-native";

const { width } = Dimensions.get("window");
const _isTablet = width >= 768;

interface WizardContainerProps {
  children: React.ReactNode;
}

export const WizardContainer: React.FC<WizardContainerProps> = ({
  children,
}) => {
  return (
    <View style={styles.container}>
      <ImageBackground
        source={require("@/assets/images/background-landscape.png")}
        resizeMode={_isTablet ? "cover" : "none"}
        style={StyleSheet.absoluteFillObject}
      >
        <LinearGradient
          colors={["rgba(15,17,41,0.72)", "rgba(15,17,41,0.96)"]}
          style={StyleSheet.absoluteFill}
        />
        {children}
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f1129",
  },
});
