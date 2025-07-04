import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Button } from '@/components/ui/Button';
import { IconSymbol } from '@/components/ui/IconSymbol';

interface Mood {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
}

const MOODS: Mood[] = [
  {
    id: 'dreamy',
    name: 'Dreamy',
    icon: 'moon.stars.fill',
    description: 'Soft and sleepy',
    color: '#9333EA',
  },
  {
    id: 'exciting',
    name: 'Exciting',
    icon: 'bolt.fill',
    description: 'Full of adventure',
    color: '#F59E0B',
  },
  {
    id: 'funny',
    name: 'Funny',
    icon: 'face.smiling.fill',
    description: 'Giggles and laughs',
    color: '#10B981',
  },
  {
    id: 'gentle',
    name: 'Gentle',
    icon: 'heart.fill',
    description: 'Calm and peaceful',
    color: '#EC4899',
  },
  {
    id: 'mysterious',
    name: 'Mysterious',
    icon: 'questionmark.circle.fill',
    description: 'Full of wonder',
    color: '#6366F1',
  },
  {
    id: 'cozy',
    name: 'Cozy',
    icon: 'house.fill',
    description: 'Warm and snuggly',
    color: '#EF4444',
  },
];

interface MoodSelectionProps {
  selectedMood?: string;
  onSelect: (mood: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const MoodSelection: React.FC<MoodSelectionProps> = ({
  selectedMood,
  onSelect,
  onNext,
  onBack,
}) => {
  const handleMoodSelect = (moodId: string) => {
    onSelect(moodId);
  };

  const isNextDisabled = !selectedMood;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>How should it feel?</Text>
        <Text style={styles.subtitle}>
          Set the mood for tonight's story
        </Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.moodsGrid}>
          {MOODS.map((mood) => {
            const isSelected = mood.id === selectedMood;
            
            return (
              <TouchableOpacity
                key={mood.id}
                style={[styles.moodCard, isSelected && styles.selectedCard]}
                onPress={() => handleMoodSelect(mood.id)}
              >
                <View style={[
                  styles.iconContainer,
                  isSelected && styles.selectedIconContainer,
                  { backgroundColor: mood.color + '20' }
                ]}>
                  <IconSymbol
                    name={mood.icon}
                    size={32}
                    color={isSelected ? '#FFFFFF' : mood.color}
                  />
                </View>
                <Text style={[styles.moodName, isSelected && styles.selectedText]}>
                  {mood.name}
                </Text>
                <Text style={[styles.moodDescription, isSelected && styles.selectedDescription]}>
                  {mood.description}
                </Text>
                {isSelected && (
                  <View style={[styles.selectedIndicator, { backgroundColor: mood.color }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Back"
          onPress={onBack}
          variant="outline"
          size="large"
          style={styles.backButton}
        />
        <Button
          title="Next"
          onPress={onNext}
          disabled={isNextDisabled}
          size="large"
          style={styles.nextButton}
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
  header: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  moodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  moodCard: {
    width: '50%',
    padding: 8,
    position: 'relative',
  },
  selectedCard: {
    transform: [{ scale: 0.98 }],
  },
  iconContainer: {
    width: '100%',
    aspectRatio: 1.2,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  selectedIconContainer: {
    backgroundColor: '#6366F1 !important',
  },
  moodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
  },
  moodDescription: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  selectedText: {
    color: '#6366F1',
  },
  selectedDescription: {
    color: '#6366F1',
  },
  selectedIndicator: {
    position: 'absolute',
    bottom: 8,
    right: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  backButton: {
    flex: 1,
  },
  nextButton: {
    flex: 2,
  },
});