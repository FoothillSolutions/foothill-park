import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';
import { AUTH_CONFIG } from '../constants/auth';

WebBrowser.maybeCompleteAuthSession();

const STORE_KEYS = {
  accessToken: 'fp_access_token',   // Microsoft Graph token (future use)
  idToken: 'fp_id_token',           // sent to our own API — audience = clientId
  refreshToken: 'fp_refresh_token',
  expiresAt: 'fp_token_expires_at',
  userInfo: 'fp_user_info',
} as const;

export interface UserInfo {
  entraId: string;
  displayName: string;
  email: string;
}

const discovery: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: `https://login.microsoftonline.com/${AUTH_CONFIG.tenantId}/oauth2/v2.0/authorize`,
  tokenEndpoint: `https://login.microsoftonline.com/${AUTH_CONFIG.tenantId}/oauth2/v2.0/token`,
  revocationEndpoint: `https://login.microsoftonline.com/${AUTH_CONFIG.tenantId}/oauth2/v2.0/logout`,
};

export function useAuthRequest(redirectUri: string) {
  return AuthSession.useAuthRequest(
    {
      clientId: AUTH_CONFIG.clientId,
      scopes: [...AUTH_CONFIG.scopes],
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
    },
    discovery
  );
}

export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string,
  redirectUri: string
): Promise<UserInfo> {
  const response = await fetch(discovery.tokenEndpoint!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: AUTH_CONFIG.clientId,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }).toString(),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Token exchange failed: ${err}`);
  }

  const tokens = await response.json();

  const expiresAt = Date.now() + tokens.expires_in * 1000;
  await SecureStore.setItemAsync(STORE_KEYS.accessToken, tokens.access_token);
  await SecureStore.setItemAsync(STORE_KEYS.idToken, tokens.id_token);
  await SecureStore.setItemAsync(STORE_KEYS.expiresAt, String(expiresAt));
  if (tokens.refresh_token) {
    await SecureStore.setItemAsync(STORE_KEYS.refreshToken, tokens.refresh_token);
  }

  const userInfo = parseIdToken(tokens.id_token);
  await SecureStore.setItemAsync(STORE_KEYS.userInfo, JSON.stringify(userInfo));

  return userInfo;
}

export async function getStoredSession(): Promise<{ accessToken: string; user: UserInfo } | null> {
  try {
    const [idToken, expiresAtStr, userInfoStr] = await Promise.all([
      SecureStore.getItemAsync(STORE_KEYS.idToken),
      SecureStore.getItemAsync(STORE_KEYS.expiresAt),
      SecureStore.getItemAsync(STORE_KEYS.userInfo),
    ]);

    if (!idToken || !expiresAtStr || !userInfoStr) return null;

    const expiresAt = parseInt(expiresAtStr, 10);
    if (Date.now() > expiresAt - 60_000) return null;

    // accessToken here is the id_token — it's what our API validates
    return { accessToken: idToken, user: JSON.parse(userInfoStr) };
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  await Promise.all(Object.values(STORE_KEYS).map((k) => SecureStore.deleteItemAsync(k)));
}

function parseIdToken(idToken: string): UserInfo {
  const payload = idToken.split('.')[1];
  const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  return {
    entraId: decoded.oid ?? decoded.sub ?? '',
    displayName: decoded.name ?? decoded.preferred_username ?? '',
    email: decoded.preferred_username ?? decoded.email ?? '',
  };
}
