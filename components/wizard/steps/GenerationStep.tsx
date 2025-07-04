import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Button } from '@/components/ui/Button';
import { IconSymbol } from '@/components/ui/IconSymbol';

interface GenerationStepProps {
  isGenerating: boolean;
  onCancel: () => void;
}

const GENERATION_MESSAGES = [
  'Crafting your magical story...',
  'Choosing the perfect characters...',
  'Painting beautiful illustrations...',
  'Adding magical touches...',
  'Almost ready for bedtime...',
];

export const GenerationStep: React.FC<GenerationStepProps> = ({
  isGenerating,
  onCancel,
}) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    if (!isGenerating) return;

    const messageInterval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % GENERATION_MESSAGES.length);
    }, 3000);

    return () => {
      clearInterval(messageInterval);
    };
  }, [isGenerating]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.animationContainer}>
          <View style={styles.magicCircle}>
            <IconSymbol name="wand.and.stars" size={64} color="#6366F1" />
          </View>
          <ActivityIndicator 
            size="large" 
            color="#6366F1" 
            style={styles.spinner}
          />
        </View>

        <Text style={styles.title}>Creating Your Story</Text>
        <Text style={styles.message}>
          {GENERATION_MESSAGES[currentMessageIndex]}
        </Text>

        <View style={styles.tipContainer}>
          <IconSymbol name="lightbulb" size={16} color="#F59E0B" />
          <Text style={styles.tipText}>
            Tip: Your story will be saved to your library for future bedtime reading!
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          title="Cancel"
          onPress={onCancel}
          variant="outline"
          size="large"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEFEFE',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 48,
  },
  animationContainer: {
    position: 'relative',
    marginBottom: 48,
  },
  magicCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 18,
    color: '#6366F1',
    textAlign: 'center',
    marginBottom: 32,
    fontWeight: '500',
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
});