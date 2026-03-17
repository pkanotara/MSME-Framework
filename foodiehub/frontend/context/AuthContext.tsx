'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type Session = { token: string; role: 'super_admin' | 'restaurant_owner' | 'manager' | null };

const AuthContext = createContext<{
  session: Session;
  setSession: (next: Session) => void;
  logout: () => void;
}>({
  session: { token: '', role: null },
  setSession: () => undefined,
  logout: () => undefined
});

const roleFromToken = (token: string): Session['role'] => {
  try {
    const [, payload] = token.split('.');
    const parsed = JSON.parse(atob(payload));
    return parsed.role ?? null;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<Session>({ token: '', role: null });

  useEffect(() => {
    const token = localStorage.getItem('foodiehub_token') ?? '';
    setSessionState({ token, role: token ? roleFromToken(token) : null });
  }, []);

  const setSession = (next: Session) => {
    if (next.token) localStorage.setItem('foodiehub_token', next.token);
    else localStorage.removeItem('foodiehub_token');
    setSessionState(next);
  };

  const logout = () => setSession({ token: '', role: null });

  const value = useMemo(() => ({ session, setSession, logout }), [session]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuthContext = () => useContext(AuthContext);
