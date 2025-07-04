import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Button } from '@/components/ui/Button';
import { StoryWizardData } from '@/types/story.types';
import { useChildren } from '@/hooks/useChildren';
import { IconSymbol } from '@/components/ui/IconSymbol';

interface ReviewStepProps {
  wizardData: StoryWizardData;
  onBack: () => void;
  onComplete: () => void;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({
  wizardData,
  onBack,
  onComplete,
}) => {
  const { children } = useChildren();
  const selectedChild = children.find(c => c.id === wizardData.childId);

  const formatValue = (value: string) => {
    return value.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ready to create magic?</Text>
        <Text style={styles.subtitle}>
          Let's review your story details
        </Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <IconSymbol name="sparkles" size={24} color="#6366F1" />
            <Text style={styles.summaryTitle}>Your Story Recipe</Text>
          </View>

          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>For</Text>
            <Text style={styles.summaryValue}>{selectedChild?.childName}</Text>
          </View>

          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Theme</Text>
            <Text style={styles.summaryValue}>{formatValue(wizardData.theme)}</Text>
          </View>

          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Characters</Text>
            <Text style={styles.summaryValue}>{wizardData.characters.join(', ')}</Text>
          </View>

          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Setting</Text>
            <Text style={styles.summaryValue}>{formatValue(wizardData.setting)}</Text>
          </View>

          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Mood</Text>
            <Text style={styles.summaryValue}>{formatValue(wizardData.mood)}</Text>
          </View>

          {wizardData.lesson && (
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Lesson</Text>
              <Text style={styles.summaryValue}>{wizardData.lesson}</Text>
            </View>
          )}
        </View>

        <View style={styles.magicSection}>
          <IconSymbol name="wand.and.stars" size={48} color="#6366F1" />
          <Text style={styles.magicText}>
            Get ready! We're about to create a personalized bedtime story just for {selectedChild?.childName}!
          </Text>
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
          title="Create Story"
          onPress={onComplete}
          size="large"
          leftIcon="sparkles"
          style={styles.createButton}
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
  summaryCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  summaryItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  magicSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  magicText: {
    fontSize: 16,
    color: '#6366F1',
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 16,
    fontWeight: '500',
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
  createButton: {
    flex: 2,
  },
});