import { useState } from 'react';
import {
  View, Text, TextInput, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView, Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '../services/api';
import { isValidPlate, normalizePlate } from '../utils/plateParser';
import { useAuth } from '../contexts/AuthContext';
import { PlateDisplay } from '../components/PlateDisplay';
import { theme } from '../constants/theme';

export default function OnboardingScreen() {
  const [plate, setPlate] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setHasPlate } = useAuth();

  function handleChange(text: string) {
    const cleaned = text.replace(/[^A-Za-z0-9\s\-]/g, '').toUpperCase();
    setPlate(cleaned);
    if (error) setError('');
  }

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

  const isValid = isValidPlate(plate);
  const monoFamily = Platform.select({ ios: 'Courier New', android: 'monospace' });

  const borderColor = error ? theme.colors.error : isValid ? theme.colors.primary : theme.colors.border;
  const wrapperBg = error ? theme.colors.error : isValid ? theme.colors.primary : theme.colors.border;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.white }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        {/* ── Gradient header band ── */}
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingTop: 58,
            paddingBottom: 24,
            paddingHorizontal: 24,
          }}
        >
          {/* Progress pills */}
          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 16 }}>
            <View style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: theme.colors.white }} />
            <View style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)' }} />
          </View>

          {/* Eyebrow */}
          <Text style={{
            fontSize: 12,
            fontWeight: '700',
            letterSpacing: 1.2,
            color: 'rgba(255,255,255,0.85)',
            textTransform: 'uppercase',
            marginBottom: 8,
          }}>
            STEP 1 OF 2
          </Text>

          {/* Title */}
          <Text style={{
            fontSize: 26,
            fontWeight: '700',
            letterSpacing: -0.5,
            color: theme.colors.white,
            lineHeight: 30,
          }}>
            Register your plate
          </Text>

          {/* Subtitle */}
          <Text style={{
            fontSize: 15,
            color: 'rgba(255,255,255,0.7)',
            marginTop: 4,
          }}>
            Help teammates find you quickly when they need to reach you about parking.
          </Text>
        </LinearGradient>

        {/* ── Main content ── */}
        <View style={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: 40 }}>
          {/* Preview */}
          {isValid && (
            <View style={{ marginBottom: 32, alignItems: 'center' }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: theme.colors.textSecondary, marginBottom: 12 }}>
                PREVIEW
              </Text>
              <PlateDisplay plate={plate} />
            </View>
          )}

          {/* Input label */}
          <Text style={{
            fontSize: 13,
            fontWeight: '600',
            color: theme.colors.textSecondary,
            marginBottom: 8,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}>
            Licence plate
          </Text>

          {/* Input wrapper */}
          <View style={[
            {
              borderRadius: 14,
              padding: 2,
              backgroundColor: wrapperBg,
            },
          ]}>
            <View style={{
              backgroundColor: theme.colors.white,
              borderRadius: 12,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <TextInput
                value={plate}
                onChangeText={handleChange}
                placeholder="e.g. 7-0339-96"
                placeholderTextColor={theme.colors.textTertiary}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={12}
                style={{
                  flex: 1,
                  paddingVertical: 18,
                  paddingLeft: 18,
                  paddingRight: 54,
                  fontSize: 22,
                  fontWeight: '700',
                  color: theme.colors.textPrimary,
                  letterSpacing: 3,
                  fontFamily: monoFamily,
                }}
              />
              {isValid && (
                <View style={{
                  position: 'absolute',
                  right: 16,
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: theme.colors.success,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Ionicons name="checkmark" size={16} color={theme.colors.white} />
                </View>
              )}
            </View>
          </View>

          {/* Error or success text */}
          {error ? (
            <Text style={{ marginTop: 10, fontSize: 13, color: theme.colors.error }}>
              {error}
            </Text>
          ) : isValid ? (
            <Text style={{ marginTop: 10, fontSize: 13, color: theme.colors.success }}>
              Looks good — ready to register
            </Text>
          ) : null}

          {/* CTA */}
          <Pressable
            style={[
              {
                marginTop: 28,
                backgroundColor: isValid ? theme.colors.primary : theme.colors.border,
                borderRadius: 16,
                height: 54,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 8,
              },
              !isValid && { opacity: 0.5 },
            ]}
            onPress={handleSubmit}
            disabled={!isValid || loading}
          >
            {loading ? (
              <ActivityIndicator color={theme.colors.white} size="small" />
            ) : (
              <>
                <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.white }}>
                  Register &amp; continue
                </Text>
                <Ionicons name="arrow-forward" size={18} color={theme.colors.white} />
              </>
            )}
          </Pressable>

          <Text style={{
            fontSize: 12,
            color: theme.colors.textTertiary,
            textAlign: 'center',
            marginTop: 10,
          }}>
            You can change this any time in your profile
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
