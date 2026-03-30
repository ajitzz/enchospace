import { User } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey;

const ACCESS_TOKEN_KEY = 'supabase_access_token';
const REFRESH_TOKEN_KEY = 'supabase_refresh_token';

const getAccessToken = () => (typeof window !== 'undefined' ? localStorage.getItem(ACCESS_TOKEN_KEY) : null);

const captureAuthFromUrl = () => {
  if (typeof window === 'undefined') return;
  if (!window.location.hash.includes('access_token=')) return;

  const hash = new URLSearchParams(window.location.hash.slice(1));
  const accessToken = hash.get('access_token');
  const refreshToken = hash.get('refresh_token');

  if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);

  window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
};

captureAuthFromUrl();

const buildHeaders = (preferRepresentation = false) => {
  const token = getAccessToken();
  return {
    apikey: supabaseAnonKey || '',
    Authorization: `Bearer ${token || supabaseAnonKey || ''}`,
    'Content-Type': 'application/json',
    ...(preferRepresentation ? { Prefer: 'return=representation' } : {}),
  };
};

const restRequest = async (path: string, init: RequestInit = {}) => {
  if (!isSupabaseConfigured || !supabaseUrl) throw new Error('Supabase is not configured.');

  const response = await fetch(`${supabaseUrl}${path}`, {
    ...init,
    headers: {
      ...buildHeaders(),
      ...(init.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Supabase request failed: ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export const loginWithGoogle = async () => {
  if (!isSupabaseConfigured || !supabaseUrl) {
    throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  const redirectTo = encodeURIComponent(window.location.origin);
  window.location.href = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${redirectTo}`;
};

export const logout = async () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

export const getAuthUser = async () => {
  if (!isSupabaseConfigured || !supabaseUrl || !getAccessToken()) return null;

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: buildHeaders(),
  });

  if (!response.ok) return null;
  return response.json();
};

export async function getOrCreateUserProfile(authUser: any): Promise<User | null> {
  if (!authUser) return null;

  const existing = await restRequest(`/rest/v1/users?uid=eq.${encodeURIComponent(authUser.id)}&select=*`);
  if (Array.isArray(existing) && existing.length > 0) {
    return existing[0] as User;
  }

  const profile: User = {
    uid: authUser.id,
    email: authUser.email ?? '',
    displayName: authUser.user_metadata?.full_name ?? authUser.user_metadata?.name ?? null,
    photoURL: authUser.user_metadata?.avatar_url ?? null,
    role: 'user',
    favorites: [],
    createdAt: new Date().toISOString(),
  };

  await restRequest('/rest/v1/users', {
    method: 'POST',
    headers: buildHeaders(true),
    body: JSON.stringify([profile]),
  });

  return profile;
}

export const fetchRows = async (table: string, query = 'select=*') =>
  restRequest(`/rest/v1/${table}?${query}`);

export const insertRow = async (table: string, payload: Record<string, unknown>) =>
  restRequest(`/rest/v1/${table}`, {
    method: 'POST',
    headers: buildHeaders(true),
    body: JSON.stringify([payload]),
  });

export const updateRows = async (table: string, filter: string, payload: Record<string, unknown>) =>
  restRequest(`/rest/v1/${table}?${filter}`, {
    method: 'PATCH',
    headers: buildHeaders(true),
    body: JSON.stringify(payload),
  });

export const deleteRows = async (table: string, filter: string) =>
  restRequest(`/rest/v1/${table}?${filter}`, {
    method: 'DELETE',
  });

export function handleDbError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
  };
  console.error('Supabase Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
