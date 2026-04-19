import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import { AUTH_CONFIG } from '../constants/auth';
import {
  getStoredSession,
  clearSession,
  UserInfo,
} from '../services/auth';
import { api } from '../services/api';

WebBrowser.maybeCompleteAuthSession();

const REDIRECT_URI = 'foothill-park://auth';
const AUTH_ENDPOINT = `https://login.microsoftonline.com/${AUTH_CONFIG.tenantId}/oauth2/v2.0/authorize`;

async function buildPKCE() {
  const bytes = await Crypto.getRandomBytesAsync(32);
  const verifier = btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
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
    let hasPlate = false;
    try { const me = await api.me(); hasPlate = me.hasPlate; } catch {}
    setAuthState({ status: 'authenticated', user: session.user, accessToken: session.accessToken, hasPlate });
  }

  useEffect(() => { hydrateSession(); }, []);

  const signIn = useCallback(async () => {
    const { verifier, challenge } = await buildPKCE();
    await SecureStore.setItemAsync('fp_pkce_verifier', verifier);

    const params = new URLSearchParams({
      client_id: AUTH_CONFIG.clientId,
      response_type: 'code',
      redirect_uri: REDIRECT_URI,
      scope: AUTH_CONFIG.scopes.join(' '),
      code_challenge: challenge,
      code_challenge_method: 'S256',
      response_mode: 'query',
    });

    await WebBrowser.openAuthSessionAsync(`${AUTH_ENDPOINT}?${params}`, REDIRECT_URI);
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
    const session = await getStoredSession();
    if (!session) return;
    let hasPlate = false;
    try { const me = await api.me(); hasPlate = me.hasPlate; } catch {}
    setAuthState({ status: 'authenticated', user: session.user, accessToken: session.accessToken, hasPlate });
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
