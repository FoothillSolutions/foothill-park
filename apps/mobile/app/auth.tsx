import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, StatusBar } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { exchangeCodeForTokens, getStoredSession } from '../services/auth';
import { useAuth } from '../contexts/AuthContext';

WebBrowser.maybeCompleteAuthSession();

export default function AuthCallbackScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { completeSignIn } = useAuth();
  const router = useRouter();

  const spinVal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(spinVal, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      })
    );
    anim.start();
    return () => anim.stop();
  }, []);

  useEffect(() => {
    console.log('[auth] mount, code present:', !!code, 'code value:', code);
    if (!code) {
      console.log('[auth] no code — screen rendered without a code param, staying put');
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        console.log('[auth] code length:', code?.length);
        console.log('[auth] reading verifier from SecureStore…');
        const codeVerifier = await SecureStore.getItemAsync('fp_pkce_verifier');
        console.log('[auth] verifier from store:', !!codeVerifier, 'length:', codeVerifier?.length);

        if (!codeVerifier) {
          console.log('[auth] no verifier — stale deep link replay path');
          console.log('[auth] reading stored session…');
          const session = await getStoredSession();
          console.log('[auth] stored session present:', !!session, 'cancelled:', cancelled);
          const dest = session ? '/(auth)/scan' : '/login';
          console.log('[auth] routing to:', dest);
          if (!cancelled) router.replace(dest);
          return;
        }

        console.log('[auth] verifier found — exchanging tokens…');
        await exchangeCodeForTokens(code, codeVerifier, 'foothill-park://auth');
        console.log('[auth] tokens exchanged, deleting verifier…');
        await SecureStore.deleteItemAsync('fp_pkce_verifier');
        console.log('[auth] calling completeSignIn…');
        await completeSignIn();
        console.log('[auth] session hydrated, cancelled:', cancelled);

        if (!cancelled) {
          console.log('[auth] navigating to scan');
          setTimeout(() => router.replace('/(auth)/scan'), 100);
        }
      } catch (err) {
        console.error('[AuthCallback] failed:', err);
        if (!cancelled) setTimeout(() => router.replace('/login'), 100);
      }
    })();

    return () => {
      console.log('[auth] cleanup — setting cancelled=true');
      cancelled = true;
    };
  }, [code]);

  const rotate = spinVal.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <LinearGradient
      colors={['#2D6DB5', '#244E86', '#1A1A2E']}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={styles.gradient}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Decorative orb */}
      <View style={styles.orb} />

      {/* Centered content */}
      <View style={styles.content}>
        {/* Logo mark */}
        <View style={styles.logoWrap}>
          <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
          <Ionicons name="car-sport" size={44} color="#FFFFFF" />
        </View>

        {/* Spinner */}
        <Animated.View style={[styles.spinner, { transform: [{ rotate }] }]} />

        {/* Title */}
        <Text style={styles.title}>Signing you in…</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>Verifying your Foothill credentials</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  orb: {
    position: 'absolute',
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: 'rgba(91,164,230,0.25)',
    top: -120,
    right: -100,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
    paddingHorizontal: 40,
  },
  logoWrap: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 40,
    elevation: 10,
  },
  spinner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.15)',
    borderTopColor: '#FFFFFF',
  },
  title: {
    fontSize: 19,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
});
