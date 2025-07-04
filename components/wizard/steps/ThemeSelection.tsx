import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Button } from '@/components/ui/Button';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useChildren } from '@/hooks/useChildren';
import { generateThemeSuggestions, ThemeSuggestion } from '@/services/firebase/stories';

interface Theme {
  id: string;
  name: string;
  icon: string;
  description: string;
}

const THEMES: Theme[] = [
  {
    id: 'adventure',
    name: 'Adventure',
    icon: 'airplane',
    description: 'Exciting journeys and discoveries',
  },
  {
    id: 'magical',
    name: 'Magical',
    icon: 'sparkles',
    description: 'Wizards, fairies, and enchantment',
  },
  {
    id: 'animals',
    name: 'Animals',
    icon: 'pawprint',
    description: 'Friendly creatures and nature',
  },
  {
    id: 'space',
    name: 'Space',
    icon: 'moon.stars',
    description: 'Planets, stars, and astronauts',
  },
  {
    id: 'underwater',
    name: 'Underwater',
    icon: 'drop.fill',
    description: 'Ocean adventures and sea life',
  },
  {
    id: 'friendship',
    name: 'Friendship',
    icon: 'heart.fill',
    description: 'Making friends and kindness',
  },
  {
    id: 'bedtime',
    name: 'Bedtime',
    icon: 'moon.fill',
    description: 'Cozy, sleepy-time stories',
  },
  {
    id: 'superhero',
    name: 'Superhero',
    icon: 'bolt.fill',
    description: 'Heroes with special powers',
  },
];

interface ThemeSelectionProps {
  selectedTheme?: string;
  selectedChildren: string[];
  onSelect: (theme: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const ThemeSelection: React.FC<ThemeSelectionProps> = ({
  selectedTheme,
  selectedChildren,
  onSelect,
  onNext,
  onBack,
}) => {
  const { children } = useChildren();
  const [customTheme, setCustomTheme] = useState('');
  const [aiThemes, setAiThemes] = useState<ThemeSuggestion[]>([]);
  const [loadingAiThemes, setLoadingAiThemes] = useState(false);
  const [aiThemesError, setAiThemesError] = useState<string | null>(null);

  const handleThemeSelect = (themeId: string) => {
    onSelect(themeId);
    setCustomTheme('');
  };

  const handleCustomTheme = () => {
    if (customTheme.trim()) {
      onSelect(customTheme.trim());
    }
  };

  const selectedChildProfiles = children.filter(child => selectedChildren.includes(child.id));
  const hasPreferences = selectedChildProfiles.some(child => child.childPreferences.trim());

  // Generate AI themes when children with preferences are selected
  useEffect(() => {
    const generateAiThemes = async () => {
      if (!hasPreferences || aiThemes.length > 0 || loadingAiThemes) {
        return;
      }

      setLoadingAiThemes(true);
      setAiThemesError(null);

      try {
        const preferences = selectedChildProfiles
          .map(child => child.childPreferences.trim())
          .filter(pref => pref.length > 0);

        console.log('Generating AI themes for preferences:', preferences);

        if (preferences.length > 0) {
          const suggestions = await generateThemeSuggestions(preferences);
          setAiThemes(suggestions);
          console.log('AI themes generated successfully:', suggestions);
        }
      } catch (error) {
        console.error('Error generating AI themes:', error);
        setAiThemesError('Failed to generate personalized themes. Please try again.');
      } finally {
        setLoadingAiThemes(false);
      }
    };

    generateAiThemes();
  }, [selectedChildren, hasPreferences]);

  const isNextDisabled = !selectedTheme;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Choose your adventure</Text>
        <Text style={styles.subtitle}>
          What kind of story shall we create tonight?
        </Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {hasPreferences && (
          <View style={styles.suggestedSection}>
            <Text style={styles.sectionTitle}>AI Suggested Themes</Text>
            <Text style={styles.sectionSubtitle}>
              Based on {selectedChildProfiles.map(c => c.childName).join(' and ')}'s interests
            </Text>
            <View style={styles.preferencesInfo}>
              {selectedChildProfiles.map(child => (
                child.childPreferences.trim() && (
                  <Text key={child.id} style={styles.preferencesText}>
                    {child.childName} loves: {child.childPreferences}
                  </Text>
                )
              ))}
            </View>
            
            {loadingAiThemes && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#6366F1" />
                <Text style={styles.loadingText}>Creating personalized themes...</Text>
              </View>
            )}
            
            {aiThemesError && (
              <View style={styles.errorContainer}>
                <IconSymbol name="exclamationmark.triangle" size={16} color="#EF4444" />
                <Text style={styles.errorText}>{aiThemesError}</Text>
              </View>
            )}
            
            {aiThemes.length > 0 && (
              <View style={styles.aiThemesGrid}>
                {aiThemes.map((theme) => {
                  const isSelected = theme.id === selectedTheme;
                  
                  return (
                    <TouchableOpacity
                      key={theme.id}
                      style={[styles.aiThemeCard, isSelected && styles.selectedCard]}
                      onPress={() => handleThemeSelect(theme.id)}
                    >
                      <View style={[styles.aiIconContainer, isSelected && styles.selectedIconContainer]}>
                        <IconSymbol
                          name={theme.icon}
                          size={24}
                          color={isSelected ? '#FFFFFF' : '#10B981'}
                        />
                      </View>
                      <Text style={[styles.aiThemeName, isSelected && styles.selectedText]}>
                        {theme.name}
                      </Text>
                      <Text style={[styles.aiThemeDescription, isSelected && styles.selectedDescription]}>
                        {theme.description}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

        <View style={styles.themesSection}>
          <Text style={styles.sectionTitle}>Popular Themes</Text>
          <View style={styles.themesGrid}>
            {THEMES.map((theme) => {
              const isSelected = theme.id === selectedTheme;
              
              return (
                <TouchableOpacity
                  key={theme.id}
                  style={[styles.themeCard, isSelected && styles.selectedCard]}
                  onPress={() => handleThemeSelect(theme.id)}
                >
                  <View style={[styles.iconContainer, isSelected && styles.selectedIconContainer]}>
                    <IconSymbol
                      name={theme.icon}
                      size={32}
                      color={isSelected ? '#FFFFFF' : '#6366F1'}
                    />
                  </View>
                  <Text style={[styles.themeName, isSelected && styles.selectedText]}>
                    {theme.name}
                  </Text>
                  <Text style={[styles.themeDescription, isSelected && styles.selectedDescription]}>
                    {theme.description}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.customSection}>
          <Text style={styles.sectionTitle}>Custom Theme</Text>
          <View style={styles.customInputContainer}>
            <TextInput
              style={styles.customInput}
              placeholder="Describe your own theme..."
              value={customTheme}
              onChangeText={setCustomTheme}
              onSubmitEditing={handleCustomTheme}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleCustomTheme}
              disabled={!customTheme.trim()}
            >
              <IconSymbol name="plus" size={20} color="#6366F1" />
            </TouchableOpacity>
          </View>
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
  themesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  themeCard: {
    width: '50%',
    padding: 8,
  },
  selectedCard: {
    transform: [{ scale: 0.98 }],
  },
  iconContainer: {
    width: '100%',
    aspectRatio: 1.5,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedIconContainer: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  themeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
  },
  themeDescription: {
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
  suggestedSection: {
    marginBottom: 32,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
  },
  themesSection: {
    marginBottom: 32,
  },
  customSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  preferencesInfo: {
    gap: 4,
  },
  preferencesText: {
    fontSize: 14,
    color: '#059669',
    fontStyle: 'italic',
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
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#6366F1',
    fontStyle: 'italic',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
  },
  aiThemesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginTop: 16,
  },
  aiThemeCard: {
    width: '50%',
    padding: 6,
  },
  aiIconContainer: {
    width: '100%',
    aspectRatio: 1.8,
    borderRadius: 12,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  selectedIconContainer: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  aiThemeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 2,
  },
  aiThemeDescription: {
    fontSize: 12,
    color: '#059669',
    textAlign: 'center',
    lineHeight: 16,
  },
});