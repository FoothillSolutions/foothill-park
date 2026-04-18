import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../constants/theme';
import { PlateInput } from '../components/PlateInput';
import { api } from '../services/api';
import { isValidPlate, normalizePlate } from '../utils/plateParser';
import { useAuth } from '../contexts/AuthContext';

export default function OnboardingScreen() {
  const [plate, setPlate] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setHasPlate } = useAuth();

  async function handleSubmit() {
    if (!isValidPlate(plate)) {
      setError('Please enter a valid licence plate.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.registerPlate(normalizePlate(plate));
      setHasPlate(true);
      router.replace('/(auth)/scan');
    } catch (err: any) {
      setError(err.message ?? 'Failed to register plate. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.iconBadge}>
            <Text style={styles.iconText}>🚗</Text>
          </View>
          <Text style={styles.title}>Register Your Plate</Text>
          <Text style={styles.subtitle}>
            Before you can look up other vehicles, you need to register your own licence plate.
            This is required so others can reach you too.
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Your Licence Plate</Text>
          <PlateInput value={plate} onChange={setPlate} error={error} />

          <TouchableOpacity
            style={[styles.button, (!isValidPlate(plate) || loading) && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={!isValidPlate(plate) || loading}
          >
            {loading ? (
              <ActivityIndicator color={theme.colors.white} />
            ) : (
              <Text style={styles.buttonText}>Register & Continue</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.note}>
          You can update your plate at any time from your profile.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.white },
  container: {
    flexGrow: 1,
    padding: 32,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconBadge: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  iconText: { fontSize: 36 },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: theme.colors.dark,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  form: { gap: 12 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.dark,
    marginBottom: 4,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    marginTop: 8,
    height: 54,
    justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  note: {
    marginTop: 32,
    fontSize: 13,
    color: theme.colors.dark,
    opacity: 0.4,
    textAlign: 'center',
  },
});
