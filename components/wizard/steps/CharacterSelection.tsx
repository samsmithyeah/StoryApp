import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Button } from '@/components/ui/Button';
import { IconSymbol } from '@/components/ui/IconSymbol';

interface CharacterSelectionProps {
  selectedCharacters: string[];
  onSelect: (characters: string[]) => void;
  onNext: () => void;
  onBack: () => void;
}

const SUGGESTED_CHARACTERS = [
  'Friendly Dragon',
  'Wise Owl',
  'Brave Knight',
  'Magic Unicorn',
  'Talking Robot',
  'Silly Monster',
  'Flying Fairy',
  'Pirate Captain',
  'Space Explorer',
  'Dinosaur Friend',
  'Mermaid Princess',
  'Superhero Cat',
];

export const CharacterSelection: React.FC<CharacterSelectionProps> = ({
  selectedCharacters,
  onSelect,
  onNext,
  onBack,
}) => {
  const [customCharacter, setCustomCharacter] = useState('');

  const toggleCharacter = (character: string) => {
    if (selectedCharacters.includes(character)) {
      onSelect(selectedCharacters.filter((c) => c !== character));
    } else {
      onSelect([...selectedCharacters, character]);
    }
  };

  const addCustomCharacter = () => {
    if (customCharacter.trim() && !selectedCharacters.includes(customCharacter.trim())) {
      onSelect([...selectedCharacters, customCharacter.trim()]);
      setCustomCharacter('');
    }
  };

  const isNextDisabled = selectedCharacters.length === 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Pick your characters</Text>
        <Text style={styles.subtitle}>
          Choose friends for your adventure (select 1-3 characters)
        </Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.suggestedSection}>
          <Text style={styles.sectionTitle}>Suggested Characters</Text>
          <View style={styles.charactersGrid}>
            {SUGGESTED_CHARACTERS.map((character) => {
              const isSelected = selectedCharacters.includes(character);
              
              return (
                <TouchableOpacity
                  key={character}
                  style={[styles.characterChip, isSelected && styles.selectedChip]}
                  onPress={() => toggleCharacter(character)}
                >
                  <Text style={[styles.characterText, isSelected && styles.selectedText]}>
                    {character}
                  </Text>
                  {isSelected && (
                    <IconSymbol name="checkmark" size={16} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.customSection}>
          <Text style={styles.sectionTitle}>Add Your Own</Text>
          <View style={styles.customInputContainer}>
            <TextInput
              style={styles.customInput}
              placeholder="Type a character name..."
              value={customCharacter}
              onChangeText={setCustomCharacter}
              onSubmitEditing={addCustomCharacter}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={styles.addButton}
              onPress={addCustomCharacter}
              disabled={!customCharacter.trim()}
            >
              <IconSymbol name="plus" size={20} color="#6366F1" />
            </TouchableOpacity>
          </View>
        </View>

        {selectedCharacters.length > 0 && (
          <View style={styles.selectedSection}>
            <Text style={styles.sectionTitle}>Your Characters ({selectedCharacters.length})</Text>
            <View style={styles.selectedList}>
              {selectedCharacters.map((character) => (
                <View key={character} style={styles.selectedItem}>
                  <Text style={styles.selectedItemText}>{character}</Text>
                  <TouchableOpacity
                    onPress={() => toggleCharacter(character)}
                    style={styles.removeButton}
                  >
                    <IconSymbol name="xmark.circle.fill" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}
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
  suggestedSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  charactersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  characterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    margin: 4,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 6,
  },
  selectedChip: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  characterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  selectedText: {
    color: '#FFFFFF',
  },
  customSection: {
    marginBottom: 32,
  },
  customInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  customInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  selectedSection: {
    marginBottom: 32,
  },
  selectedList: {
    gap: 8,
  },
  selectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  selectedItemText: {
    fontSize: 14,
    color: '#111827',
  },
  removeButton: {
    padding: 4,
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