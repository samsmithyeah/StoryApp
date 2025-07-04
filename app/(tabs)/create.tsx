import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { IconSymbol } from '../../components/ui/IconSymbol';
import { Button } from '../../components/ui/Button';
import { StoryWizard } from '../../components/wizard/StoryWizard';
import { useChildren } from '../../hooks/useChildren';
import { StoryConfiguration } from '../../types/story.types';
import { router } from 'expo-router';

export default function CreateScreen() {
  const { children } = useChildren();
  const [showWizard, setShowWizard] = useState(false);


  const handleCreateStory = () => {
    if (children.length === 0) {
      Alert.alert(
        'No Children Added',
        'Please add at least one child profile in Settings before creating a story.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Go to Settings', onPress: () => router.push('/(tabs)/settings') },
        ]
      );
      return;
    }
    setShowWizard(true);
  };

  const handleWizardComplete = async (wizardData: StoryConfiguration) => {
    setShowWizard(false);
    
    try {
      // If we have a storyId, the story was already generated
      if (wizardData.storyId) {
        // Navigate directly to the story viewer
        router.push({
          pathname: '/story/[id]',
          params: { id: wizardData.storyId }
        });
      }
    } catch (error) {
      console.error('Error navigating to story:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to load story. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };


  if (showWizard) {
    return (
      <StoryWizard
        onComplete={handleWizardComplete}
        onCancel={() => setShowWizard(false)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Story</Text>
          <Text style={styles.subtitle}>Let&apos;s create a magical bedtime story</Text>
        </View>

        <View style={styles.mainContent}>
          <View style={styles.illustrationContainer}>
            <IconSymbol name="wand.and.stars" size={80} color="#6366F1" />
          </View>

          <Text style={styles.mainTitle}>Ready to create magic?</Text>
          <Text style={styles.mainText}>
            Our story wizard will help you craft a personalized bedtime adventure that your little one will love.
          </Text>

          <Button
            title="Start Creating"
            onPress={handleCreateStory}
            size="large"
            leftIcon="sparkles"
            style={styles.createButton}
          />

          <View style={styles.features}>
            <View style={styles.featureItem}>
              <IconSymbol name="checkmark.circle.fill" size={20} color="#10B981" />
              <Text style={styles.featureText}>Personalized for your child</Text>
            </View>
            <View style={styles.featureItem}>
              <IconSymbol name="checkmark.circle.fill" size={20} color="#10B981" />
              <Text style={styles.featureText}>AI-generated illustrations</Text>
            </View>
            <View style={styles.featureItem}>
              <IconSymbol name="checkmark.circle.fill" size={20} color="#10B981" />
              <Text style={styles.featureText}>6-8 page adventures</Text>
            </View>
          </View>
        </View>
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
  mainContent: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  illustrationContainer: {
    marginBottom: 32,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  mainText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 24,
  },
  createButton: {
    paddingHorizontal: 48,
    marginBottom: 48,
  },
  features: {
    width: '100%',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  featureText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },
});