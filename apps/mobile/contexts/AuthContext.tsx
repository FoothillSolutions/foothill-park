import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
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

interface AuthContextValue {
  authState: AuthState;
  signIn: () => void;
  signOut: () => Promise<void>;
  request: ReturnType<typeof useAuthRequest>[0];
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({ status: 'loading' });

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
    console.log('[Auth] response type:', response?.type ?? 'null');
    if (response?.type === 'success') {
      console.log('[Auth] code verifier present:', !!request?.codeVerifier);
      console.log('[Auth] code present:', !!response.params?.code);
    }

    if (response?.type === 'success' && request?.codeVerifier) {
      const { code } = response.params;
      console.log('[Auth] Starting token exchange...');
      exchangeCodeForTokens(code, request.codeVerifier, redirectUri)
        .then((user) => {
          console.log('[Auth] Token exchange success, user:', user.displayName);
          getStoredSession().then((session) => {
            console.log('[Auth] Stored session found:', !!session);
            if (session) {
              setAuthState({ status: 'authenticated', user, accessToken: session.accessToken });
              console.log('[Auth] State set to authenticated');
            } else {
              console.warn('[Auth] No session found after token exchange');
            }
          });
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

  return (
    <AuthContext.Provider value={{ authState, signIn, signOut, request }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
