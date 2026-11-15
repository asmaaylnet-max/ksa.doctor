import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BarChart3, Cookie, Lock, Settings2 } from 'lucide-react';
import { useConsent } from '../lib/consent';
import { useI18n } from '../i18n';
import { useToast } from '../lib/toast';
import { Modal } from './Modal';

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-60 ${checked ? 'bg-[var(--brand)]' : 'bg-[var(--line-strong)]'}`}
    >
      <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'start-6' : 'start-1'}`} />
    </button>
  );
}

export function CookieConsent() {
  const { consent, showBanner, settingsOpen, openSettings, closeSettings, save } = useConsent();
  const { t } = useI18n();
  const { toast } = useToast();
  const { pathname } = useLocation();
  const [prefs, setPrefs] = useState({ preferences: true, analytics: false });

  useEffect(() => {
    if (settingsOpen) setPrefs({ preferences: consent?.preferences ?? true, analytics: consent?.analytics ?? false });
  }, [settingsOpen, consent]);

  const persist = (value: { preferences: boolean; analytics: boolean }) => {
    save(value);
    toast(t('legal.cookieSaved'));
  };

  // Never cover sign-in and registration forms on small screens.
  if (/^\/(login|join|forgot|reset)(\/|$)/.test(pathname)) return null;

  return (
    <>
      {showBanner && (
        <div className="fixed inset-x-0 bottom-0 z-[95] p-2.5 sm:p-4">
          <div className="mx-auto flex max-w-3xl items-center gap-2.5 rounded-2xl border p-2.5 shadow-2xl backdrop-blur-xl sm:gap-4 sm:p-4" style={{ background: 'var(--glass)', borderColor: 'var(--line-strong)' }}>
            <span className="hidden h-10 w-10 shrink-0 place-items-center rounded-xl sm:grid" style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}>
              <Cookie size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-[12px] font-extrabold sm:text-sm">{t('legal.cookieBannerTitle')}</h2>
              <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug sm:text-xs" style={{ color: 'var(--muted)' }}>
                {t('legal.cookieBannerBody')}{' '}
                <Link to="/privacy" className="link">{t('common.privacy')}</Link>
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <button className="btn btn-ghost btn-sm hidden px-2.5 text-[11px] sm:inline-flex" onClick={() => persist({ preferences: false, analytics: false })}>
                {t('legal.cookieRejectAll')}
              </button>
              <button className="btn btn-ghost btn-sm px-2 text-[11px]" onClick={openSettings}>
                <Settings2 size={14} /> {t('legal.cookieCustomize')}
              </button>
              <button className="btn btn-primary btn-sm px-2.5 text-[11px]" onClick={() => persist({ preferences: true, analytics: true })}>
                {t('legal.cookieAcceptAll')}
              </button>
            </div>
          </div>
        </div>
      )}

      <Modal open={settingsOpen} onClose={closeSettings} title={t('legal.cookieSettingsTitle')} subtitle={t('legal.cookieSettingsSub')} size="md">
        <div className="space-y-3">
          <div className="flex items-start gap-3 rounded-2xl border p-4" style={{ borderColor: 'var(--line)', background: 'var(--surface-2)' }}>
            <Lock size={18} className="mt-1 shrink-0" style={{ color: 'var(--brand)' }} />
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold">{t('legal.cookieNecessary')}</h3>
              <p className="mt-0.5 text-xs" style={{ color: 'var(--muted)' }}>{t('legal.cookieNecessaryBody')}</p>
            </div>
            <Toggle checked disabled onChange={() => undefined} />
          </div>
          <div className="flex items-start gap-3 rounded-2xl border p-4" style={{ borderColor: 'var(--line)' }}>
            <Settings2 size={18} className="mt-1 shrink-0" style={{ color: 'var(--gold)' }} />
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold">{t('legal.cookiePreferences')}</h3>
              <p className="mt-0.5 text-xs" style={{ color: 'var(--muted)' }}>{t('legal.cookiePreferencesBody')}</p>
            </div>
            <Toggle checked={prefs.preferences} onChange={(v) => setPrefs((p) => ({ ...p, preferences: v }))} />
          </div>
          <div className="flex items-start gap-3 rounded-2xl border p-4" style={{ borderColor: 'var(--line)' }}>
            <BarChart3 size={18} className="mt-1 shrink-0" style={{ color: 'var(--brand)' }} />
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold">{t('legal.cookieAnalytics')}</h3>
              <p className="mt-0.5 text-xs" style={{ color: 'var(--muted)' }}>{t('legal.cookieAnalyticsBody')}</p>
            </div>
            <Toggle checked={prefs.analytics} onChange={(v) => setPrefs((p) => ({ ...p, analytics: v }))} />
          </div>
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button className="btn btn-ghost btn-sm" onClick={closeSettings}>{t('common.cancel')}</button>
          <button className="btn btn-primary btn-sm" onClick={() => persist(prefs)}>{t('legal.cookieSave')}</button>
        </div>
      </Modal>
    </>
  );
}
