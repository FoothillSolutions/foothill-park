import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import { AUTH_CONFIG } from '../constants/auth';
import {
  getStoredSession,
  clearSession,
  UserInfo,
  exchangeCodeForTokens,
} from '../services/auth';
import { api } from '../services/api';

WebBrowser.maybeCompleteAuthSession();

const REDIRECT_URI = 'foothill-park://auth';
const AUTH_ENDPOINT = `https://login.microsoftonline.com/${AUTH_CONFIG.tenantId}/oauth2/v2.0/authorize`;

async function buildPKCE() {
  // Use hex encoding — avoids btoa which is unreliable on Hermes/Android
  const bytes = await Crypto.getRandomBytesAsync(32);
  const verifier = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');

  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    verifier,
    { encoding: Crypto.CryptoEncoding.BASE64 }
  );
  const challenge = hash.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  return { verifier, challenge };
}

export type AuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'authenticated'; user: UserInfo; accessToken: string; hasPlate: boolean };

interface AuthContextValue {
  authState: AuthState;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  setHasPlate: (value: boolean) => void;
  completeSignIn: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({ status: 'loading' });

  async function hydrateSession() {
    const session = await getStoredSession();
    if (!session) { setAuthState({ status: 'unauthenticated' }); return; }
    let hasPlate = true;
    try { const me = await api.me(); hasPlate = me.hasPlate; } catch {
      // Server unreachable — assume plate exists so we don't force onboarding
      console.warn('[hydrateSession] /api/me failed, assuming hasPlate=true');
    }
    setAuthState({ status: 'authenticated', user: session.user, accessToken: session.accessToken, hasPlate });
  }

  useEffect(() => { hydrateSession(); }, []);

  const signIn = useCallback(async () => {
    try {
      const { verifier, challenge } = await buildPKCE();
      console.log('[signIn] PKCE ready, verifier length:', verifier.length);

      await SecureStore.setItemAsync('fp_pkce_verifier', verifier);
      console.log('[signIn] verifier stored');

      const params = new URLSearchParams({
        client_id: AUTH_CONFIG.clientId,
        response_type: 'code',
        redirect_uri: REDIRECT_URI,
        scope: AUTH_CONFIG.scopes.join(' '),
        code_challenge: challenge,
        code_challenge_method: 'S256',
        response_mode: 'query',
      });

      const result = await WebBrowser.openAuthSessionAsync(
        `${AUTH_ENDPOINT}?${params}`,
        REDIRECT_URI
      );

      console.log('[signIn] browser result type:', result.type, 'platform:', Platform.OS);

      // iOS: openAuthSessionAsync returns the redirect URL directly in result.url
      // Android: CCT closes and the redirect fires as a deep link → app/auth.tsx handles it
      // Guard on Platform.OS so we never consume the code here on Android — doing so
      // would delete the verifier before app/auth.tsx can read it.
      if (Platform.OS !== 'android' && result.type === 'success' && result.url) {
        const url = new URL(result.url);
        const code = url.searchParams.get('code');
        console.log('[signIn] iOS code received:', !!code);
        if (code) {
          await exchangeCodeForTokens(code, verifier, REDIRECT_URI);
          await SecureStore.deleteItemAsync('fp_pkce_verifier');
          await hydrateSession();
        }
      }
    } catch (err) {
      console.error('[signIn] error:', err);
    }
  }, []);

  const signOut = useCallback(async () => {
    await clearSession();
    setAuthState({ status: 'unauthenticated' });
  }, []);

  const setHasPlate = useCallback((value: boolean) => {
    setAuthState((prev) =>
      prev.status === 'authenticated' ? { ...prev, hasPlate: value } : prev
    );
  }, []);

  const completeSignIn = useCallback(async () => {
    await hydrateSession();
  }, []);

  return (
    <AuthContext.Provider value={{ authState, signIn, signOut, setHasPlate, completeSignIn }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
