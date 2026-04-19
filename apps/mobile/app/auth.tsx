import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { theme } from '../constants/theme';
import { exchangeCodeForTokens, getStoredSession } from '../services/auth';
import { useAuth } from '../contexts/AuthContext';

WebBrowser.maybeCompleteAuthSession();

export default function AuthCallbackScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { completeSignIn } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState('Signing you in…');

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
        setStatus('Exchanging tokens…');
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

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={styles.text}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  text: { fontSize: 16, color: theme.colors.textSecondary },
});
