import { useState, useEffect, useCallback } from 'react';
import { makeRedirectUri } from 'expo-auth-session';
import {
  useAuthRequest,
  exchangeCodeForTokens,
  getStoredSession,
  clearSession,
  UserInfo,
} from '../services/auth';

export type AuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'authenticated'; user: UserInfo; accessToken: string };

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({ status: 'loading' });

  // Simulator always uses localhost. Production builds use the foothill-park:// scheme.
  const redirectUri = __DEV__
    ? 'exp://localhost:8081/--/auth'
    : makeRedirectUri({ scheme: 'foothill-park', path: 'auth' });

  const [request, response, promptAsync] = useAuthRequest(redirectUri);

  // Restore session on mount
  useEffect(() => {
    getStoredSession().then((session) => {
      if (session) {
        setAuthState({ status: 'authenticated', user: session.user, accessToken: session.accessToken });
      } else {
        setAuthState({ status: 'unauthenticated' });
      }
    });
  }, []);

  // Handle OAuth callback
  useEffect(() => {
    if (response?.type === 'success' && request?.codeVerifier) {
      const { code } = response.params;
      exchangeCodeForTokens(code, request.codeVerifier, redirectUri)
        .then((user) => {
          getStoredSession().then((session) => {
            if (session) {
              setAuthState({ status: 'authenticated', user, accessToken: session.accessToken });
            }
          });
        })
        .catch((err) => {
          console.error('Token exchange failed', err);
          setAuthState({ status: 'unauthenticated' });
        });
    } else if (response?.type === 'error') {
      setAuthState({ status: 'unauthenticated' });
    }
  }, [response]);

  const signIn = useCallback(() => {
    promptAsync();
  }, [promptAsync]);

  const signOut = useCallback(async () => {
    await clearSession();
    setAuthState({ status: 'unauthenticated' });
  }, []);

  return { authState, signIn, signOut, request };
}
