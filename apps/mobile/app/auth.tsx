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
    if (!code) return;

    let cancelled = false;
    (async () => {
      try {
        const codeVerifier = await SecureStore.getItemAsync('fp_pkce_verifier');
        if (!codeVerifier) throw new Error('No code verifier in store');

        await exchangeCodeForTokens(code, codeVerifier, 'foothill-park://auth');
        await SecureStore.deleteItemAsync('fp_pkce_verifier');
        await completeSignIn();

        // Small delay to let root layout finish mounting before navigating
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
