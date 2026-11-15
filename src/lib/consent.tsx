import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from './auth';

export interface ConsentState {
  necessary: true;
  preferences: boolean;
  analytics: boolean;
  version: number;
  ts: string;
}

interface ConsentValue {
  consent: ConsentState | null;
  showBanner: boolean;
  settingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  save: (prefs: { preferences: boolean; analytics: boolean }) => void;
}

const STORAGE_KEY = 'ksd_consent_v1';
const CONSENT_VERSION = 1;
const ConsentContext = createContext<ConsentValue | null>(null);

function load(): ConsentState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentState;
    if (parsed && parsed.version === CONSENT_VERSION && typeof parsed.analytics === 'boolean') return parsed;
  } catch {
    /* ignore */
  }
  return null;
}

export function ConsentProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [consent, setConsent] = useState<ConsentState | null>(() => load());
  const [settingsOpen, setSettingsOpen] = useState(false);

  const save = useCallback((prefs: { preferences: boolean; analytics: boolean }) => {
    const next: ConsentState = {
      necessary: true,
      preferences: prefs.preferences,
      analytics: prefs.analytics,
      version: CONSENT_VERSION,
      ts: new Date().toISOString()
    };
    setConsent(next);
    setSettingsOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    if (user) {
      fetch('/api/me/consent', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ necessary: true, preferences: next.preferences, analytics: next.analytics, version: CONSENT_VERSION })
      }).catch(() => undefined);
    }
  }, [user]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setConsent(load());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const openSettings = useCallback(() => setSettingsOpen(true), []);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);

  const value = useMemo<ConsentValue>(
    () => ({ consent, showBanner: !consent, settingsOpen, openSettings, closeSettings, save }),
    [consent, settingsOpen, openSettings, closeSettings, save]
  );

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useConsent(): ConsentValue {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error('useConsent must be used within ConsentProvider');
  return ctx;
}
