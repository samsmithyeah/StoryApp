import React, { useState, useEffect } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { StoryViewer } from '../../components/story/StoryViewer';
import { StoryTitleScreen } from '../../components/story/StoryTitleScreen';
import { Story } from '../../types/story.types';
import { getStory } from '../../services/firebase/stories';
import { db } from '../../services/firebase/config';
import { doc, onSnapshot } from '@react-native-firebase/firestore';
import { Button } from '../../components/ui/Button';
import { IconSymbol } from '../../components/ui/IconSymbol';

export default function StoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTitleScreen, setShowTitleScreen] = useState(true);

  useEffect(() => {
    if (!id) {
      setError('No story ID provided');
      setLoading(false);
      return;
    }

    let unsubscribe: (() => void) | null = null;
    let refreshInterval: NodeJS.Timeout | null = null;

    const loadStory = async () => {
      try {
        // Load initial story
        const storyData = await getStory(id);
        setStory(storyData);
        setLoading(false);

        // Set up real-time listener for updates (especially for image generation)
        const storyDoc = doc(db, 'stories', id);
        unsubscribe = onSnapshot(storyDoc, (doc) => {
          if (doc.exists()) {
            const docData = doc.data();
            console.log('Raw docData keys:', Object.keys(docData || {}));
            console.log('storyContent value:', docData?.storyContent);
            
            // Calculate pages with images for both array and object formats
            let pagesWithImages = 0;
            if (Array.isArray(docData?.storyContent)) {
              pagesWithImages = docData.storyContent.filter((page: any) => page.imageUrl).length;
            } else if (typeof docData?.storyContent === 'object' && docData.storyContent) {
              pagesWithImages = Object.values(docData.storyContent).filter((page: any) => page.imageUrl).length;
            }
            
            console.log('Real-time update received:', {
              hasStoryContent: !!docData?.storyContent,
              storyContentLength: Array.isArray(docData?.storyContent) ? docData.storyContent.length : Object.keys(docData?.storyContent || {}).length,
              imageGenerationStatus: docData?.imageGenerationStatus,
              imagesGenerated: docData?.imagesGenerated,
              pagesWithImages,
              storyContentType: typeof docData?.storyContent,
              isArray: Array.isArray(docData?.storyContent),
            });
            
            setStory(currentStory => {
              if (!currentStory) {
                console.warn('No current story when processing real-time update');
                return currentStory;
              }
              
              // Check what type of update this is
              const hasStoryContent = docData?.storyContent && (Array.isArray(docData.storyContent) || typeof docData.storyContent === 'object');
              const isArrayStoryContent = Array.isArray(docData?.storyContent);
              const isImageUpdate = docData?.imageGenerationStatus !== undefined || docData?.imagesGenerated !== undefined;
              const isStatusOnlyUpdate = !hasStoryContent && isImageUpdate;
              
              // Always allow updates if they have story content or are image status updates
              if (!hasStoryContent && !isImageUpdate) {
                console.warn('Ignoring real-time update without story content or image data');
                return currentStory;
              }
              
              let updatedStory;
              
              if (isStatusOnlyUpdate) {
                // This is just a status update (imageGenerationStatus, imagesGenerated, etc.)
                // Don't touch storyContent, just update the status fields
                console.log('Processing status-only update');
                updatedStory = {
                  ...currentStory,
                  imageGenerationStatus: docData.imageGenerationStatus || currentStory.imageGenerationStatus,
                  imagesGenerated: docData.imagesGenerated !== undefined ? docData.imagesGenerated : currentStory.imagesGenerated,
                  totalImages: docData.totalImages !== undefined ? docData.totalImages : currentStory.totalImages,
                  imageGenerationError: docData.imageGenerationError || currentStory.imageGenerationError,
                } as Story;
              } else {
                // We have story content, so merge it intelligently
                console.log('Processing full content update');
                
                // Handle merging based on data format
                let mergedStoryContent: any[] = [...(currentStory.storyContent || [])];
                
                if (isArrayStoryContent) {
                  // Full array update - merge each page
                  console.log('Full array update with', docData.storyContent.length, 'pages');
                  mergedStoryContent = docData.storyContent.map((newPage: any, index: number) => {
                    const existingPage = currentStory.storyContent?.[index];
                    return {
                      ...existingPage,
                      ...newPage,
                      imageUrl: newPage.imageUrl || existingPage?.imageUrl || '',
                    };
                  });
                } else if (typeof docData.storyContent === 'object') {
                  // Partial object update - only update specific pages
                  console.log('Partial object update with keys:', Object.keys(docData.storyContent));
                  
                  // Apply updates to specific pages without losing others
                  Object.keys(docData.storyContent).forEach(key => {
                    const pageIndex = parseInt(key);
                    const newPageData = docData.storyContent[key];
                    
                    if (pageIndex >= 0 && pageIndex < mergedStoryContent.length) {
                      // Update existing page
                      mergedStoryContent[pageIndex] = {
                        ...mergedStoryContent[pageIndex],
                        ...newPageData,
                        // Always use new imageUrl if provided
                        imageUrl: newPageData.imageUrl || mergedStoryContent[pageIndex]?.imageUrl || '',
                      };
                      console.log(`Updated page ${pageIndex + 1} with image:`, !!newPageData.imageUrl);
                    }
                  });
                }
                
                console.log('Final merged content:', mergedStoryContent.length, 'pages');
                mergedStoryContent.forEach((page, index) => {
                  console.log(`Page ${index + 1} has image:`, !!page.imageUrl);
                });
                
                updatedStory = {
                  ...currentStory,
                  ...docData,
                  id: doc.id,
                  createdAt: docData?.createdAt?.toDate() || currentStory.createdAt,
                  storyContent: mergedStoryContent,
                } as Story;
              }
              
              console.log('Updated story:', {
                hasStoryContent: !!updatedStory.storyContent,
                storyContentLength: updatedStory.storyContent?.length,
                imageGenerationStatus: updatedStory.imageGenerationStatus,
                pagesWithImages: updatedStory.storyContent?.filter(page => page.imageUrl).length || 0,
              });
              
              return updatedStory;
            });
          }
        });

        // Set up periodic refresh for image updates as a fallback
        // This is needed because the backend might not update individual images in real-time
        refreshInterval = setInterval(async () => {
          if (story?.imageGenerationStatus === 'generating') {
            try {
              console.log('Periodic refresh: fetching latest story data');
              const latestStory = await getStory(id);
              setStory(currentStory => {
                if (!currentStory) return latestStory;
                
                // Only update if we got new image data
                const currentImages = Array.isArray(currentStory.storyContent) 
                  ? currentStory.storyContent.filter(page => page.imageUrl).length 
                  : 0;
                const newImages = Array.isArray(latestStory.storyContent) 
                  ? latestStory.storyContent.filter(page => page.imageUrl).length 
                  : 0;
                
                if (newImages > currentImages || latestStory.imageGenerationStatus !== currentStory.imageGenerationStatus) {
                  console.log(`Periodic refresh: found ${newImages} images (was ${currentImages})`);
                  return latestStory;
                }
                
                return currentStory;
              });
            } catch (error) {
              console.error('Error during periodic refresh:', error);
            }
          }
        }, 10000); // Check every 10 seconds

      } catch (err) {
        console.error('Error loading story:', err);
        setError(err instanceof Error ? err.message : 'Failed to load story');
        setLoading(false);
      }
    };

    loadStory();

    // Cleanup listener and interval on unmount
    return () => {
      if (unsubscribe) unsubscribe();
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [id, story?.imageGenerationStatus]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading your story...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <IconSymbol name="exclamationmark.triangle" size={64} color="#EF4444" />
          <Text style={styles.errorTitle}>Oops!</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Button
            title="Go Back"
            onPress={() => router.back()}
            variant="outline"
            style={styles.errorButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (!story) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <IconSymbol name="book.closed" size={64} color="#9CA3AF" />
          <Text style={styles.errorTitle}>Story Not Found</Text>
          <Text style={styles.errorText}>The story you&apos;re looking for doesn&apos;t exist.</Text>
          <Button
            title="Go Back"
            onPress={() => router.back()}
            variant="outline"
            style={styles.errorButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  const handleStartReading = () => {
    setShowTitleScreen(false);
  };

  const handleGoBack = () => {
    router.back();
  };

  if (showTitleScreen) {
    return (
      <StoryTitleScreen 
        story={story} 
        onStartReading={handleStartReading}
        onGoBack={handleGoBack}
      />
    );
  }

  return <StoryViewer story={story} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 48,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 48,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  errorButton: {
    paddingHorizontal: 32,
  },
});