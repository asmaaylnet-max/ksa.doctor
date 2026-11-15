import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  Download,
  Globe,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Shield,
  Sun,
  UserRound,
  X
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useI18n } from '../i18n';
import { useTheme } from '../lib/theme';
import { avatarUrl } from '../lib/media';
import { isInstalled, openInstallModal } from '../lib/install';
import { BrandMark } from './Brand';

const navItems = [
  { to: '/', key: 'nav.home', end: true },
  { to: '/search', key: 'nav.search', end: false },
  { to: '/join', key: 'nav.join', end: false }
] as const;

export function Header() {
  const { t, lang, toggleLang, pick } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setAccountOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setAccountOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const onLogout = async () => {
    await logout();
    navigate('/');
  };

  const displayName = user ? pick(user.fullNameAr, user.fullNameEn) : '';

  return (
    <>
      <header
        className={`sticky top-0 z-50 glass transition-shadow ${scrolled ? 'shadow-[0_10px_30px_-20px_rgba(0,0,0,.45)]' : ''}`}
      >
        <div className="container-wide flex h-[68px] items-center justify-between gap-3">
          <BrandMark />

          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm font-bold transition-colors ${isActive ? 'text-[var(--brand)]' : 'hover:text-[var(--brand)]'}`
                }
                style={({ isActive }) => (isActive ? { background: 'var(--brand-soft)' } : undefined)}
              >
                {t(item.key)}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              className="icon-btn h-10 w-10 text-xs font-extrabold"
              onClick={toggleLang}
              aria-label={lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
              title={t('common.language')}
            >
              <Globe size={15} className="sm:hidden" />
              <span className="hidden sm:inline">{lang === 'ar' ? 'EN' : 'ع'}</span>
            </button>
            <button className="icon-btn h-10 w-10" onClick={toggleTheme} aria-label={t('common.theme')} title={t('common.theme')}>
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {!isInstalled() && (
              <button className="icon-btn hidden h-10 w-10 sm:inline-flex" onClick={openInstallModal} aria-label={t('common.installApp')} title={t('common.installApp')}>
                <Download size={18} />
              </button>
            )}

            {user ? (
              <div className="relative hidden md:block" ref={accountRef}>
                <button
                  onClick={() => setAccountOpen((prev) => !prev)}
                  className="flex items-center gap-2 rounded-full border py-1 pe-3 ps-1 transition-colors hover:bg-[var(--surface-2)]"
                  style={{ borderColor: 'var(--line)' }}
                  aria-expanded={accountOpen}
                  aria-haspopup="menu"
                >
                  <img src={avatarUrl(user.avatarKey)} alt="" className="h-8 w-8 rounded-full object-cover" />
                  <span className="max-w-[120px] truncate text-xs font-bold">{displayName}</span>
                  <ChevronDown size={14} className={`transition-transform ${accountOpen ? 'rotate-180' : ''}`} />
                </button>
                {accountOpen && (
                  <div className="absolute end-0 top-[calc(100%+10px)] w-64 overflow-hidden rounded-2xl border p-1.5 shadow-2xl" style={{ background: 'var(--surface)', borderColor: 'var(--line-strong)' }} role="menu">
                    <div className="border-b px-3 py-2.5" style={{ borderColor: 'var(--line)' }}>
                      <div className="truncate text-sm font-bold">{displayName}</div>
                      <div className="truncate text-xs" style={{ color: 'var(--muted)' }}>ksa.doctor/{user.handle}</div>
                    </div>
                    <Link to="/dashboard" className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-[var(--surface-2)]" role="menuitem">
                      <LayoutDashboard size={17} /> {t('common.dashboard')}
                    </Link>
                    <Link to={`/${user.handle}`} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-[var(--surface-2)]" role="menuitem">
                      <UserRound size={17} /> {t('dash.viewProfile')}
                    </Link>
                    {user.role === 'admin' && (
                      <Link to="/admin" className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-[var(--surface-2)]" role="menuitem">
                        <Shield size={17} /> {t('common.adminPanel')}
                      </Link>
                    )}
                    <button onClick={onLogout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--danger)] hover:bg-[var(--danger-soft)]" role="menuitem">
                      <LogOut size={17} /> {t('common.logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden items-center gap-2 md:flex">
                <Link to="/login" className="btn btn-ghost btn-sm">{t('nav.login')}</Link>
                <Link to="/join" className="btn btn-primary btn-sm">{t('nav.join')}</Link>
              </div>
            )}

            <button className="icon-btn h-10 w-10 md:hidden" onClick={() => setMenuOpen(true)} aria-label={t('common.menu')}>
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 end-0 flex w-[88%] max-w-sm flex-col border-s shadow-2xl animate-[fadeUp_.25s_ease-out]" style={{ background: 'var(--surface)', borderColor: 'var(--line)' }}>
            <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: 'var(--line)' }}>
              <BrandMark />
              <button className="icon-btn h-10 w-10" onClick={() => setMenuOpen(false)} aria-label={t('common.close')}>
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-6">
              {user && (
                <Link to="/dashboard" className="mb-6 flex items-center gap-3 rounded-2xl border p-3" style={{ borderColor: 'var(--line)', background: 'var(--surface-2)' }}>
                  <img src={avatarUrl(user.avatarKey)} alt="" className="h-11 w-11 rounded-full object-cover" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-extrabold">{displayName}</span>
                    <span className="block truncate text-xs" style={{ color: 'var(--muted)' }}>ksa.doctor/{user.handle}</span>
                  </span>
                </Link>
              )}
              <nav className="flex flex-col gap-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) => `rounded-2xl px-4 py-3 text-base font-bold ${isActive ? 'text-[var(--brand)]' : ''}`}
                    style={({ isActive }) => (isActive ? { background: 'var(--brand-soft)' } : undefined)}
                  >
                    {t(item.key)}
                  </NavLink>
                ))}
                {user && (
                  <>
                    <NavLink to="/dashboard" className="rounded-2xl px-4 py-3 text-base font-bold hover:bg-[var(--surface-2)]">{t('common.dashboard')}</NavLink>
                    <NavLink to={`/${user.handle}`} className="rounded-2xl px-4 py-3 text-base font-bold hover:bg-[var(--surface-2)]">{t('dash.viewProfile')}</NavLink>
                    {user.role === 'admin' && (
                      <NavLink to="/admin" className="rounded-2xl px-4 py-3 text-base font-bold hover:bg-[var(--surface-2)]">{t('common.adminPanel')}</NavLink>
                    )}
                  </>
                )}
              </nav>

              <div className="my-5 divider" />
              <div className="grid grid-cols-2 gap-2">
                <button onClick={toggleLang} className="btn btn-ghost btn-sm justify-start">
                  <Globe size={16} /> {lang === 'ar' ? 'English' : 'العربية'}
                </button>
                <button onClick={toggleTheme} className="btn btn-ghost btn-sm justify-start">
                  {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />} {theme === 'dark' ? t('common.light') : t('common.dark')}
                </button>
              </div>
              {!isInstalled() && (
                <button onClick={() => { setMenuOpen(false); openInstallModal(); }} className="btn btn-soft mt-2 w-full justify-start">
                  <Download size={17} /> {t('common.installApp')}
                </button>
              )}
            </div>
            <div className="safe-bottom border-t p-5" style={{ borderColor: 'var(--line)' }}>
              {user ? (
                <button onClick={onLogout} className="btn btn-ghost w-full text-[var(--danger)]">
                  <LogOut size={18} /> {t('common.logout')}
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link to="/login" className="btn btn-ghost">{t('nav.login')}</Link>
                  <Link to="/join" className="btn btn-primary">{t('nav.join')}</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
