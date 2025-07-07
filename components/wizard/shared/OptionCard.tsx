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

interface OptionCardProps {
  title: string;
  description: string;
  subtitle?: string;
  isSelected: boolean;
  onPress: () => void;
  style?: any;
}

export const OptionCard: React.FC<OptionCardProps> = ({
  title,
  description,
  subtitle,
  isSelected,
  onPress,
  style,
}) => {
  return (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.selectedCard, style]}
      onPress={onPress}
    >
      <Text style={[styles.title, isSelected && styles.selectedText]}>
        {title}
      </Text>
      <Text style={[styles.description, isSelected && styles.selectedDescription]}>
        {description}
      </Text>
      {subtitle && (
        <Text style={[styles.subtitle, isSelected && styles.selectedText]}>
          {subtitle}
        </Text>
      )}
      {isSelected && (
        <View style={styles.selectedIndicator}>
          <IconSymbol name="checkmark" size={16} color="#FFFFFF" />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  selectedCard: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    borderColor: '#D4AF37',
  },
  title: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  description: {
    fontSize: isTablet ? 16 : 14,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: isTablet ? 14 : 12,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  selectedText: {
    color: '#D4AF37',
  },
  selectedDescription: {
    color: '#D4AF37',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
});