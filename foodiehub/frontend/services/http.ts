import { API_BASE_URL } from '@/lib/api';

export const apiFetch = async <T>(path: string, token: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {})
    }
  });
  if (!response.ok) throw new Error('Request failed');
  return response.json() as Promise<T>;
};
