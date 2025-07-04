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

interface Setting {
  id: string;
  name: string;
  icon: string;
  description: string;
}

const SETTINGS: Setting[] = [
  {
    id: 'enchanted-forest',
    name: 'Enchanted Forest',
    icon: 'tree.fill',
    description: 'Magical woods with talking trees',
  },
  {
    id: 'cozy-bedroom',
    name: 'Cozy Bedroom',
    icon: 'bed.double.fill',
    description: 'A warm, safe place to dream',
  },
  {
    id: 'outer-space',
    name: 'Outer Space',
    icon: 'star.fill',
    description: 'Among the stars and planets',
  },
  {
    id: 'underwater-kingdom',
    name: 'Underwater Kingdom',
    icon: 'drop.fill',
    description: 'Beneath the waves',
  },
  {
    id: 'cloud-castle',
    name: 'Cloud Castle',
    icon: 'cloud.fill',
    description: 'High above in the sky',
  },
  {
    id: 'magical-garden',
    name: 'Magical Garden',
    icon: 'leaf.fill',
    description: 'Where flowers sing',
  },
];

interface SettingSelectionProps {
  selectedSetting?: string;
  onSelect: (setting: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const SettingSelection: React.FC<SettingSelectionProps> = ({
  selectedSetting,
  onSelect,
  onNext,
  onBack,
}) => {
  const handleSettingSelect = (settingId: string) => {
    onSelect(settingId);
  };

  const isNextDisabled = !selectedSetting;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Where does it happen?</Text>
        <Text style={styles.subtitle}>
          Choose the perfect setting for your story
        </Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.settingsGrid}>
          {SETTINGS.map((setting) => {
            const isSelected = setting.id === selectedSetting;
            
            return (
              <TouchableOpacity
                key={setting.id}
                style={[styles.settingCard, isSelected && styles.selectedCard]}
                onPress={() => handleSettingSelect(setting.id)}
              >
                <View style={[styles.iconContainer, isSelected && styles.selectedIconContainer]}>
                  <IconSymbol
                    name={setting.icon}
                    size={40}
                    color={isSelected ? '#FFFFFF' : '#6366F1'}
                  />
                </View>
                <Text style={[styles.settingName, isSelected && styles.selectedText]}>
                  {setting.name}
                </Text>
                <Text style={[styles.settingDescription, isSelected && styles.selectedDescription]}>
                  {setting.description}
                </Text>
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
  settingsGrid: {
    marginHorizontal: -8,
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 8,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCard: {
    backgroundColor: '#F3F4F6',
    borderColor: '#6366F1',
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  selectedIconContainer: {
    backgroundColor: '#6366F1',
  },
  settingName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
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
});