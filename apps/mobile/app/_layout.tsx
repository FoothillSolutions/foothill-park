import { useEffect, useRef } from 'react';
import { Linking } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { theme } from '../constants/theme';
import { useGeofence } from '../hooks/useGeofence';
import { GATE_PHONE } from '../constants/config';
import '../tasks/geofenceTask';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      retry: 1,
    },
  },
});

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
  useGeofence();
  const notifListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    notifListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        if (data?.callGate) {
          Linking.openURL(`tel:${GATE_PHONE}`);
        }
      }
    );
    return () => notifListener.current?.remove();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="dark" backgroundColor={theme.colors.white} />
          <AuthGate />
          <Stack screenOptions={{ headerShown: false }} />
        </AuthProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
