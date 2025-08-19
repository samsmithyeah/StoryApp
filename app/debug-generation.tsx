import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { GenerationStep } from '../components/wizard/steps/GenerationStep';
import { Story } from '../types/story.types';
import { Colors, Spacing, Typography } from '../constants/Theme';

// Mock story data for testing different states
const createMockStory = (state: 'empty' | 'text-only' | 'with-cover' | 'complete'): Story | null => {
  if (state === 'empty') return null;
  
  const baseStory: Story = {
    id: 'test-story-123',
    userId: 'test-user',
    title: 'The Magical Adventure Test Story',
    createdAt: new Date(),
    storyContent: [
      { page: 1, text: 'Once upon a time...', imageUrl: '' },
      { page: 2, text: 'There was a brave little hero...', imageUrl: '' },
    ],
    coverImageUrl: state === 'with-cover' || state === 'complete' ? 'https://example.com/cover.jpg' : '',
    storyConfiguration: {
      selectedChildren: ['child1'],
      theme: 'adventure',
      pageCount: 2,
      illustrationStyle: 'watercolor',
      enableIllustrations: true,
    },
    imageGenerationStatus: state === 'complete' ? 'completed' : 'generating',
    imagesGenerated: state === 'complete' ? 2 : 0,
    totalImages: 2,
  };

  return baseStory;
};

export default function DebugGenerationScreen() {
  const [testState, setTestState] = useState<'empty' | 'text-only' | 'with-cover' | 'complete'>('empty');
  const [isGenerating, setIsGenerating] = useState(true);
  const [showError, setShowError] = useState(false);

  const mockStory = createMockStory(testState);

  return (
    <View style={styles.container}>
      {/* Test Controls */}
      <View style={styles.controls}>
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            onPress={() => { setTestState('empty'); setIsGenerating(true); setShowError(false); }}
            style={[styles.button, testState === 'empty' && styles.activeButton]}
          >
            <Text style={[styles.buttonText, testState === 'empty' && styles.activeButtonText]}>
              Empty State
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => { setTestState('text-only'); setIsGenerating(true); setShowError(false); }}
            style={[styles.button, testState === 'text-only' && styles.activeButton]}
          >
            <Text style={[styles.buttonText, testState === 'text-only' && styles.activeButtonText]}>
              Text Ready
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => { setTestState('with-cover'); setIsGenerating(true); setShowError(false); }}
            style={[styles.button, testState === 'with-cover' && styles.activeButton]}
          >
            <Text style={[styles.buttonText, testState === 'with-cover' && styles.activeButtonText]}>
              + Cover Image
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => { setTestState('complete'); setIsGenerating(false); setShowError(false); }}
            style={[styles.button, testState === 'complete' && styles.activeButton]}
          >
            <Text style={[styles.buttonText, testState === 'complete' && styles.activeButtonText]}>
              Complete
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            onPress={() => setIsGenerating(!isGenerating)}
            style={styles.button}
          >
            <Text style={styles.buttonText}>
              {isGenerating ? 'Stop Generation' : 'Start Generation'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => { setShowError(!showError); setIsGenerating(false); }}
            style={[styles.button, showError && styles.activeButton]}
          >
            <Text style={[styles.buttonText, showError && styles.activeButtonText]}>
              {showError ? 'Hide' : 'Show'} Error
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Generation Step Component */}
      <GenerationStep
        isGenerating={isGenerating}
        error={showError ? "Insufficient credits to generate this story. You need more credits to continue your magical storytelling journey." : null}
        storyData={mockStory}
        onCancel={() => console.log('Cancel pressed')}
        onNavigateToStory={() => console.log('Navigate to story pressed')}
        onStartOver={() => console.log('Start over pressed')}
        _debugForceStates={{
          textReady: testState === 'text-only' || testState === 'with-cover' || testState === 'complete',
          coverReady: testState === 'with-cover' || testState === 'complete',
          imagesReady: testState === 'complete',
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  controls: {
    position: 'absolute',
    top: 50,
    left: 10,
    right: 10,
    zIndex: 1000,
    backgroundColor: 'rgba(0,0,0,0.9)',
    padding: Spacing.lg,
    borderRadius: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
    flexWrap: 'wrap',
  },
  button: {
    backgroundColor: Colors.backgroundLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 4,
    flex: 1,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeButton: {
    backgroundColor: Colors.primary,
  },
  buttonText: {
    color: Colors.text,
    fontSize: Typography.fontSize.tiny,
    textAlign: 'center',
  },
  activeButtonText: {
    color: Colors.textDark,
    fontWeight: Typography.fontWeight.bold,
  },
});