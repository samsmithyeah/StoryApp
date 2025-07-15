import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { Story } from '@/types/story.types';
import { IconSymbol } from '../ui/IconSymbol';
import { Button } from '../ui/Button';
import { useStorageUrls } from '@/hooks/useStorageUrl';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface StoryViewerProps {
  story: Story;
  onClose?: () => void;
}

export const StoryViewer: React.FC<StoryViewerProps> = ({ story, onClose }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [imageLoading, setImageLoading] = useState<boolean[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Get authenticated URLs for all page images
  const imagePaths = story.storyContent?.map(page => page.imageUrl) || [];
  const imageUrls = useStorageUrls(imagePaths);
  
  // Calculate responsive image height
  const isLandscape = screenWidth > screenHeight;
  const maxImageHeight = isLandscape ? screenHeight * 0.5 : screenWidth * 0.75;
  const imageHeight = Math.min(maxImageHeight, screenWidth * 0.75);

  useEffect(() => {
    // Initialize image loading states
    if (story.storyContent && Array.isArray(story.storyContent)) {
      setImageLoading(new Array(story.storyContent.length).fill(true));
    }
  }, [story]);

  const handleImageLoad = (index: number) => {
    setImageLoading(prev => {
      const newState = [...prev];
      newState[index] = false;
      return newState;
    });
  };

  const goToPage = (pageIndex: number) => {
    if (story.storyContent && Array.isArray(story.storyContent) && 
        pageIndex >= 0 && pageIndex < story.storyContent.length) {
      setCurrentPage(pageIndex);
      scrollViewRef.current?.scrollTo({
        x: pageIndex * screenWidth,
        animated: true,
      });
    }
  };

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const pageIndex = Math.round(contentOffsetX / screenWidth);
    if (pageIndex !== currentPage && pageIndex >= 0 && pageIndex < story.storyContent.length) {
      setCurrentPage(pageIndex);
    }
  };

  const renderPage = (page: any, index: number) => {
    const imageUrl = imageUrls[index];
    
    return (
      <View key={index} style={styles.pageContainer}>
        <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
          {imageUrl ? (
            <View style={[styles.imageContainer, { height: imageHeight }]}>
              {imageLoading[index] && (
                <ActivityIndicator size="large" color="#6366F1" style={styles.imageLoader} />
              )}
              <Image
                source={{ uri: imageUrl }}
                style={styles.pageImage}
                onLoad={() => handleImageLoad(index)}
                resizeMode="cover"
              />
            </View>
          ) : (
            <View style={[styles.placeholderImage, { height: imageHeight }]}>
              <IconSymbol name="photo" size={48} color="#D1D5DB" />
              {(story.imageGenerationStatus === 'generating' || story.imageGenerationStatus === 'pending') && (
                <View style={styles.placeholderLoadingContainer}>
                  <ActivityIndicator size="small" color="#6366F1" style={styles.placeholderSpinner} />
                  <Text style={styles.placeholderText}>Image generating...</Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.textContainer}>
            <Text style={styles.pageNumber}>Page {page.page} of {story.storyContent?.length || 0}</Text>
            <Text style={styles.pageText}>{page.text}</Text>
          </View>

          {index === currentPage && renderImageGenerationStatus()}
        </ScrollView>
      </View>
    );
  };

  // Handle case where storyContent might be undefined or not an array
  if (!story.storyContent || !Array.isArray(story.storyContent) || story.storyContent.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose || (() => router.back())} style={styles.closeButton}>
            <IconSymbol name="xmark" size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.title}>{story.title}</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <IconSymbol name="exclamationmark.circle" size={48} color="#EF4444" />
          <Text style={styles.errorText}>Story content is loading...</Text>
        </View>
      </View>
    );
  }

  const isFirstPage = currentPage === 0;
  const isLastPage = currentPage === story.storyContent.length - 1;

  const renderImageGenerationStatus = () => {
    if (story.imageGenerationStatus === 'not_requested' || !story.storyConfiguration?.illustrationStyle) {
      return null;
    }

    if (story.imageGenerationStatus === 'pending' || story.imageGenerationStatus === 'generating') {
      const progress = (story.imagesGenerated || 0) / (story.totalImages || 1);
      return (
        <View style={styles.imageGenerationStatus}>
          <Text style={styles.imageGenerationText}>
            Generating illustrations... {story.imagesGenerated || 0} of {story.totalImages || 0}
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { flex: progress }]} />
            <View style={{ flex: 1 - progress }} />
          </View>
        </View>
      );
    }

    if (story.imageGenerationStatus === 'failed') {
      return (
        <View style={styles.imageGenerationStatus}>
          <Text style={styles.imageGenerationErrorText}>
            Some illustrations couldn&apos;t be generated
          </Text>
        </View>
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose || (() => router.back())} style={styles.closeButton}>
          <IconSymbol name="xmark" size={24} color="#6B7280" />
        </TouchableOpacity>
        <Text style={styles.title}>{story.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={styles.content}
      >
        {story.storyContent.map((page, index) => renderPage(page, index))}
      </ScrollView>

      <View style={styles.navigation}>
        <Button
          title="Previous"
          onPress={() => goToPage(currentPage - 1)}
          variant="secondary"
          disabled={isFirstPage}
          leftIcon="chevron.left"
          style={styles.navButton}
        />
        
        <View style={styles.pageIndicator}>
          {story.storyContent?.map((_, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => goToPage(index)}
              style={[
                styles.pageDot,
                index === currentPage && styles.pageDotActive,
              ]}
            />
          )) || []}
        </View>

        <Button
          title="Next"
          onPress={() => goToPage(currentPage + 1)}
          variant="secondary"
          disabled={isLastPage}
          rightIcon="chevron.right"
          style={styles.navButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  pageContainer: {
    width: screenWidth,
  },
  imageContainer: {
    width: screenWidth,
    backgroundColor: '#F3F4F6',
    position: 'relative',
  },
  pageImage: {
    width: '100%',
    height: '100%',
  },
  imageLoader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
  },
  placeholderImage: {
    width: screenWidth,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 14,
    color: '#6B7280',
  },
  placeholderLoadingContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  placeholderSpinner: {
    marginBottom: 8,
  },
  textContainer: {
    padding: 24,
  },
  pageNumber: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  pageText: {
    fontSize: 18,
    lineHeight: 28,
    color: '#111827',
  },
  imageGenerationStatus: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  imageGenerationText: {
    fontSize: 14,
    color: '#6366F1',
    marginBottom: 8,
  },
  imageGenerationErrorText: {
    fontSize: 14,
    color: '#EF4444',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  progressFill: {
    height: 4,
    backgroundColor: '#6366F1',
    borderRadius: 2,
  },
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  navButton: {
    minWidth: 100,
  },
  pageIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  pageDotActive: {
    backgroundColor: '#6366F1',
    width: 24,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
  },
});