import { getStoredSession } from './auth';

const BASE_URL = __DEV__ ? 'http://localhost:3000' : 'https://api.foothillpark.internal';

async function authHeaders(): Promise<Record<string, string>> {
  const session = await getStoredSession();
  if (!session) throw new Error('Not authenticated');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.accessToken}`,
  };
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = await authHeaders();
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${path} failed (${res.status}): ${body}`);
  }
  return res.json();
}

export interface MeResponse {
  entraId: string;
  displayName: string;
  email: string;
  hasPlate: boolean;
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

  getMyPlates: (): Promise<PlateResponse[]> =>
    request('/api/plates/my'),

  registerPlate: (plateNumber: string): Promise<PlateResponse> =>
    request('/api/plates/register', {
      method: 'POST',
      body: JSON.stringify({ plateNumber }),
    }),

  lookupPlate: (plateNumber: string): Promise<{
    found: boolean;
    owner?: { displayName: string; phone: string; discordId: string; department: string };
  }> =>
    request('/api/plates/lookup', {
      method: 'POST',
      body: JSON.stringify({ plateNumber }),
    }),
};
