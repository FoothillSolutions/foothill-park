import { getStoredSession } from './auth';

function getBaseUrl(): string {
  if (!__DEV__) return 'https://api.foothillpark.internal';
  // Physical device: run `adb reverse tcp:3000 tcp:3000` once per session so localhost works.
  // Emulator: localhost also resolves to the host machine on both platforms.
  return 'http://localhost:3000';
}

async function authHeaders(): Promise<Record<string, string>> {
  const session = await getStoredSession();
  if (!session) throw new Error('Not authenticated');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.accessToken}`,
  };
}

async function request<T>(path: string, options?: RequestInit, timeoutMs = 8000): Promise<T> {
  const headers = await authHeaders();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${getBaseUrl()}${path}`, { ...options, headers, signal: controller.signal });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`API ${path} failed (${res.status}): ${body}`);
    }
    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}

export interface MeResponse {
  entraId: string;
  displayName: string;
  email: string;
  hasPlate: boolean;
}

export interface EmployeeResponse {
  id: string;
  displayName: string;
  department: string | null;
  phone: string | null;
  discordId: string | null;
}

export interface PlateResponse {
  id: string;
  plateNumber: string;
  plateNormalized: string;
  countryCode: string;
  isActive: boolean;
}

export const api = {
  me: (): Promise<MeResponse> =>
    request('/api/me'),

  getEmployees: (): Promise<EmployeeResponse[]> =>
    request('/api/employees'),

  getMyPlates: (): Promise<PlateResponse[]> =>
    request('/api/plates/my'),

  registerPlate: (plateNumber: string): Promise<PlateResponse> =>
    request('/api/plates/register', {
      method: 'POST',
      body: JSON.stringify({ plateNumber }),
    }),

  syncBamboo: (): Promise<{ ok: boolean; result: { inserted: number; updated: number; linked: number; deactivated: number } }> =>
    request('/api/admin/sync-bamboo', { method: 'POST' }, 30_000),

  lookupPlate: (plateNumber: string): Promise<{
    found: boolean;
    owner?: { displayName: string; phone: string; discordId: string; department: string };
  }> =>
    request('/api/plates/lookup', {
      method: 'POST',
      body: JSON.stringify({ plateNumber }),
    }),
};
