import { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable,
  ActivityIndicator, StatusBar, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';

// ─── Animated 3-dot loading indicator ────────────────────────────────────────
function LoadingDots() {
  const dots = [useRef(new Animated.Value(0)).current,
                useRef(new Animated.Value(0)).current,
                useRef(new Animated.Value(0)).current];

  useEffect(() => {
    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.parallel([
            Animated.sequence([
              Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
              Animated.timing(dot, { toValue: 0, duration: 400, useNativeDriver: true }),
            ]),
          ]),
          Animated.delay((2 - i) * 150),
        ])
      )
    );
    animations.forEach(a => a.start());
    return () => animations.forEach(a => a.stop());
  }, []);

  return (
    <View style={dotStyles.row}>
      {dots.map((dot, i) => (
        <Animated.View
          key={i}
          style={[
            dotStyles.dot,
            {
              opacity: dot.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
              transform: [{ scale: dot.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }],
            },
          ]}
        />
      ))}
    </View>
  );
}

const dotStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.primary },
});

// ─── Microsoft 4-square logo ─────────────────────────────────────────────────
function MicrosoftLogo({ size = 22 }: { size?: number }) {
  const half = size / 2 - 1;
  return (
    <View style={{ width: size, height: size, flexWrap: 'wrap', flexDirection: 'row', gap: 2 }}>
      <View style={{ width: half, height: half, backgroundColor: '#F25022' }} />
      <View style={{ width: half, height: half, backgroundColor: '#7FBA00' }} />
      <View style={{ width: half, height: half, backgroundColor: '#00A4EF' }} />
      <View style={{ width: half, height: half, backgroundColor: '#FFB900' }} />
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function LoginScreen() {
  const { authState, signIn } = useAuth();
  const isLoading = authState.status === 'loading';

  return (
    <LinearGradient
      colors={[theme.colors.primary, theme.colors.primaryDeep, theme.colors.dark]}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Decorative orb — top right */}
      <View style={styles.orbTopRight} />
      {/* Decorative orb — bottom left */}
      <View style={styles.orbBottomLeft} />

      {/* Version badge */}
      <Text style={styles.versionBadge}>v1.0 · INTERNAL</Text>

      {/* Hero content */}
      <View style={styles.hero}>

        {/* Glass logo mark */}
        <BlurView intensity={20} tint="light" style={styles.logoBox}>
          <Ionicons name="car-sport" size={44} color={theme.colors.white} />
        </BlurView>

        {/* Eyebrow */}
        <Text style={styles.eyebrow}>Foothill Park</Text>

        {/* Headline */}
        <Text style={styles.headline}>Park smarter.{'\n'}Move faster.</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          Find the person behind any plate on the Foothill lot in seconds.
        </Text>
      </View>

      {/* Bottom CTA */}
      <View style={styles.bottom}>
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, isLoading && styles.buttonDisabled]}
          onPress={signIn}
          disabled={isLoading}
        >
          {isLoading ? (
            <LoadingDots />
          ) : (
            <View style={styles.buttonInner}>
              <MicrosoftLogo size={22} />
              <Text style={styles.buttonText}>Sign in with Microsoft</Text>
            </View>
          )}
        </Pressable>

        <Text style={styles.footer}>
          FOOTHILL TECHNOLOGY SOLUTIONS · SSO SECURED
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // ── Decorative orbs ───────────────────────────────────────────────────────
  orbTopRight: {
    position: 'absolute',
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: 'rgba(91,164,230,0.25)',
    top: -120,
    right: -100,
  },
  orbBottomLeft: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(45,109,181,0.40)',
    bottom: 80,
    left: -120,
  },

  // ── Version badge ─────────────────────────────────────────────────────────
  versionBadge: {
    position: 'absolute',
    top: 62,
    right: 20,
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 1.5,
  },

  // ── Hero ──────────────────────────────────────────────────────────────────
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
    paddingBottom: 40,
  },

  logoBox: {
    width: 88,
    height: 88,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },

  eyebrow: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.accent,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 10,
    textAlign: 'center',
  },

  headline: {
    fontSize: 36,
    fontWeight: '700',
    color: theme.colors.white,
    letterSpacing: -0.8,
    lineHeight: 38,
    textAlign: 'center',
    marginBottom: 14,
  },

  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },

  // ── Bottom ────────────────────────────────────────────────────────────────
  bottom: {
    paddingHorizontal: 20,
    paddingBottom: 56,
    alignItems: 'center',
    gap: 18,
  },

  button: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    height: 58,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonPressed: {
    transform: [{ scale: 0.97 }],
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  buttonText: {
    color: theme.colors.dark,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },

  footer: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
});
