import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { theme } from '../constants/theme';
import { exchangeCodeForTokens } from '../services/auth';
import { useAuth } from '../contexts/AuthContext';

WebBrowser.maybeCompleteAuthSession();

export default function AuthCallbackScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { completeSignIn } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState('Signing you in…');

  useEffect(() => {
    console.log('[auth] mount, code present:', !!code);
    if (!code) return;

    let cancelled = false;
    (async () => {
      try {
        console.log('[auth] code length:', code?.length);
        const codeVerifier = await SecureStore.getItemAsync('fp_pkce_verifier');
        console.log('[auth] verifier from store:', !!codeVerifier, 'length:', codeVerifier?.length);
        if (!codeVerifier) throw new Error('No code verifier in store');

        setStatus('Exchanging tokens…');
        await exchangeCodeForTokens(code, codeVerifier, 'foothill-park://auth');
        console.log('[auth] tokens exchanged');
        await SecureStore.deleteItemAsync('fp_pkce_verifier');
        await completeSignIn();
        console.log('[auth] session hydrated, navigating');

        if (!cancelled) setTimeout(() => router.replace('/(auth)/scan'), 100);
      } catch (err) {
        console.error('[AuthCallback] failed:', err);
        if (!cancelled) setTimeout(() => router.replace('/login'), 100);
      }
    })();

    return () => { cancelled = true; };
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
