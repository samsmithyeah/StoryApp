import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Story } from '@/types/story.types';
import { IconSymbol } from '../ui/IconSymbol';

interface StoryCardProps {
  story: Story;
  onPress: () => void;
}

export const StoryCard: React.FC<StoryCardProps> = ({ story, onPress }) => {
  const [imageError, setImageError] = React.useState(false);
  const imageUrl = story.coverImageUrl || story.storyContent?.[0]?.imageUrl;
  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      month: 'long', 
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
        {!imageError && imageUrl ? (
          <Image 
            source={{ uri: imageUrl }}
            style={styles.coverImage}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={styles.placeholderCover}>
            <IconSymbol name="book.closed.fill" size={24} color="#D4AF37" />
          </View>
        )}
        {renderImageStatus()}
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {story.title}
        </Text>
        <Text style={styles.metadata}>
          {formatDate(story.createdAt)} · {getPageCount()} pages
        </Text>
        <Text style={styles.themeText}>{story.storyConfiguration.theme}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D4AF37',
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 110,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  placeholderCover: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(26, 27, 58, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageStatusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 27, 58, 0.8)',
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
    color: '#D4AF37',
    fontWeight: '500',
  },
  content: {
    padding: 8,
    paddingTop: 6,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 11,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 2,
    lineHeight: 14,
  },
  metadata: {
    fontSize: 8,
    color: '#999',
    marginBottom: 1,
  },
  themeText: {
    fontSize: 8,
    color: '#999',
    fontStyle: 'italic',
  },
});