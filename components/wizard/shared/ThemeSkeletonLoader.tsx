import React, { useEffect, useRef } from 'react';
import {
  Animated,
  View,
  StyleSheet,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

interface ThemeSkeletonLoaderProps {
  count?: number;
}

export const ThemeSkeletonLoader: React.FC<ThemeSkeletonLoaderProps> = ({
  count = 4,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.6,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();
    return () => pulseAnimation.stop();
  }, [pulseAnim]);

  return (
    <View style={isTablet ? styles.themesListTablet : styles.themesList}>
      {Array.from({ length: count }).map((_, index) => (
        <Animated.View
          key={`skeleton-${index}`}
          style={[
            isTablet ? styles.themeListCardTablet : styles.themeListCard,
            { opacity: pulseAnim },
          ]}
        >
          <View style={[styles.iconContainer, styles.skeletonIcon]} />
          <View style={styles.themeInfo}>
            <View style={styles.skeletonTitle} />
            <View style={styles.skeletonDescription} />
          </View>
        </Animated.View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  themesList: {
    gap: 12,
  },
  themesListTablet: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginHorizontal: -6,
  },
  themeListCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeListCardTablet: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    width: '48%',
    marginHorizontal: 6,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#D4AF37',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  skeletonIcon: {
    backgroundColor: 'rgba(212, 175, 55, 0.3)',
  },
  themeInfo: {
    flex: 1,
  },
  skeletonTitle: {
    height: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    marginBottom: 4,
    width: '70%',
  },
  skeletonDescription: {
    height: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 4,
    width: '90%',
  },
});