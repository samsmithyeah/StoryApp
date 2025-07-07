import { IconSymbol } from '@/components/ui/IconSymbol';
import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

interface Theme {
  id: string;
  name: string;
  icon: string;
  description: string;
}

interface ThemeCardProps {
  theme: Theme;
  isSelected: boolean;
  onSelect: (themeId: string) => void;
}

export const ThemeCard: React.FC<ThemeCardProps> = ({
  theme,
  isSelected,
  onSelect,
}) => {
  return (
    <TouchableOpacity
      style={[
        isTablet ? styles.themeListCardTablet : styles.themeListCard,
        isSelected && styles.selectedListCard,
      ]}
      onPress={() => onSelect(theme.id)}
    >
      <View
        style={[
          styles.iconContainer,
          isSelected ? styles.selectedIconContainer : styles.unselectedIconContainer,
        ]}
      >
        <IconSymbol
          name={theme.icon as any}
          size={24}
          color="#1a1b3a"
        />
      </View>
      <View style={styles.themeInfo}>
        <Text style={[styles.themeName, isSelected && styles.selectedText]}>
          {theme.name}
        </Text>
        <Text
          style={[
            styles.themeDescription,
            isSelected && styles.selectedDescription,
          ]}
        >
          {theme.description}
        </Text>
      </View>
      {isSelected && (
        <View style={styles.checkmark}>
          <Text style={styles.checkmarkText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  themeListCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeListCardTablet: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    width: '48%',
    marginHorizontal: 6,
  },
  selectedListCard: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    borderColor: '#D4AF37',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#D4AF37',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  selectedIconContainer: {
    backgroundColor: '#D4AF37',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  unselectedIconContainer: {
    opacity: 0.6,
  },
  themeInfo: {
    flex: 1,
  },
  themeName: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  themeDescription: {
    fontSize: isTablet ? 14 : 12,
    color: '#9CA3AF',
    lineHeight: 16,
  },
  selectedText: {
    color: '#D4AF37',
  },
  selectedDescription: {
    color: '#D4AF37',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});