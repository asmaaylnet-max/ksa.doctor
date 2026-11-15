import { Link } from 'react-router-dom';
import { Download, Mail, ShieldCheck } from 'lucide-react';
import { useI18n } from '../i18n';
import { openInstallModal } from '../lib/install';
import { BrandMark } from './Brand';

export function Footer() {
  const { t } = useI18n();
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t" style={{ borderColor: 'var(--line)', background: 'color-mix(in srgb, var(--surface) 45%, transparent)' }}>
      <div className="container-page py-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <BrandMark />
            <p className="mt-4 max-w-sm text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
              {t('home.subtitle')}
            </p>
            <p className="mt-3 text-sm font-bold" style={{ color: 'var(--gold)' }}>{t('app.slogan')}</p>
            <button onClick={openInstallModal} className="btn btn-soft btn-sm mt-5">
              <Download size={16} /> {t('common.installApp')}
            </button>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-extrabold">{t('nav.home')}</h3>
            <ul className="space-y-2.5 text-sm" style={{ color: 'var(--muted)' }}>
              <li><Link className="hover:text-[var(--brand)]" to="/search">{t('nav.search')}</Link></li>
              <li><Link className="hover:text-[var(--brand)]" to="/join">{t('nav.join')}</Link></li>
              <li><Link className="hover:text-[var(--brand)]" to="/login">{t('nav.login')}</Link></li>
              <li><Link className="hover:text-[var(--brand)]" to="/dashboard">{t('common.dashboard')}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-extrabold">{t('common.settings')}</h3>
            <ul className="space-y-2.5 text-sm" style={{ color: 'var(--muted)' }}>
              <li><Link className="hover:text-[var(--brand)]" to="/terms">{t('common.terms')}</Link></li>
              <li><Link className="hover:text-[var(--brand)]" to="/privacy">{t('common.privacy')}</Link></li>
              <li><Link className="hover:text-[var(--brand)]" to="/cookies">{t('legal.cookiesTitle')}</Link></li>
              <li>
                <a className="inline-flex items-center gap-1.5 hover:text-[var(--brand)]" href="mailto:hello@ksa.doctor">
                  <Mail size={14} /> hello@ksa.doctor
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t pt-6 text-center text-xs sm:flex-row sm:text-start" style={{ borderColor: 'var(--line)', color: 'var(--muted)' }}>
          <span>© {year} {t('app.name')} — {t('common.copyright')}</span>
          <span className="inline-flex items-center gap-2">
            <ShieldCheck size={14} style={{ color: 'var(--brand)' }} /> {t('common.madeIn')}
            <Link to="/admin" className="ms-2 opacity-50 hover:opacity-100" aria-label={t('common.adminPanel')}>•</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
