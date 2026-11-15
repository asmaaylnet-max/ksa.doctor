import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { deriveProof } from '../../shared/auth';
import type { UserPrivate } from '../../shared/types';
import { api, ApiError } from './api';
import { useI18n } from '../i18n';

interface AuthValue {
  user: UserPrivate | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setUser: (user: UserPrivate | null) => void;
  login: (email: string, password: string) => Promise<UserPrivate>;
  register: (data: { fullNameAr: string; email: string; handle: string; password: string }) => Promise<UserPrivate>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserPrivate | null>(null);
  const [loading, setLoading] = useState(true);
  const loaded = useRef(false);
  const { lang } = useI18n();

  const refresh = useCallback(async () => {
    try {
      const data = await api<{ user: UserPrivate | null }>('/auth/me');
      setUser(data.user);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const proof = await deriveProof(password, email);
    const data = await api<{ user: UserPrivate }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim().toLowerCase(), proof })
    });
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(
    async (payload: { fullNameAr: string; email: string; handle: string; password: string }) => {
      const email = payload.email.trim().toLowerCase();
      const handle = payload.handle.trim().toLowerCase();
      const proof = await deriveProof(payload.password, email);
      const data = await api<{ user: UserPrivate }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ fullNameAr: payload.fullNameAr, email, handle, proof, locale: lang })
      });
      setUser(data.user);
      return data.user;
    },
    [lang]
  );

  const logout = useCallback(async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch {
      /* clear locally regardless */
    }
    setUser(null);
  }, []);

  const value = useMemo<AuthValue>(
    () => ({ user, loading, refresh, setUser, login, register, logout }),
    [user, loading, refresh, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
