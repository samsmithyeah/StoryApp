import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '../../components/ui/IconSymbol';
import { StoryCard } from '../../components/story/StoryCard';
import { getStories } from '../../services/firebase/stories';
import { Story } from '../../types/story.types';
import { db } from '../../services/firebase/config';
import { collection, query, where, onSnapshot, orderBy } from '@react-native-firebase/firestore';
import { useAuth } from '../../hooks/useAuth';

export default function LibraryScreen() {
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Set up real-time listener for stories
    const q = query(
      collection(db, 'stories'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const updatedStories = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Story[];
      
      setStories(updatedStories);
      setLoading(false);
    }, (error) => {
      console.error('Error listening to stories:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const fetchedStories = await getStories();
      setStories(fetchedStories);
    } catch (error) {
      console.error('Error refreshing stories:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleStoryPress = (story: Story) => {
    router.push({
      pathname: '/story/[id]',
      params: { id: story.id }
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>My Stories</Text>
          <Text style={styles.subtitle}>Your magical collection of bedtime stories</Text>
        </View>

        {stories.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="book.closed.fill" size={64} color="#D1D5DB" />
            <Text style={styles.emptyStateTitle}>No stories yet</Text>
            <Text style={styles.emptyStateText}>
              Create your first magical story by tapping the Create tab below
            </Text>
          </View>
        ) : (
          <View style={styles.storiesContainer}>
            {stories.map((story) => (
              <StoryCard
                key={story.id}
                story={story}
                onPress={() => handleStoryPress(story)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 24,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  storiesContainer: {
    paddingBottom: 24,
  },
});
