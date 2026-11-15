import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ar, type TranslationKey } from './ar';
import { en } from './en';

export type Lang = 'ar' | 'en';

interface I18nValue {
  lang: Lang;
  dir: 'rtl' | 'ltr';
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  t: (key: TranslationKey | string, vars?: Record<string, string | number>) => string;
  pick: (arValue: string, enValue: string) => string;
  formatNumber: (value: number) => string;
  formatDate: (iso: string | null | undefined, withTime?: boolean) => string;
}

const I18nContext = createContext<I18nValue | null>(null);
const dicts = { ar, en };

function initialLang(): Lang {
  try {
    const url = new URL(window.location.href);
    const q = url.searchParams.get('lang');
    if (q === 'en' || q === 'ar') return q;
    const stored = localStorage.getItem('ksd_lang');
    if (stored === 'en' || stored === 'ar') return stored;
  } catch {
    /* ignore */
  }
  // Arabic-first platform: English remains one tap away and is stored per visitor.
  return 'ar';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  useEffect(() => {
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    try {
      localStorage.setItem('ksd_lang', lang);
    } catch {
      /* ignore */
    }
  }, [lang]);

  const setLang = useCallback((next: Lang) => setLangState(next), []);
  const toggleLang = useCallback(() => setLangState((prev) => (prev === 'ar' ? 'en' : 'ar')), []);

  const t = useCallback(
    (key: TranslationKey | string, vars?: Record<string, string | number>) => {
      const dict = dicts[lang] as Record<string, string>;
      let text = dict[key] || (ar as Record<string, string>)[key] || key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) text = text.replaceAll(`{${k}}`, String(v));
      }
      return text;
    },
    [lang]
  );

  const pick = useCallback(
    (arValue: string, enValue: string) => {
      const primary = lang === 'ar' ? arValue : enValue;
      const secondary = lang === 'ar' ? enValue : arValue;
      return primary?.trim() || secondary?.trim() || '';
    },
    [lang]
  );

  const formatNumber = useCallback(
    (value: number) => new Intl.NumberFormat(lang === 'ar' ? 'ar-SA-u-nu-latn' : 'en-US').format(value || 0),
    [lang]
  );

  const formatDate = useCallback(
    (iso: string | null | undefined, withTime = false) => {
      if (!iso) return '—';
      const date = new Date(iso.includes('T') || iso.includes('Z') ? iso : `${iso.replace(' ', 'T')}Z`);
      if (Number.isNaN(date.getTime())) return '—';
      return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {})
      }).format(date);
    },
    [lang]
  );

  const value = useMemo<I18nValue>(
    () => ({ lang, dir: lang === 'ar' ? 'rtl' : 'ltr', setLang, toggleLang, t, pick, formatNumber, formatDate }),
    [lang, setLang, toggleLang, t, pick, formatNumber, formatDate]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

export type { TranslationKey };
