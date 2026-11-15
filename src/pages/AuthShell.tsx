import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, Globe, Moon, ShieldCheck, Sun } from 'lucide-react';
import { BrandMark } from '../components/Brand';
import { useI18n } from '../i18n';
import { useTheme } from '../lib/theme';

export function AuthShell({
  title,
  subtitle,
  children,
  footer
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const { t, lang, toggleLang } = useI18n();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-[100dvh] lg:grid lg:grid-cols-[1.02fr_1fr]">
      <aside className="relative hidden overflow-hidden p-12 text-white lg:flex lg:flex-col lg:justify-between" style={{ background: 'linear-gradient(150deg,#022c1c,#064b30 58%,#022c1c)' }}>
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "url('/brand/default-cover.webp')", backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,rgba(2,44,28,.55),rgba(2,44,28,.92))' }} />
        <div className="relative">
          <div className="flex items-center gap-3">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-[#f8f4e9] ring-2 ring-[#c8a45c]/60">
              <img src="/brand/emblem.png" alt="" className="h-10 w-10" />
            </span>
            <div>
              <div className="text-lg font-extrabold">{t('app.short')}</div>
              <div className="text-[10px] font-bold uppercase tracking-[.3em]" style={{ color: '#e8cf9a' }}>KSA.DOCTOR</div>
            </div>
          </div>
        </div>
        <div className="relative max-w-md">
          <h2 className="text-4xl font-extrabold leading-tight">{t('app.name')}</h2>
          <p className="mt-3 text-xl font-bold" style={{ color: '#e8cf9a' }}>{t('app.slogan')}</p>
          <p className="mt-4 text-sm leading-relaxed text-white/70">{t('home.subtitle')}</p>
          <ul className="mt-8 space-y-3 text-sm">
            {[t('home.feature1Title'), t('home.feature2Title'), t('home.feature3Title')].map((item, index) => (
              <li key={item} className="flex items-center gap-3">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-white/10">
                  {index === 2 ? <ShieldCheck size={15} /> : <BadgeCheck size={15} />}
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-white/45">© {new Date().getFullYear()} {t('app.name')}</p>
      </aside>

      <main className="flex min-h-[100dvh] flex-col" style={{ background: 'var(--bg)' }}>
        <header className="flex items-center justify-between gap-2 p-4 sm:p-6">
          <BrandMark />
          <div className="flex items-center gap-1.5">
            <button className="icon-btn h-10 w-10" onClick={toggleLang} aria-label={t('common.language')}>
              <Globe size={16} />
            </button>
            <button className="icon-btn h-10 w-10" onClick={toggleTheme} aria-label={t('common.theme')}>
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <Link to="/" className="icon-btn h-10 w-10" aria-label={t('common.backHome')}>
              <ArrowRight size={17} className="rtl:rotate-180" />
            </Link>
          </div>
        </header>
        <div className="flex flex-1 items-center justify-center px-5 pb-12">
          <div className="w-full max-w-md">
            <div className="mb-7 text-center">
              <h1 className="text-2xl font-extrabold sm:text-3xl">{title}</h1>
              {subtitle && <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>{subtitle}</p>}
            </div>
            {children}
            {footer && <div className="mt-6 text-center text-sm">{footer}</div>}
          </div>
        </div>
      </main>
    </div>
  );
}
