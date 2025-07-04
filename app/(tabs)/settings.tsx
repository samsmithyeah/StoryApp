import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '../../components/ui/IconSymbol';
import { Button } from '../../components/ui/Button';
import { ChildProfileCard } from '../../components/settings/ChildProfileCard';
import { ChildProfileForm } from '../../components/settings/ChildProfileForm';
import { useAuth } from '../../hooks/useAuth';
import { useChildren } from '../../hooks/useChildren';
import { Child } from '../../types/child.types';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const { 
    children, 
    loading, 
    error, 
    addChild, 
    updateChild, 
    deleteChild,
    clearError 
  } = useChildren();

  const [showForm, setShowForm] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);

  const handleAddChild = () => {
    setEditingChild(null);
    setShowForm(true);
  };

  const handleEditChild = (child: Child) => {
    setEditingChild(child);
    setShowForm(true);
  };

  const handleSaveChild = async (childData: Omit<Child, 'id'>) => {
    try {
      if (editingChild) {
        await updateChild(editingChild.id, childData);
      } else {
        await addChild(childData);
      }
      setShowForm(false);
      setEditingChild(null);
    } catch (error) {
      // Error handled in hook
      console.error('Save child error:', error);
    }
  };

  const handleDeleteChild = async (childId: string) => {
    try {
      await deleteChild(childId);
    } catch (error) {
      Alert.alert('Error', 'Failed to delete child profile');
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingChild(null);
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: signOut,
        },
      ]
    );
  };

  if (showForm) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.formHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleCancelForm}
          >
            <IconSymbol name="chevron.left" size={24} color="#6366F1" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.headerSpacer} />
        </View>
        
        <ChildProfileForm
          child={editingChild}
          onSave={handleSaveChild}
          onCancel={handleCancelForm}
          loading={loading}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Manage your family and app preferences</Text>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={clearError}>
              <IconSymbol name="xmark.circle" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Children's Profiles</Text>
            <Text style={styles.sectionDescription}>
              Add your children to create personalized stories
            </Text>
          </View>

          {children.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol name="figure.child.circle" size={64} color="#D1D5DB" />
              <Text style={styles.emptyStateTitle}>No children added yet</Text>
              <Text style={styles.emptyStateText}>
                Add your first child to start creating magical personalized stories
              </Text>
            </View>
          ) : (
            <View style={styles.childrenList}>
              {children.map((child) => (
                <ChildProfileCard
                  key={child.id}
                  child={child}
                  onEdit={handleEditChild}
                  onDelete={handleDeleteChild}
                />
              ))}
            </View>
          )}

          <Button
            title="Add New Child"
            onPress={handleAddChild}
            leftIcon="plus"
            variant="secondary"
            style={styles.addButton}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <View style={styles.accountInfo}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>
                {user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {user?.displayName || 'User'}
              </Text>
              <Text style={styles.userEmail}>
                {user?.email}
              </Text>
            </View>
          </View>

          <Button
            title="Sign Out"
            onPress={handleSignOut}
            variant="outline"
            style={styles.signOutButton}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            DreamWeaver v1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 24,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#EF4444',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  childrenList: {
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#6366F1',
    borderStyle: 'dashed',
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  signOutButton: {
    borderColor: '#EF4444',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});