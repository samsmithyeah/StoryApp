import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Button } from '@/components/ui/Button';

const SUGGESTED_LESSONS = [
  'Being kind to others',
  'Sharing is caring',
  'It\'s okay to be different',
  'Trying new things',
  'Being brave',
  'Helping friends',
  'Being patient',
  'The importance of family',
];

interface LessonInputProps {
  lesson?: string;
  onUpdate: (lesson: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const LessonInput: React.FC<LessonInputProps> = ({
  lesson = '',
  onUpdate,
  onNext,
  onBack,
}) => {
  const handleSuggestionSelect = (suggestion: string) => {
    onUpdate(suggestion);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Add a special lesson?</Text>
        <Text style={styles.subtitle}>
          Optional: Include a gentle moral or learning moment
        </Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.inputSection}>
          <Text style={styles.label}>Your lesson (optional)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="E.g., The importance of being honest..."
            value={lesson}
            onChangeText={onUpdate}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.suggestionsSection}>
          <Text style={styles.sectionTitle}>Popular lessons</Text>
          <View style={styles.suggestionsGrid}>
            {SUGGESTED_LESSONS.map((suggestion) => (
              <TouchableOpacity
                key={suggestion}
                style={styles.suggestionChip}
                onPress={() => handleSuggestionSelect(suggestion)}
              >
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.skipSection}>
          <Text style={styles.skipText}>
            Not every story needs a lesson! Feel free to skip this step for a pure adventure.
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
          title="Next"
          onPress={onNext}
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
  inputSection: {
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 100,
  },
  suggestionsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  suggestionChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    margin: 4,
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  skipSection: {
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  skipText: {
    fontSize: 14,
    color: '#065F46',
    lineHeight: 20,
    fontStyle: 'italic',
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