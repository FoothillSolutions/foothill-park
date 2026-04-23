import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable,
  Alert, KeyboardAvoidingView,
  Platform, ScrollView, TextInput,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import CameraScanner from '../../components/CameraScanner';
import { api } from '../../services/api';
import { isValidPlate, normalizePlate } from '../../utils/plateParser';
import { theme } from '../../constants/theme';

// ── Spinner ──────────────────────────────────────────────────────────────────
function Spinner() {
  const rot = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rot, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      })
    ).start();
  }, [rot]);

  const rotate = rot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View
      style={[styles.spinner, { transform: [{ rotate }] }]}
    />
  );
}

// ── Main screen ──────────────────────────────────────────────────────────────
export default function RegisterPlateScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ employeeId: string; employeeName: string }>();
  const employeeId = params.employeeId;
  const employeeName = params.employeeName;

  const [plate, setPlate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cameraOpen, setCameraOpen] = useState(false);

  async function handleRegister() {
    if (!isValidPlate(plate) || !employeeId) return;
    setLoading(true);
    setError('');
    try {
      await api.registerPlate(normalizePlate(plate), employeeId);
      Alert.alert(
        'Plate Registered',
        `${plate} has been registered for ${employeeName}.`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (err: any) {
      setError(err.message ?? 'Failed to register plate. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handlePlateDetected(detected: string) {
    setCameraOpen(false);
    setPlate(detected);
  }

  // ── Camera ───────────────────────────────────────────────────────────────
  if (cameraOpen) {
    return (
      <CameraScanner
        onPlateDetected={handlePlateDetected}
        onClose={() => setCameraOpen(false)}
      />
    );
  }

  // ── Main ─────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Gradient header */}
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.accent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        {/* Decorative circles */}
        <View style={styles.deco1} />
        <View style={styles.deco2} />

        {/* Back button */}
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.white} />
        </Pressable>

        {/* Text row */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.eyebrow}>REGISTER PLATE</Text>
            <Text style={styles.headerTitle}>{`Add plate for\n${employeeName}`}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Error state ───────────────────────────────────────────────── */}
        {error ? (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle" size={22} color={theme.colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={() => setError('')}>
              <Text style={styles.errorDismiss}>Dismiss</Text>
            </Pressable>
          </View>
        ) : null}

        {/* ── Loading state ─────────────────────────────────────────────── */}
        {loading && (
          <View style={styles.loadingCard}>
            <Spinner />
            <Text style={styles.loadingText}>Registering plate…</Text>
          </View>
        )}

        {/* ── Form ─────────────────────────────────────────────────────── */}
        {!loading && (
          <>
            {/* Camera CTA card */}
            <Pressable
              style={({ pressed }) => [styles.cameraCard, pressed && { transform: [{ scale: 0.97 }] }]}
              onPress={() => setCameraOpen(true)}
            >
              <View style={styles.cameraIconTile}>
                <LinearGradient
                  colors={[theme.colors.primary, theme.colors.accent]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cameraIconGradient}
                >
                  <Ionicons name="camera" size={26} color={theme.colors.white} />
                </LinearGradient>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cameraCardTitle}>Scan with camera</Text>
                <Text style={styles.cameraCardSub}>Point at the plate — we'll read it</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.textTertiary} />
            </Pressable>

            {/* OR divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerLabel}>OR ENTER MANUALLY</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Manual entry card */}
            <View style={styles.manualCard}>
              <Text style={styles.inputLabel}>PLATE NUMBER</Text>

              {/* Input wrapper — gradient border when valid */}
              <View
                style={[
                  styles.inputWrapper,
                  { backgroundColor: isValidPlate(plate) ? theme.colors.primary : theme.colors.border },
                ]}
              >
                <View style={styles.inputInner}>
                  <TextInput
                    style={styles.plateInput}
                    value={plate}
                    onChangeText={raw => {
                      const cleaned = raw
                        .replace(/[^A-Za-z0-9\-\s]/g, '')
                        .toUpperCase();
                      setPlate(cleaned);
                    }}
                    placeholder="e.g. 7-0339-96"
                    placeholderTextColor={theme.colors.textTertiary}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    maxLength={12}
                  />
                </View>
              </View>

              {/* Register button */}
              <Pressable
                style={[
                  styles.registerBtn,
                  (!isValidPlate(plate) || loading) && styles.registerBtnDisabled,
                ]}
                onPress={() => handleRegister()}
                disabled={!isValidPlate(plate) || loading}
              >
                <Ionicons name="checkmark-circle" size={18} color={theme.colors.white} />
                <Text style={styles.registerBtnText}>Register Plate</Text>
              </Pressable>
            </View>

            {/* Tip */}
            <Text style={styles.tip}>
              Tip: use the camera in low light — the flash stays off
            </Text>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const cardShadow = {
  shadowColor: theme.colors.dark,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.04,
  shadowRadius: 10,
  elevation: 2,
} as const;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    height: 140,
    paddingTop: 54,
    paddingBottom: 18,
    paddingHorizontal: 20,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  deco1: {
    position: 'absolute',
    right: -40,
    top: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  deco2: {
    position: 'absolute',
    right: 40,
    bottom: -80,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  backButton: {
    position: 'absolute',
    top: 54,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: theme.colors.white,
    letterSpacing: -0.5,
    lineHeight: 34,
  },

  // ── Scroll ────────────────────────────────────────────────────────────────
  scrollContent: {
    padding: 18,
    paddingHorizontal: 16,
    paddingBottom: 150,
  },

  // ── Error card ────────────────────────────────────────────────────────────
  errorCard: {
    backgroundColor: 'rgba(217,83,79,0.08)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(217,83,79,0.25)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.error,
    fontWeight: '500',
  },
  errorDismiss: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.error,
  },

  // ── Loading card ──────────────────────────────────────────────────────────
  loadingCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 24,
    padding: 40,
    ...cardShadow,
    alignItems: 'center',
    gap: 16,
  },
  spinner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    borderColor: theme.colors.border,
    borderTopColor: theme.colors.primary,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.dark,
  },

  // ── Camera card ───────────────────────────────────────────────────────────
  cameraCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...cardShadow,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  cameraIconTile: {
    width: 56,
    height: 56,
    borderRadius: 16,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 4,
  },
  cameraIconGradient: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.dark,
    marginBottom: 2,
  },
  cameraCardSub: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },

  // ── Divider ───────────────────────────────────────────────────────────────
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 8,
    marginBottom: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  dividerLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: theme.colors.textTertiary,
    textTransform: 'uppercase',
  },

  // ── Manual card ───────────────────────────────────────────────────────────
  manualCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...cardShadow,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  inputWrapper: {
    borderRadius: 12,
    padding: 2,
    marginBottom: 14,
  },
  inputInner: {
    backgroundColor: theme.colors.white,
    borderRadius: 10,
  },
  plateInput: {
    padding: 14,
    paddingHorizontal: 16,
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.dark,
    letterSpacing: 3,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace' }),
  },
  registerBtn: {
    backgroundColor: theme.colors.accent,
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  registerBtnDisabled: {
    opacity: 0.45,
  },
  registerBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.white,
  },

  // ── Tip ──────────────────────────────────────────────────────────────────
  tip: {
    fontSize: 12,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    marginTop: 22,
  },
});
