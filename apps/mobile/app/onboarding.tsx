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

  // Border color logic
  const borderColor = error ? '#D9534F' : isValid ? '#2D6DB5' : '#D6E4F5';
  const wrapperBg = error ? '#D9534F' : isValid ? '#2D6DB5' : '#D6E4F5';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#FFFFFF' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        {/* ── Gradient header band ── */}
        <LinearGradient
          colors={['#2D6DB5', '#5BA4E6']}
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
            <View style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: '#FFFFFF' }} />
            <View style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)' }} />
          </View>

          {/* Eyebrow */}
          <Text style={{
            fontSize: 12,
            fontWeight: '700',
            letterSpacing: 1.5,
            color: 'rgba(255,255,255,0.8)',
            marginBottom: 4,
          }}>
            STEP 1 OF 2
          </Text>

          {/* Title */}
          <Text style={{
            fontSize: 26,
            fontWeight: '700',
            letterSpacing: -0.5,
            color: '#FFFFFF',
            lineHeight: 30,
          }}>
            {'Register your\nlicence plate'}
          </Text>
        </LinearGradient>

        {/* ── Body ── */}
        <View style={{
          flex: 1,
          backgroundColor: '#FFFFFF',
          paddingTop: 28,
          paddingHorizontal: 20,
          paddingBottom: 140,
        }}>
          {/* Why card */}
          <View style={{
            backgroundColor: '#F5F8FC',
            borderRadius: 18,
            padding: 16,
            flexDirection: 'row',
            gap: 12,
            borderWidth: 1,
            borderColor: '#D6E4F5',
            marginBottom: 28,
            alignItems: 'flex-start',
          }}>
            {/* Icon tile */}
            <View style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: 'rgba(45,109,181,0.08)',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Ionicons name="shield-checkmark" size={20} color="#2D6DB5" />
            </View>

            {/* Text column */}
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: '#1A1A2E',
                marginBottom: 2,
              }}>
                Why do we need this?
              </Text>
              <Text style={{
                fontSize: 13,
                color: '#6B7A90',
                lineHeight: 20,
              }}>
                Teammates can reach you too when your car is in the way.
              </Text>
            </View>
          </View>

          {/* PlateDisplay preview */}
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <PlateDisplay plate={plate || ''} size="lg" />
          </View>

          {/* Input block */}
          <Text style={{
            fontSize: 12,
            fontWeight: '700',
            letterSpacing: 1.2,
            color: '#6B7A90',
            textTransform: 'uppercase',
            marginBottom: 8,
          }}>
            YOUR LICENCE PLATE
          </Text>

          {/* Outer wrapper — colored border simulation */}
          <View style={{
            borderWidth: 2,
            borderColor: borderColor,
            borderRadius: 14,
            padding: 2,
            backgroundColor: wrapperBg,
          }}>
            {/* Inner white container */}
            <View style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <TextInput
                style={{
                  flex: 1,
                  paddingTop: 16,
                  paddingBottom: 16,
                  paddingLeft: 16,
                  paddingRight: 48,
                  fontSize: 22,
                  fontWeight: '700',
                  color: '#1A1A2E',
                  letterSpacing: 3,
                  fontFamily: monoFamily,
                }}
                value={plate}
                onChangeText={handleChange}
                placeholder="e.g. 7-0339-96"
                placeholderTextColor="#9AA5B8"
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={12}
                keyboardType="default"
              />

              {/* Trailing check badge when valid and no error */}
              {isValid && !error && (
                <View style={{
                  position: 'absolute',
                  right: 14,
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  backgroundColor: '#28A745',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Ionicons name="checkmark" size={15} color="#FFFFFF" />
                </View>
              )}
            </View>
          </View>

          {/* Helper text */}
          <Text style={{
            marginTop: 8,
            fontSize: 13,
            color: error ? '#D9534F' : isValid ? '#28A745' : '#9AA5B8',
          }}>
            {error
              ? error
              : isValid
                ? 'Looks good — ready to register'
                : 'Letters, numbers, dashes only'}
          </Text>
        </View>
      </ScrollView>

      {/* ── Sticky bottom CTA ── */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        {/* White fade overlay */}
        <LinearGradient
          colors={['rgba(255,255,255,0)', '#FFFFFF']}
          style={{
            position: 'absolute',
            top: -40,
            left: 0,
            right: 0,
            height: 40,
          }}
          pointerEvents="none"
        />

        <View style={{ paddingTop: 14, paddingHorizontal: 20, paddingBottom: 34, backgroundColor: '#FFFFFF' }}>
          <Pressable
            onPress={handleSubmit}
            disabled={!isValid || loading}
            style={({ pressed }) => ({
              backgroundColor: '#2D6DB5',
              height: 56,
              borderRadius: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              opacity: (!isValid || loading) ? 0.5 : 1,
              transform: [{ scale: pressed ? 0.97 : 1 }],
              shadowColor: '#2D6DB5',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.4,
              shadowRadius: 20,
              elevation: 6,
            })}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF' }}>
                  Register &amp; continue
                </Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </>
            )}
          </Pressable>

          <Text style={{
            fontSize: 12,
            color: '#9AA5B8',
            textAlign: 'center',
            marginTop: 10,
          }}>
            You can change this any time in your profile
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
