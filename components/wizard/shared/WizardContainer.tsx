import React from 'react';
import {
  View,
  ImageBackground,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

interface WizardContainerProps {
  children: React.ReactNode;
}

export const WizardContainer: React.FC<WizardContainerProps> = ({ children }) => {
  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('@/assets/images/background-landscape.png')}
        resizeMode="cover"
        style={StyleSheet.absoluteFillObject}
      >
        <LinearGradient
          colors={['rgba(15,17,41,0.72)', 'rgba(15,17,41,0.96)']}
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
    backgroundColor: '#0f1129',
  },
});