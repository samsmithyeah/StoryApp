import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Story } from '@/types/story.types';
import { IconSymbol } from '../ui/IconSymbol';

interface StoryCardProps {
  story: Story;
  onPress: () => void;
}

export const StoryCard: React.FC<StoryCardProps> = ({ story, onPress }) => {
  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getPageCount = () => {
    return story.storyContent?.length || 0;
  };

  const renderImageStatus = () => {
    if (!story.storyConfiguration.illustrationStyle) {
      return null;
    }

    if (story.imageGenerationStatus === 'generating') {
      return (
        <View style={styles.imageStatusBadge}>
          <ActivityIndicator size="small" color="#6366F1" />
          <Text style={styles.imageStatusText}>
            {story.imagesGenerated}/{story.totalImages}
          </Text>
        </View>
      );
    }

    if (story.imageGenerationStatus === 'failed') {
      return (
        <View style={[styles.imageStatusBadge, styles.imageStatusError]}>
          <IconSymbol name="exclamationmark.circle.fill" size={16} color="#EF4444" />
        </View>
      );
    }

    return null;
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.imageContainer}>
        {story.coverImageUrl ? (
          <Image source={{ uri: story.coverImageUrl }} style={styles.coverImage} />
        ) : (
          <View style={styles.placeholderCover}>
            <IconSymbol name="book.closed.fill" size={32} color="#9CA3AF" />
          </View>
        )}
        {renderImageStatus()}
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {story.title}
        </Text>
        
        <View style={styles.metadata}>
          <View style={styles.metadataItem}>
            <IconSymbol name="calendar" size={14} color="#6B7280" />
            <Text style={styles.metadataText}>{formatDate(story.createdAt)}</Text>
          </View>
          
          <View style={styles.metadataItem}>
            <IconSymbol name="book.pages" size={14} color="#6B7280" />
            <Text style={styles.metadataText}>{getPageCount()} pages</Text>
          </View>
        </View>
        
        <View style={styles.theme}>
          <Text style={styles.themeText}>{story.storyConfiguration.theme}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 180,
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderCover: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageStatusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  imageStatusError: {
    paddingHorizontal: 4,
  },
  imageStatusText: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '500',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  metadata: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metadataText: {
    fontSize: 12,
    color: '#6B7280',
  },
  theme: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  themeText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },
});