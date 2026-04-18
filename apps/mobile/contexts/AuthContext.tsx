import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { makeRedirectUri } from 'expo-auth-session';
import {
  useAuthRequest,
  exchangeCodeForTokens,
  getStoredSession,
  clearSession,
  UserInfo,
} from '../services/auth';
import { api } from '../services/api';

export type AuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'authenticated'; user: UserInfo; accessToken: string; hasPlate: boolean };

interface AuthContextValue {
  authState: AuthState;
  signIn: () => void;
  signOut: () => Promise<void>;
  setHasPlate: (value: boolean) => void;
  request: ReturnType<typeof useAuthRequest>[0];
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({ status: 'loading' });

  const redirectUri = __DEV__
    ? 'exp://localhost:8081/--/auth'
    : makeRedirectUri({ scheme: 'foothill-park', path: 'auth' });

  const [request, response, promptAsync] = useAuthRequest(redirectUri);

  async function hydrateSession() {
    const session = await getStoredSession();
    if (!session) {
      setAuthState({ status: 'unauthenticated' });
      return;
    }
    // Fetch hasPlate from the API; default to false if API is unreachable (server not up yet)
    let hasPlate = false;
    try {
      const me = await api.me();
      hasPlate = me.hasPlate;
    } catch {
      console.warn('[Auth] Could not reach API for hasPlate check — defaulting to false');
    }
    setAuthState({ status: 'authenticated', user: session.user, accessToken: session.accessToken, hasPlate });
  }

  // Restore session on mount
  useEffect(() => { hydrateSession(); }, []);

  // Handle OAuth callback
  useEffect(() => {
    if (response?.type === 'success' && request?.codeVerifier) {
      const { code } = response.params;
      exchangeCodeForTokens(code, request.codeVerifier, redirectUri)
        .then(async (user) => {
          const session = await getStoredSession();
          if (!session) return;
          let hasPlate = false;
          try {
            const me = await api.me();
            hasPlate = me.hasPlate;
          } catch {
            console.warn('[Auth] Could not reach API for hasPlate check');
          }
          setAuthState({ status: 'authenticated', user, accessToken: session.accessToken, hasPlate });
        })
        .catch((err) => {
          console.error('[Auth] Token exchange failed:', err);
          setAuthState({ status: 'unauthenticated' });
        });
    } else if (response?.type === 'error') {
      console.error('[Auth] OAuth error:', response.error);
      setAuthState({ status: 'unauthenticated' });
    }
  }, [response]);

  const signIn = useCallback(() => promptAsync(), [promptAsync]);

  const signOut = useCallback(async () => {
    await clearSession();
    setAuthState({ status: 'unauthenticated' });
  }, []);

  const setHasPlate = useCallback((value: boolean) => {
    setAuthState((prev) =>
      prev.status === 'authenticated' ? { ...prev, hasPlate: value } : prev
    );
  }, []);

  return (
    <AuthContext.Provider value={{ authState, signIn, signOut, setHasPlate, request }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
