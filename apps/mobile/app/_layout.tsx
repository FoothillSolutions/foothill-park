import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { theme } from '../constants/theme';

function AuthGate() {
  const { authState } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    console.log('[AuthGate] status:', authState.status, '| segments:', JSON.stringify(segments));
    if (authState.status === 'loading') return;

    const inAuthGroup = segments[0] === '(auth)';
    console.log('[AuthGate] inAuthGroup:', inAuthGroup);

    if (authState.status === 'unauthenticated' && inAuthGroup) {
      console.log('[AuthGate] → /login');
      router.replace('/login');
    } else if (authState.status === 'authenticated' && !inAuthGroup) {
      console.log('[AuthGate] → /(auth)/scan');
      router.replace('/(auth)/scan');
    } else {
      console.log('[AuthGate] No navigation needed');
    }
  }, [authState.status, segments]);

  return null;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" backgroundColor={theme.colors.white} />
        <AuthGate />
        <Stack screenOptions={{ headerShown: false }} />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
