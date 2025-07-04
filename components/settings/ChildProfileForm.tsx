import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { DatePicker } from '../ui/DatePicker';
import { Child } from '../../types/child.types';

interface ChildProfileFormProps {
  child?: Child;
  onSave: (child: Omit<Child, 'id'>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const ChildProfileForm: React.FC<ChildProfileFormProps> = ({
  child,
  onSave,
  onCancel,
  loading = false,
}) => {
  const [childName, setChildName] = useState(child?.childName || '');
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(child?.dateOfBirth);
  const [childPreferences, setChildPreferences] = useState(child?.childPreferences || '');

  const isEditing = !!child;

  useEffect(() => {
    if (child) {
      setChildName(child.childName);
      setDateOfBirth(child.dateOfBirth);
      setChildPreferences(child.childPreferences);
    }
  }, [child]);

  const validateForm = () => {
    if (!childName.trim()) {
      Alert.alert('Error', 'Please enter the child\'s name');
      return false;
    }

    if (!dateOfBirth) {
      Alert.alert('Error', 'Please select the child\'s date of birth');
      return false;
    }

    const today = new Date();
    const age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();
    const dayDiff = today.getDate() - dateOfBirth.getDate();
    
    // Check if birthday hasn't occurred this year
    const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
    
    if (actualAge < 0 || actualAge > 18) {
      Alert.alert('Error', 'Child must be between 0 and 18 years old');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const childData = {
      childName: childName.trim(),
      dateOfBirth: dateOfBirth!,
      childPreferences: childPreferences.trim(),
    };

    try {
      await onSave(childData);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to save child profile'
      );
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>
            {isEditing ? 'Edit Profile' : 'Add New Child'}
          </Text>
          <Text style={styles.subtitle}>
            {isEditing 
              ? 'Update your child\'s information'
              : 'Tell us about your little one to create personalized stories'
            }
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Child's Name"
            placeholder="Enter your child's name"
            value={childName}
            onChangeText={setChildName}
            leftIcon="person.fill"
            autoCapitalize="words"
          />

          <DatePicker
            label="Date of Birth"
            placeholder="Select your child's date of birth"
            value={dateOfBirth}
            onChange={setDateOfBirth}
            leftIcon="calendar"
            maximumDate={new Date()}
            minimumDate={new Date(new Date().getFullYear() - 18, 0, 1)}
          />

          <View style={styles.preferencesContainer}>
            <Input
              label="Interests & Preferences"
              placeholder="What does your child love? (e.g., dinosaurs, princesses, space, animals)"
              value={childPreferences}
              onChangeText={setChildPreferences}
              leftIcon="heart.fill"
              style={styles.preferencesInput}
            />
            <Text style={styles.preferencesHint}>
              This helps us create more personalized and engaging stories that your child will love!
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            title="Cancel"
            onPress={onCancel}
            variant="outline"
            style={styles.cancelButton}
          />
          
          <Button
            title={isEditing ? 'Update Profile' : 'Add Child'}
            onPress={handleSave}
            loading={loading}
            style={styles.saveButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEFEFE',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
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
  form: {
    flex: 1,
    marginBottom: 32,
  },
  preferencesContainer: {
    marginBottom: 16,
  },
  preferencesInput: {
    marginBottom: 8,
  },
  preferencesHint: {
    fontSize: 12,
    color: '#9CA3AF',
    lineHeight: 16,
    marginLeft: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 2,
  },
});