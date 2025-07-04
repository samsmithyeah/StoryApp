import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ImageBackground,
  Dimensions,
  Animated,
  TouchableOpacity,
} from 'react-native';

// Try to import LinearGradient with fallback
let LinearGradient: any;
try {
  LinearGradient = require('expo-linear-gradient').LinearGradient;
} catch (e) {
  // Fallback component if LinearGradient is not available
  LinearGradient = ({ children, style, ...props }: any) => (
    <View style={[style, { backgroundColor: '#6366F1' }]} {...props}>
      {children}
    </View>
  );
}
import { Story } from '@/types/story.types';
import { IconSymbol } from '../ui/IconSymbol';
import { Button } from '../ui/Button';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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

  useEffect(() => {
    // Animate entrance
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

  const getImageGenerationStatus = () => {
    switch (story.imageGenerationStatus) {
      case 'pending':
        return 'Preparing magical illustrations...';
      case 'generating':
        return `Creating beautiful artwork... ${story.imagesGenerated || 0}/${story.totalImages || 0}`;
      case 'completed':
        return 'Story complete with illustrations!';
      case 'failed':
        return 'Story ready! Some illustrations couldn&apos;t be created.';
      default:
        return 'Your story is ready!';
    }
  };

  const isGeneratingImages = story.imageGenerationStatus === 'generating' || story.imageGenerationStatus === 'pending';

  return (
    <SafeAreaView style={styles.container}>
      {story.coverImageUrl ? (
        <ImageBackground
          source={{ uri: story.coverImageUrl }}
          style={styles.backgroundImage}
          blurRadius={8}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
            style={styles.gradient}
          >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
              <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.headerSpacer} />
          </View>

          {/* Main content */}
          <View style={styles.content}>
            <Animated.View 
              style={[
                styles.titleContainer,
                {
                  opacity: fadeAnim,
                  transform: [
                    { translateY: slideAnim },
                    { scale: scaleAnim }
                  ]
                }
              ]}
            >
              {/* Magic sparkle icon */}
              <View style={styles.iconContainer}>
                <View style={styles.magicCircle}>
                  <IconSymbol name="sparkles" size={48} color="#FFD700" />
                </View>
              </View>

              {/* Title */}
              <Text style={styles.title}>{story.title}</Text>

              {/* Story details */}
              <View style={styles.detailsContainer}>
                <View style={styles.detailItem}>
                  <IconSymbol name="book.pages" size={16} color="#E5E7EB" />
                  <Text style={styles.detailText}>
                    {story.storyContent?.length || 0} pages
                  </Text>
                </View>
                
                {story.storyConfiguration?.selectedChildren && story.storyConfiguration.selectedChildren.length > 0 && (
                  <View style={styles.detailItem}>
                    <IconSymbol name="person.2" size={16} color="#E5E7EB" />
                    <Text style={styles.detailText}>
                      {story.storyConfiguration.selectedChildren.length} character{story.storyConfiguration.selectedChildren.length > 1 ? 's' : ''}
                    </Text>
                  </View>
                )}

                <View style={styles.detailItem}>
                  <IconSymbol name="clock" size={16} color="#E5E7EB" />
                  <Text style={styles.detailText}>
                    {story.storyConfiguration?.length || 'medium'} story
                  </Text>
                </View>
              </View>

              {/* Image generation status */}
              {story.storyConfiguration?.enableIllustrations && (
                <View style={styles.statusContainer}>
                  <View style={styles.statusRow}>
                    {isGeneratingImages ? (
                      <View style={styles.loadingIcon}>
                        <IconSymbol name="paintbrush" size={20} color="#6366F1" />
                      </View>
                    ) : (
                      <IconSymbol 
                        name={story.imageGenerationStatus === 'completed' ? "checkmark.circle.fill" : "photo"} 
                        size={20} 
                        color={story.imageGenerationStatus === 'completed' ? "#10B981" : "#6366F1"} 
                      />
                    )}
                    <Text style={[
                      styles.statusText,
                      story.imageGenerationStatus === 'completed' && styles.statusTextSuccess
                    ]}>
                      {getImageGenerationStatus()}
                    </Text>
                  </View>
                  
                  {isGeneratingImages && (
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBar}>
                        <View 
                          style={[
                            styles.progressFill, 
                            { 
                              width: `${((story.imagesGenerated || 0) / (story.totalImages || 1)) * 100}%` 
                            }
                          ]} 
                        />
                      </View>
                    </View>
                  )}
                </View>
              )}
            </Animated.View>
          </View>

          {/* Footer */}
          <Animated.View 
            style={[
              styles.footer,
              { opacity: fadeAnim }
            ]}
          >
            <Button
              title="Start Reading"
              onPress={onStartReading}
              size="large"
              leftIcon="book.open"
              style={styles.startButton}
            />
            
            {isGeneratingImages && (
              <Text style={styles.footerNote}>
                ✨ Illustrations will appear as you read
              </Text>
            )}
          </Animated.View>
          </LinearGradient>
        </ImageBackground>
      ) : (
        <View style={[styles.gradient, styles.solidBackground]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
              <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.headerSpacer} />
          </View>

          {/* Main content */}
          <View style={styles.content}>
            <Animated.View 
              style={[
                styles.titleContainer,
                {
                  opacity: fadeAnim,
                  transform: [
                    { translateY: slideAnim },
                    { scale: scaleAnim }
                  ]
                }
              ]}
            >
              {/* Magic sparkle icon */}
              <View style={styles.iconContainer}>
                <View style={styles.magicCircle}>
                  <IconSymbol name="sparkles" size={48} color="#FFD700" />
                </View>
              </View>

              {/* Title */}
              <Text style={styles.title}>{story.title}</Text>

              {/* Story details */}
              <View style={styles.detailsContainer}>
                <View style={styles.detailItem}>
                  <IconSymbol name="book.pages" size={16} color="#E5E7EB" />
                  <Text style={styles.detailText}>
                    {story.storyContent?.length || 0} pages
                  </Text>
                </View>
                
                {story.storyConfiguration?.selectedChildren && story.storyConfiguration.selectedChildren.length > 0 && (
                  <View style={styles.detailItem}>
                    <IconSymbol name="person.2" size={16} color="#E5E7EB" />
                    <Text style={styles.detailText}>
                      {story.storyConfiguration.selectedChildren.length} character{story.storyConfiguration.selectedChildren.length > 1 ? 's' : ''}
                    </Text>
                  </View>
                )}

                <View style={styles.detailItem}>
                  <IconSymbol name="clock" size={16} color="#E5E7EB" />
                  <Text style={styles.detailText}>
                    {story.storyConfiguration?.length || 'medium'} story
                  </Text>
                </View>
              </View>

              {/* Image generation status */}
              {story.storyConfiguration?.enableIllustrations && (
                <View style={styles.statusContainer}>
                  <View style={styles.statusRow}>
                    {isGeneratingImages ? (
                      <View style={styles.loadingIcon}>
                        <IconSymbol name="paintbrush" size={20} color="#6366F1" />
                      </View>
                    ) : (
                      <IconSymbol 
                        name={story.imageGenerationStatus === 'completed' ? "checkmark.circle.fill" : "photo"} 
                        size={20} 
                        color={story.imageGenerationStatus === 'completed' ? "#10B981" : "#6366F1"} 
                      />
                    )}
                    <Text style={[
                      styles.statusText,
                      story.imageGenerationStatus === 'completed' && styles.statusTextSuccess
                    ]}>
                      {getImageGenerationStatus()}
                    </Text>
                  </View>
                  
                  {isGeneratingImages && (
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBar}>
                        <View 
                          style={[
                            styles.progressFill, 
                            { 
                              width: `${((story.imagesGenerated || 0) / (story.totalImages || 1)) * 100}%` 
                            }
                          ]} 
                        />
                      </View>
                    </View>
                  )}
                </View>
              )}
            </Animated.View>
          </View>

          {/* Footer */}
          <Animated.View 
            style={[
              styles.footer,
              { opacity: fadeAnim }
            ]}
          >
            <Button
              title="Start Reading"
              onPress={onStartReading}
              size="large"
              leftIcon="book.open"
              style={styles.startButton}
            />
            
            {isGeneratingImages && (
              <Text style={styles.footerNote}>
                ✨ Illustrations will appear as you read
              </Text>
            )}
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backgroundImage: {
    flex: 1,
    width: screenWidth,
    height: screenHeight,
  },
  gradient: {
    flex: 1,
    justifyContent: 'space-between',
  },
  solidBackground: {
    backgroundColor: '#6366F1',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(10px)',
  },
  headerSpacer: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  titleContainer: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  magicCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,215,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,215,0,0.3)',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 38,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  detailsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 32,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#E5E7EB',
    fontWeight: '500',
  },
  statusContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 16,
    borderRadius: 16,
    minWidth: 280,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingIcon: {
    animation: 'spin 2s linear infinite',
  },
  statusText: {
    fontSize: 16,
    color: '#E5E7EB',
    fontWeight: '500',
  },
  statusTextSuccess: {
    color: '#10B981',
  },
  progressContainer: {
    width: '100%',
    marginTop: 12,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 2,
  },
  footer: {
    paddingHorizontal: 32,
    paddingBottom: 40,
    alignItems: 'center',
  },
  startButton: {
    paddingHorizontal: 48,
    marginBottom: 16,
    backgroundColor: '#6366F1',
    borderRadius: 16,
  },
  footerNote: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});