import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable,
  Linking, KeyboardAvoidingView,
  Platform, ScrollView, TextInput,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { PlateDisplay } from '../../components/PlateDisplay';
import CameraScanner from '../../components/CameraScanner';
import { api } from '../../services/api';
import { isValidPlate, normalizePlate } from '../../utils/plateParser';

// ── Design tokens ────────────────────────────────────────────────────────────
const C = {
  primary:       '#2D6DB5',
  accent:        '#5BA4E6',
  dark:          '#1A1A2E',
  white:         '#FFFFFF',
  discord:       '#5865F2',
  surface:       '#F5F8FC',
  border:        '#D6E4F5',
  textSecondary: '#6B7A90',
  textTertiary:  '#9AA5B8',
  error:         '#D9534F',
  success:       '#28A745',
} as const;

// ── Types ────────────────────────────────────────────────────────────────────
type Result =
  | { found: false }
  | { found: true; owner: { displayName: string; phone: string | null; discordId: string | null; department: string | null } };

// ── Deterministic avatar colour from name ────────────────────────────────────
function avatarHue(name: string): number {
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return (sum * 37) % 360;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase() ?? '')
    .join('');
}

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

// ── ResultCard ───────────────────────────────────────────────────────────────
function ResultCard({
  result,
  plate,
  onReset,
}: {
  result: Result;
  plate: string;
  onReset: () => void;
}) {
  const translateY = useRef(new Animated.Value(24)).current;
  const opacity    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
  }, [result]);

  return (
    <Animated.View style={[styles.resultCard, { transform: [{ translateY }], opacity }]}>
      {/* Hero block */}
      <LinearGradient
        colors={['rgba(45,109,181,0.08)', 'rgba(91,164,230,0.04)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroBlock}
      >
        {/* Status pill */}
        <View style={styles.statusPill}>
          <View style={styles.statusDotOuter(result.found)}>
            <View style={styles.statusDotInner(result.found)} />
          </View>
          <Text style={[styles.statusText, { color: result.found ? C.success : C.error }]}>
            {result.found ? 'MATCH FOUND' : 'NOT REGISTERED'}
          </Text>
        </View>

        <PlateDisplay plate={normalizePlate(plate)} size="lg" />
      </LinearGradient>

      {result.found ? (
        <>
          {/* Name + avatar row */}
          <View style={styles.ownerRow}>
            {(() => {
              const hue = avatarHue(result.owner.displayName);
              const bg  = `hsl(${hue},45%,55%)`;
              return (
                <View style={[styles.avatar, { backgroundColor: bg }]}>
                  <Text style={styles.avatarText}>{initials(result.owner.displayName)}</Text>
                </View>
              );
            })()}
            <View style={{ flex: 1 }}>
              <Text style={styles.ownerName}>{result.owner.displayName}</Text>
              {result.owner.department ? (
                <Text style={styles.ownerDept}>{result.owner.department}</Text>
              ) : null}
            </View>
          </View>

          {/* Action buttons */}
          <View style={styles.actionRow}>
            {result.owner.phone ? (
              <Pressable
                style={styles.callBtn}
                onPress={() => Linking.openURL(`tel:${result.owner.phone}`)}
              >
                <Ionicons name="call" size={18} color={C.white} />
                <Text style={styles.actionBtnText}>Call</Text>
              </Pressable>
            ) : null}

            {result.owner.discordId ? (
              <Pressable
                style={styles.discordBtn}
                onPress={() => Linking.openURL(`discord://users/${result.owner.discordId}`)}
              >
                <Ionicons name="chatbubbles" size={18} color={C.white} />
                <Text style={styles.actionBtnText}>Discord</Text>
              </Pressable>
            ) : null}
          </View>
        </>
      ) : (
        /* Not found */
        <View style={styles.notFoundBlock}>
          <View style={styles.notFoundIcon}>
            <Ionicons name="close" size={28} color={C.error} />
          </View>
          <Text style={styles.notFoundTitle}>No employee found</Text>
          <Text style={styles.notFoundSub}>The car may belong to a visitor.</Text>
        </View>
      )}

      {/* Bottom reset row */}
      <View style={styles.resetRow}>
        <Pressable onPress={onReset}>
          <Text style={styles.resetText}>Search another plate</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

// ── Main screen ──────────────────────────────────────────────────────────────
export default function ScanScreen() {
  const [plate,      setPlate]      = useState('');
  const [loading,    setLoading]    = useState(false);
  const [result,     setResult]     = useState<Result | null>(null);
  const [error,      setError]      = useState('');
  const [cameraOpen, setCameraOpen] = useState(false);

  async function handleLookup(rawPlate = plate) {
    if (!isValidPlate(rawPlate)) return;
    setLoading(true);
    setResult(null);
    setError('');
    try {
      const data = await api.lookupPlate(normalizePlate(rawPlate));
      setResult(data as Result);
    } catch (err: any) {
      setError(err.message ?? 'Lookup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handlePlateDetected(detected: string) {
    setCameraOpen(false);
    setPlate(detected);
    handleLookup(detected);
  }

  function handleReset() {
    setPlate('');
    setResult(null);
    setError('');
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
        colors={['#2D6DB5', '#5BA4E6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        {/* Decorative circles */}
        <View style={styles.deco1} />
        <View style={styles.deco2} />

        {/* Text row */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.eyebrow}>QUICK LOOK-UP</Text>
            <Text style={styles.headerTitle}>{'Which car is\nblocking you?'}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Loading state ─────────────────────────────────────────────── */}
        {loading && (
          <View style={styles.loadingCard}>
            <Spinner />
            <Text style={styles.loadingText}>Searching Foothill roster…</Text>
          </View>
        )}

        {/* ── Result ────────────────────────────────────────────────────── */}
        {result && !loading && (
          <ResultCard result={result} plate={plate} onReset={handleReset} />
        )}

        {/* ── Default (no result, not loading) ─────────────────────────── */}
        {!result && !loading && (
          <>
            {/* Camera CTA card */}
            <Pressable
              style={({ pressed }) => [styles.cameraCard, pressed && { transform: [{ scale: 0.97 }] }]}
              onPress={() => setCameraOpen(true)}
            >
              <View style={styles.cameraIconTile}>
                <LinearGradient
                  colors={['#2D6DB5', '#5BA4E6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cameraIconGradient}
                >
                  <Ionicons name="camera" size={26} color={C.white} />
                </LinearGradient>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cameraCardTitle}>Scan with camera</Text>
                <Text style={styles.cameraCardSub}>Point at the plate — we'll read it</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={C.textTertiary} />
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
                  { backgroundColor: isValidPlate(plate) ? C.primary : C.border },
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
                    placeholderTextColor={C.textTertiary}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    maxLength={12}
                  />
                </View>
              </View>

              {/* Lookup button */}
              <Pressable
                style={[
                  styles.lookupBtn,
                  (!isValidPlate(plate) || loading) && styles.lookupBtnDisabled,
                ]}
                onPress={() => handleLookup()}
                disabled={!isValidPlate(plate) || loading}
              >
                <Ionicons name="search" size={18} color={C.white} />
                <Text style={styles.lookupBtnText}>Look up owner</Text>
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
  shadowColor: '#1A1A2E',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.04,
  shadowRadius: 10,
  elevation: 2,
} as const;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.surface,
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
    color: C.white,
    letterSpacing: -0.5,
    lineHeight: 34,
  },

  // ── Scroll ────────────────────────────────────────────────────────────────
  scrollContent: {
    padding: 18,
    paddingHorizontal: 16,
    paddingBottom: 150,
  },

  // ── Loading card ──────────────────────────────────────────────────────────
  loadingCard: {
    backgroundColor: C.white,
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
    borderColor: C.border,
    borderTopColor: C.primary,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: C.dark,
  },

  // ── Camera card ───────────────────────────────────────────────────────────
  cameraCard: {
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: C.border,
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
    shadowColor: C.primary,
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
    color: C.dark,
    marginBottom: 2,
  },
  cameraCardSub: {
    fontSize: 13,
    color: C.textSecondary,
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
    backgroundColor: C.border,
  },
  dividerLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: C.textTertiary,
    textTransform: 'uppercase',
  },

  // ── Manual card ───────────────────────────────────────────────────────────
  manualCard: {
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: C.border,
    ...cardShadow,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: C.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  inputWrapper: {
    borderRadius: 12,
    padding: 2,
    marginBottom: 14,
  },
  inputInner: {
    backgroundColor: C.white,
    borderRadius: 10,
  },
  plateInput: {
    padding: 14,
    paddingHorizontal: 16,
    fontSize: 22,
    fontWeight: '700',
    color: C.dark,
    letterSpacing: 3,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace' }),
  },
  lookupBtn: {
    backgroundColor: C.accent,
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  lookupBtnDisabled: {
    opacity: 0.45,
  },
  lookupBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: C.white,
  },

  // ── Tip ──────────────────────────────────────────────────────────────────
  tip: {
    fontSize: 12,
    color: C.textTertiary,
    textAlign: 'center',
    marginTop: 22,
  },

  // ── Result card ───────────────────────────────────────────────────────────
  resultCard: {
    backgroundColor: C.white,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: 'rgba(30,50,90,1)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 30,
    elevation: 6,
  },
  heroBlock: {
    padding: 24,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    alignItems: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  // ── Owner row ─────────────────────────────────────────────────────────────
  ownerRow: {
    padding: 22,
    paddingHorizontal: 20,
    paddingBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: C.white,
    fontSize: 22,
    fontWeight: '700',
  },
  ownerName: {
    fontSize: 20,
    fontWeight: '700',
    color: C.dark,
    letterSpacing: -0.3,
  },
  ownerDept: {
    fontSize: 13,
    color: C.textSecondary,
    marginTop: 2,
  },

  // ── Action row ────────────────────────────────────────────────────────────
  actionRow: {
    padding: 18,
    paddingHorizontal: 16,
    flexDirection: 'row',
    gap: 10,
  },
  callBtn: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    backgroundColor: C.primary,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  discordBtn: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    backgroundColor: C.discord,
    shadowColor: C.discord,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: C.white,
  },

  // ── Not found ─────────────────────────────────────────────────────────────
  notFoundBlock: {
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  notFoundIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(217,83,79,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  notFoundTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: C.dark,
    marginBottom: 4,
  },
  notFoundSub: {
    fontSize: 14,
    color: C.textSecondary,
  },

  // ── Reset row ─────────────────────────────────────────────────────────────
  resetRow: {
    borderTopWidth: 1,
    borderTopColor: C.border,
    padding: 16,
    paddingHorizontal: 20,
  },
  resetText: {
    fontSize: 15,
    fontWeight: '600',
    color: C.primary,
    textAlign: 'center',
  },
} as any);

// Inline style factories for status dot (can't use functions in StyleSheet.create)
(styles as any).statusDotOuter = (found: boolean) => ({
  width: 14,
  height: 14,
  borderRadius: 7,
  backgroundColor: found ? 'rgba(40,167,69,0.2)' : 'rgba(217,83,79,0.2)',
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
});

(styles as any).statusDotInner = (found: boolean) => ({
  width: 6,
  height: 6,
  borderRadius: 3,
  backgroundColor: found ? C.success : C.error,
});
