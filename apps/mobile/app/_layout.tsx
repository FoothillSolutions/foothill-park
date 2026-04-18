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
    if (authState.status === 'loading') return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';

    if (authState.status === 'unauthenticated') {
      if (inAuthGroup) router.replace('/login');
      return;
    }

    // Authenticated from here
    if (!authState.hasPlate && !inOnboarding) {
      router.replace('/onboarding');
    } else if (authState.hasPlate && !inAuthGroup) {
      router.replace('/(auth)/scan');
    }
  }, [authState, segments]);

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
