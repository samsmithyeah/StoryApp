import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';

interface EmailAuthFormProps {
  mode: 'signin' | 'signup';
  onToggleMode: () => void;
}

export const EmailAuthForm: React.FC<EmailAuthFormProps> = ({
  mode,
  onToggleMode,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const { emailSignIn, emailSignUp, loading, error } = useAuth();

  const validateForm = () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return false;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return false;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return false;
    }

    if (mode === 'signup') {
      if (!displayName.trim()) {
        Alert.alert('Error', 'Please enter your name');
        return false;
      }

      if (password !== confirmPassword) {
        Alert.alert('Error', 'Passwords do not match');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (mode === 'signin') {
        await emailSignIn({ email, password });
      } else {
        await emailSignUp({ email, password, displayName });
      }
    } catch (err) {
      // Error is already handled in useAuth hook
      console.error('Auth error:', err);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {mode === 'signin' ? 'Welcome back' : 'Create account'}
      </Text>
      
      <Text style={styles.subtitle}>
        {mode === 'signin' 
          ? 'Sign in to continue to DreamWeaver' 
          : 'Join DreamWeaver to start creating magical stories'
        }
      </Text>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <View style={styles.form}>
        {mode === 'signup' && (
          <Input
            label="Full Name"
            placeholder="Enter your full name"
            value={displayName}
            onChangeText={setDisplayName}
            leftIcon="person.fill"
            autoCapitalize="words"
          />
        )}

        <Input
          label="Email"
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          leftIcon="envelope.fill"
        />

        <Input
          label="Password"
          placeholder={mode === 'signin' ? 'Enter your password' : 'Create a password'}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          leftIcon="lock.fill"
        />

        {mode === 'signup' && (
          <Input
            label="Confirm Password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            leftIcon="lock.fill"
          />
        )}

        <Button
          title={mode === 'signin' ? 'Sign In' : 'Create Account'}
          onPress={handleSubmit}
          loading={loading}
          style={styles.submitButton}
        />

        <View style={styles.toggleContainer}>
          <Text style={styles.toggleText}>
            {mode === 'signin' 
              ? "Don't have an account? " 
              : "Already have an account? "
            }
          </Text>
          <Button
            title={mode === 'signin' ? 'Sign Up' : 'Sign In'}
            onPress={onToggleMode}
            variant="outline"
            size="small"
            style={styles.toggleButton}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  form: {
    width: '100%',
  },
  submitButton: {
    marginTop: 8,
    marginBottom: 24,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  toggleText: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 8,
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    minHeight: 32,
  },
});