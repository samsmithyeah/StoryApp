import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Colors } from '@/constants/Theme';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

interface WizardStepHeaderProps {
  title: string;
  subtitle: string;
  stepNumber: number;
  totalSteps: number;
  onBack: () => void;
  onCancel?: () => void;
}

export const WizardStepHeader: React.FC<WizardStepHeaderProps> = ({
  title,
  subtitle,
  stepNumber,
  totalSteps,
  onBack,
  onCancel,
}) => {
  return (
    <>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.brand}>DreamWeaver</Text>
          <Text style={styles.stepIndicator}>Step {stepNumber} of {totalSteps}</Text>
        </View>

        {onCancel && (
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Title */}
      <View style={styles.titleSection}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    position: 'relative',
    paddingHorizontal: 24,
    paddingTop: isTablet ? 60 : 10,
    paddingBottom: 8,
  },
  backButton: {
    position: 'absolute',
    top: isTablet ? 10 : -10,
    left: 24,
    padding: 8,
  },
  backText: {
    color: Colors.primary,
    fontSize: isTablet ? 32 : 24,
    fontWeight: '400',
  },
  cancelButton: {
    position: 'absolute',
    top: isTablet ? 10 : -10,
    right: 24,
    padding: 8,
  },
  cancelText: {
    color: Colors.primary,
    fontSize: isTablet ? 32 : 24,
    fontWeight: '400',
  },
  headerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    fontSize: isTablet ? 48 : 32,
    fontWeight: '600',
    color: Colors.primary,
    fontFamily: 'PlayfairDisplay-Regular',
  },
  stepIndicator: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  titleSection: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: isTablet ? 32 : 24,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 4,
    textAlign: 'center',
    fontFamily: 'PlayfairDisplay-Regular',
  },
  subtitle: {
    fontSize: isTablet ? 20 : 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});