import { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowUpRight,
  Eye,
  Images,
  LayoutDashboard,
  Link2,
  QrCode,
  Settings as SettingsIcon,
  ShieldCheck,
  Sparkles,
  UserRoundPen
} from 'lucide-react';
import type { UserPrivate } from '../../../shared/types';
import { useAuth } from '../../lib/auth';
import { useI18n } from '../../i18n';
import { useToast } from '../../lib/toast';
import { avatarUrl } from '../../lib/media';
import { BrandMark } from '../../components/Brand';
import { StatusBadge } from '../../components/StatusBadge';
import { Overview } from './Overview';
import { ProfileEditor } from './ProfileEditor';
import { MediaEditor } from './MediaEditor';
import { LinksEditor } from './LinksEditor';
import { ShareCenter } from './ShareCenter';
import { Settings } from './Settings';

const TABS = [
  { key: 'overview', label: 'dash.overview', Icon: LayoutDashboard },
  { key: 'profile', label: 'dash.myProfile', Icon: UserRoundPen },
  { key: 'media', label: 'dash.media', Icon: Images },
  { key: 'links', label: 'dash.links', Icon: Link2 },
  { key: 'share', label: 'dash.share', Icon: QrCode },
  { key: 'settings', label: 'common.settings', Icon: SettingsIcon }
] as const;

type TabKey = (typeof TABS)[number]['key'];

export default function Dashboard() {
  const { user, loading, setUser } = useAuth();
  const { t, pick, formatNumber } = useI18n();
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const tabParam = params.get('tab') as TabKey | null;
  const tab: TabKey = TABS.some((item) => item.key === tabParam) ? (tabParam as TabKey) : 'overview';
  const welcomeShown = useRef(false);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<UserPrivate>).detail;
      if (detail) setUser(detail);
    };
    window.addEventListener('ksd:user-updated', handler);
    return () => window.removeEventListener('ksd:user-updated', handler);
  }, [setUser]);

  useEffect(() => {
    if (params.get('welcome') === '1' && !welcomeShown.current) {
      welcomeShown.current = true;
      toast(t('auth.welcome'), 'success');
      const next = new URLSearchParams(params);
      next.delete('welcome');
      setParams(next, { replace: true });
    }
  }, [params, setParams, t, toast]);

  const goTab = (key: string) => {
    const next = new URLSearchParams(params);
    if (key === 'overview') next.delete('tab');
    else next.set('tab', key);
    next.delete('welcome');
    setParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return <div className="container-page py-10"><div className="skeleton h-[70dvh] w-full !rounded-[28px]" /></div>;
  }
  if (!user) return null;

  const name = pick(user.fullNameAr, user.fullNameEn);

  const content = {
    overview: <Overview user={user} onTab={goTab} />,
    profile: <ProfileEditor user={user} setUser={setUser} />,
    media: <MediaEditor user={user} setUser={setUser} />,
    links: <LinksEditor user={user} setUser={setUser} />,
    share: <ShareCenter user={user} />,
    settings: <Settings user={user} />
  }[tab];

  return (
    <div className="min-h-[100dvh]" style={{ background: 'var(--bg)' }}>
      <header className="sticky top-0 z-40 border-b backdrop-blur-xl" style={{ borderColor: 'var(--line)', background: 'var(--glass)' }}>
        <div className="container-page flex h-16 items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <BrandMark />
            <span className="hidden h-5 w-px sm:block" style={{ background: 'var(--line-strong)' }} />
            <span className="hidden text-xs font-bold sm:inline" style={{ color: 'var(--muted)' }}>{t('common.dashboard')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {user.role === 'admin' && (
              <Link to="/admin" className="btn btn-ghost btn-sm hidden sm:inline-flex"><ShieldCheck size={15} /> {t('nav.admin')}</Link>
            )}
            {user.visible && user.status === 'approved' && (
              <Link to={`/${user.handle}`} target="_blank" className="icon-btn h-10 w-10" aria-label={t('dash.viewProfile')}><Eye size={17} /></Link>
            )}
            <button onClick={() => goTab('settings')} className="ms-1 flex items-center gap-2 rounded-full border p-1 pe-3 transition-colors hover:bg-[var(--surface-2)]" style={{ borderColor: 'var(--line)' }}>
              <img src={avatarUrl(user.avatarKey)} alt="" className="h-8 w-8 rounded-full object-cover" />
              <span className="hidden max-w-24 truncate text-xs font-bold sm:block">{name}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="container-page grid gap-6 py-5 pb-[calc(env(safe-area-inset-bottom,0px)+92px)] lg:grid-cols-[236px_minmax(0,1fr)] lg:py-7 lg:pb-10">
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <div className="card overflow-hidden">
              <div className="h-16" style={{ background: 'linear-gradient(135deg,#043824,#065c3b)' }} />
              <div className="px-4 pb-4 text-center">
                <img src={avatarUrl(user.avatarKey)} alt="" className="-mt-8 h-16 w-16 rounded-2xl border-4 object-cover" style={{ borderColor: 'var(--surface)' }} />
                <h2 className="mt-2 truncate text-sm font-extrabold">{name}</h2>
                <p className="truncate text-[11px]" dir="ltr" style={{ color: 'var(--muted)' }}>ksa.doctor/{user.handle}</p>
                <div className="mt-2 flex justify-center"><StatusBadge status={user.status} /></div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--line)' }}>
                  <div className="h-full rounded-full" style={{ width: `${user.profileCompletion || 0}%`, background: 'linear-gradient(90deg,var(--brand),var(--gold))' }} />
                </div>
                <p className="mt-1 text-[10px]" style={{ color: 'var(--muted-2)' }}>{t('dash.completion')} {formatNumber(user.profileCompletion || 0)}%</p>
              </div>
              <nav className="border-t p-2" style={{ borderColor: 'var(--line)' }}>
                {TABS.map(({ key, label, Icon }) => (
                  <button key={key} onClick={() => goTab(key)} className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors ${tab === key ? 'font-extrabold text-white' : 'font-medium hover:bg-[var(--surface-2)]'}`} style={tab === key ? { background: 'var(--brand)' } : undefined}>
                    <Icon size={17} />
                    {t(label)}
                    {tab === key && <span className="ms-auto h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />}
                  </button>
                ))}
              </nav>
            </div>
            <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--line)', background: 'var(--surface-2)' }}>
              <p className="flex items-center gap-1.5 text-xs font-extrabold"><Sparkles size={14} style={{ color: 'var(--gold)' }} /> {t('app.slogan')}</p>
              <p className="mt-1 text-[11px] leading-relaxed" style={{ color: 'var(--muted)' }}>{t('home.joinSub')}</p>
              {user.visible && user.status === 'approved' && (
                <Link to={`/${user.handle}`} target="_blank" className="mt-2 inline-flex items-center gap-1 text-xs font-bold" style={{ color: 'var(--brand)' }}>{t('dash.viewProfile')} <ArrowUpRight size={13} /></Link>
              )}
            </div>
            {user.role === 'admin' && (
              <Link to="/admin" className="card flex items-center gap-2 p-3 text-sm font-bold" style={{ color: 'var(--brand)' }}><ShieldCheck size={17} /> {t('common.adminPanel')}</Link>
            )}
          </div>
        </aside>

        <main key={tab} className="min-w-0 animate-fade-up">{content}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t backdrop-blur-xl lg:hidden" style={{ borderColor: 'var(--line)', background: 'var(--glass)', paddingBottom: 'env(safe-area-inset-bottom,0px)' }}>
        <div className="grid grid-cols-6">
          {TABS.map(({ key, label, Icon }) => (
            <button key={key} onClick={() => goTab(key)} className="flex flex-col items-center gap-0.5 py-2.5 text-[9px] font-bold" style={{ color: tab === key ? 'var(--brand)' : 'var(--muted-2)' }}>
              <span className={`grid h-8 w-10 place-items-center rounded-xl ${tab === key ? 'bg-[var(--brand-soft)]' : ''}`}><Icon size={18} /></span>
              <span className="truncate">{t(label)}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
