import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useChildren } from '@/hooks/useChildren';
import { Button } from '@/components/ui/Button';
import { Child } from '@/types/child.types';

interface ChildSelectionProps {
  selectedChildren: string[];
  childrenAsCharacters: boolean;
  onUpdate: (data: { selectedChildren?: string[]; childrenAsCharacters?: boolean }) => void;
  onNext: () => void;
}

export const ChildSelection: React.FC<ChildSelectionProps> = ({
  selectedChildren,
  childrenAsCharacters,
  onUpdate,
  onNext,
}) => {
  const { children } = useChildren();

  const calculateAge = (dateOfBirth: Date) => {
    const today = new Date();
    const age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();
    const dayDiff = today.getDate() - dateOfBirth.getDate();
    return monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
  };

  const handleChildSelect = (child: Child) => {
    if (selectedChildren.includes(child.id)) {
      onUpdate({ selectedChildren: selectedChildren.filter(id => id !== child.id) });
    } else {
      onUpdate({ selectedChildren: [...selectedChildren, child.id] });
    }
  };

  const isNextDisabled = selectedChildren.length === 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Who's this story for?</Text>
        <Text style={styles.subtitle}>
          Select one or more children for this story
        </Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.childrenGrid}>
          {children.map((child) => {
            const isSelected = selectedChildren.includes(child.id);
            const age = calculateAge(child.dateOfBirth);
            
            return (
              <TouchableOpacity
                key={child.id}
                style={[styles.childCard, isSelected && styles.selectedCard]}
                onPress={() => handleChildSelect(child)}
              >
                <View style={[styles.avatar, isSelected && styles.selectedAvatar]}>
                  <Text style={[styles.avatarText, isSelected && styles.selectedAvatarText]}>
                    {child.childName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={[styles.childName, isSelected && styles.selectedText]}>
                  {child.childName}
                </Text>
                <Text style={[styles.childAge, isSelected && styles.selectedText]}>
                  {age} years old
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {selectedChildren.length > 0 && (
          <View style={styles.characterOption}>
            <View style={styles.switchContainer}>
              <View style={styles.switchText}>
                <Text style={styles.switchTitle}>Feature as main characters</Text>
                <Text style={styles.switchSubtitle}>
                  Include selected children as story characters
                </Text>
              </View>
              <Switch
                value={childrenAsCharacters}
                onValueChange={(value) => onUpdate({ childrenAsCharacters: value })}
                trackColor={{ false: '#D1D5DB', true: '#6366F1' }}
                thumbColor={childrenAsCharacters ? '#FFFFFF' : '#F3F4F6'}
              />
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Next"
          onPress={onNext}
          disabled={isNextDisabled}
          size="large"
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
  childrenGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  childCard: {
    width: '50%',
    padding: 8,
  },
  selectedCard: {
    transform: [{ scale: 0.98 }],
  },
  avatar: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  selectedAvatar: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  avatarText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  selectedAvatarText: {
    color: '#FFFFFF',
  },
  childName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
  },
  childAge: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  selectedText: {
    color: '#6366F1',
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  characterOption: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    marginHorizontal: 8,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchText: {
    flex: 1,
    marginRight: 16,
  },
  switchTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  switchSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});