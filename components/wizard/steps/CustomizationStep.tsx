import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
} from 'react-native';
import { Button } from '@/components/ui/Button';
import { IconSymbol } from '@/components/ui/IconSymbol';

interface Length {
  id: 'short' | 'medium' | 'long';
  name: string;
  description: string;
  pages: string;
}

interface IllustrationStyle {
  id: string;
  name: string;
  description: string;
}

const LENGTHS: Length[] = [
  {
    id: 'short',
    name: 'Short',
    description: 'Quick bedtime story',
    pages: '3-4 pages',
  },
  {
    id: 'medium',
    name: 'Medium',
    description: 'Perfect for most nights',
    pages: '5-6 pages',
  },
  {
    id: 'long',
    name: 'Long',
    description: 'Extended adventure',
    pages: '7-8 pages',
  },
];

const ILLUSTRATION_STYLES: IllustrationStyle[] = [
  {
    id: 'watercolor',
    name: 'Watercolor',
    description: 'Soft, dreamy paintings',
  },
  {
    id: 'cartoon',
    name: 'Cartoon',
    description: 'Playful, colorful drawings',
  },
  {
    id: 'realistic',
    name: 'Realistic',
    description: 'Detailed, lifelike art',
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    description: 'Simple, clean designs',
  },
];

interface CustomizationStepProps {
  length: 'short' | 'medium' | 'long';
  illustrationStyle: string;
  enableIllustrations?: boolean;
  onUpdate: (data: { 
    length?: 'short' | 'medium' | 'long'; 
    illustrationStyle?: string;
    enableIllustrations?: boolean;
  }) => void;
  onNext: () => void;
  onBack: () => void;
}

export const CustomizationStep: React.FC<CustomizationStepProps> = ({
  length,
  illustrationStyle,
  enableIllustrations = true,
  onUpdate,
  onNext,
  onBack,
}) => {
  const [customStyle, setCustomStyle] = useState('');
  const handleLengthSelect = (selectedLength: 'short' | 'medium' | 'long') => {
    onUpdate({ length: selectedLength });
  };

  const handleStyleSelect = (selectedStyle: string) => {
    onUpdate({ illustrationStyle: selectedStyle });
    setCustomStyle(''); // Clear custom style when selecting predefined
  };

  const handleIllustrationsToggle = (value: boolean) => {
    onUpdate({ enableIllustrations: value });
  };

  const handleCustomStyleSubmit = () => {
    if (customStyle.trim()) {
      onUpdate({ illustrationStyle: customStyle.trim() });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Customize your story</Text>
        <Text style={styles.subtitle}>
          Choose the perfect length and illustration style
        </Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Story Length</Text>
          <View style={styles.lengthGrid}>
            {LENGTHS.map((lengthOption) => {
              const isSelected = lengthOption.id === length;
              
              return (
                <TouchableOpacity
                  key={lengthOption.id}
                  style={[styles.lengthCard, isSelected && styles.selectedCard]}
                  onPress={() => handleLengthSelect(lengthOption.id)}
                >
                  <Text style={[styles.lengthName, isSelected && styles.selectedText]}>
                    {lengthOption.name}
                  </Text>
                  <Text style={[styles.lengthDescription, isSelected && styles.selectedDescription]}>
                    {lengthOption.description}
                  </Text>
                  <Text style={[styles.lengthPages, isSelected && styles.selectedText]}>
                    {lengthOption.pages}
                  </Text>
                  {isSelected && (
                    <View style={styles.selectedIndicator}>
                      <IconSymbol name="checkmark" size={16} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.toggleSection}>
            <View style={styles.toggleInfo}>
              <Text style={styles.sectionTitle}>Illustrations</Text>
              <Text style={styles.toggleDescription}>
                Add beautiful AI-generated illustrations to your story
              </Text>
            </View>
            <Switch
              value={enableIllustrations}
              onValueChange={handleIllustrationsToggle}
              trackColor={{ false: '#E5E7EB', true: '#C7D2FE' }}
              thumbColor={enableIllustrations ? '#6366F1' : '#9CA3AF'}
            />
          </View>

          {enableIllustrations && (
            <>
              <Text style={styles.subSectionTitle}>Choose a Style</Text>
              <View style={styles.stylesGrid}>
                {ILLUSTRATION_STYLES.map((style) => {
                  const isSelected = style.id === illustrationStyle && !customStyle;
                  
                  return (
                    <TouchableOpacity
                      key={style.id}
                      style={[styles.styleCard, isSelected && styles.selectedCard]}
                      onPress={() => handleStyleSelect(style.id)}
                    >
                      <Text style={[styles.styleName, isSelected && styles.selectedText]}>
                        {style.name}
                      </Text>
                      <Text style={[styles.styleDescription, isSelected && styles.selectedDescription]}>
                        {style.description}
                      </Text>
                      {isSelected && (
                        <View style={styles.selectedIndicator}>
                          <IconSymbol name="checkmark" size={16} color="#FFFFFF" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.customStyleSection}>
                <Text style={styles.customStyleLabel}>Or describe your own style</Text>
                <View style={styles.customStyleInput}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g., vintage comic book style, hand-drawn sketches..."
                    value={customStyle}
                    onChangeText={setCustomStyle}
                    onSubmitEditing={handleCustomStyleSubmit}
                    returnKeyType="done"
                    multiline
                  />
                  {customStyle.trim() && (
                    <TouchableOpacity 
                      style={styles.customStyleButton}
                      onPress={handleCustomStyleSubmit}
                    >
                      <IconSymbol name="checkmark" size={16} color="#6366F1" />
                    </TouchableOpacity>
                  )}
                </View>
                {customStyle && illustrationStyle === customStyle.trim() && (
                  <View style={styles.customStyleSelected}>
                    <IconSymbol name="checkmark.circle.fill" size={16} color="#10B981" />
                    <Text style={styles.customStyleSelectedText}>Custom style applied</Text>
                  </View>
                )}
              </View>
            </>
          )}
        </View>

        <View style={styles.infoSection}>
          <IconSymbol name="info.circle" size={20} color="#6366F1" />
          <Text style={styles.infoText}>
            {enableIllustrations 
              ? "Images are generated in the background so you can start reading immediately"
              : "Text-only stories generate faster and are perfect for quick bedtime reading"
            }
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
          onPress={onNext}
          size="large"
          leftIcon="sparkles"
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  lengthGrid: {
    gap: 12,
  },
  lengthCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  selectedCard: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  lengthName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  lengthDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  lengthPages: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  stylesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  styleCard: {
    width: '50%',
    padding: 6,
  },
  styleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  styleDescription: {
    fontSize: 13,
    color: '#6B7280',
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
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#0369A1',
    lineHeight: 20,
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
  toggleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingVertical: 8,
  },
  toggleInfo: {
    flex: 1,
  },
  toggleDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
    marginTop: 8,
  },
  customStyleSection: {
    marginTop: 20,
  },
  customStyleLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  customStyleInput: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 44,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    paddingVertical: 4,
    maxHeight: 80,
  },
  customStyleButton: {
    marginLeft: 8,
    padding: 4,
  },
  customStyleSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  customStyleSelectedText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
});