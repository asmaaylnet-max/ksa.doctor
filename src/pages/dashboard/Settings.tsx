import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Globe, KeyRound, Loader2, LogOut, Moon, ShieldCheck, Sun, Trash2 } from 'lucide-react';
import type { UserPrivate } from '../../../shared/types';
import { useI18n } from '../../i18n';
import { useAuth } from '../../lib/auth';
import { useTheme } from '../../lib/theme';
import { useConsent } from '../../lib/consent';
import { useToast } from '../../lib/toast';
import { api, ApiError, getErrorMessage } from '../../lib/api';
import { deriveProof } from '../../../shared/auth';
import { StatusBadge } from '../../components/StatusBadge';

export function Settings({ user }: { user: UserPrivate }) {
  const { t, lang, setLang, formatDate } = useI18n();
  const { setUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { openSettings } = useConsent();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [changing, setChanging] = useState(false);
  const [errors, setErrors] = useState<Record<string, string> | undefined>();

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors(undefined);
    if (newPassword.length < 8) {
      setErrors({ newPassword: 'password_min' });
      return;
    }
    if (newPassword !== confirm) {
      setErrors({ confirm: 'password_mismatch' });
      return;
    }
    setChanging(true);
    try {
      const [currentProof, newProof] = await Promise.all([
        deriveProof(currentPassword, user.email),
        deriveProof(newPassword, user.email)
      ]);
      await api('/auth/change-password', { method: 'POST', body: JSON.stringify({ currentProof, newProof }) });
      setCurrentPassword('');
      setNewPassword('');
      setConfirm('');
      toast(t('dash.passwordChanged'), 'success');
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.fields);
      toast(getErrorMessage(err, t), 'error');
    } finally {
      setChanging(false);
    }
  };

  const doLogout = async () => {
    await logout();
    setUser(null);
    navigate('/', { replace: true });
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold sm:text-3xl">{t('common.settings')}</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>{t('dash.accountInfo')}</p>
      </div>

      <section className="card p-5">
        <h2 className="text-base font-extrabold">{t('dash.accountInfo')}</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-xl border p-3" style={{ borderColor: 'var(--line)' }}><dt className="text-xs" style={{ color: 'var(--muted)' }}>{t('dash.emailReadonly')}</dt><dd className="mt-1 truncate font-bold" dir="ltr">{user.email}</dd></div>
          <div className="rounded-xl border p-3" style={{ borderColor: 'var(--line)' }}><dt className="text-xs" style={{ color: 'var(--muted)' }}>{t('dash.memberNo')}</dt><dd className="mt-1 font-bold">{user.memberNo}</dd></div>
          <div className="rounded-xl border p-3" style={{ borderColor: 'var(--line)' }}><dt className="text-xs" style={{ color: 'var(--muted)' }}>{t('dash.joinedAt')}</dt><dd className="mt-1 font-bold">{formatDate(user.createdAt)}</dd></div>
          <div className="rounded-xl border p-3" style={{ borderColor: 'var(--line)' }}><dt className="text-xs" style={{ color: 'var(--muted)' }}>{t('dash.status')}</dt><dd className="mt-1"><StatusBadge status={user.status} /></dd></div>
        </dl>
      </section>

      <section className="card p-5">
        <h2 className="text-base font-extrabold">{t('dash.languagePref')} · {t('dash.themePref')}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-xl border p-3" style={{ borderColor: 'var(--line)' }}>
            <Globe size={18} style={{ color: 'var(--brand)' }} />
            <div className="min-w-0 flex-1"><p className="text-sm font-bold">{t('common.language')}</p><p className="text-xs" style={{ color: 'var(--muted)' }}>{lang === 'ar' ? 'العربية' : 'English'}</p></div>
            <div className="flex rounded-lg border p-0.5" style={{ borderColor: 'var(--line)' }}>
              <button className={`rounded-md px-2.5 py-1 text-xs font-bold ${lang === 'ar' ? 'bg-[var(--brand)] text-white' : ''}`} onClick={() => setLang('ar')}>العربية</button>
              <button className={`rounded-md px-2.5 py-1 text-xs font-bold ${lang === 'en' ? 'bg-[var(--brand)] text-white' : ''}`} onClick={() => setLang('en')}>EN</button>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border p-3" style={{ borderColor: 'var(--line)' }}>
            {theme === 'dark' ? <Moon size={18} style={{ color: 'var(--gold)' }} /> : <Sun size={18} style={{ color: 'var(--gold)' }} />}
            <div className="min-w-0 flex-1"><p className="text-sm font-bold">{t('common.theme')}</p><p className="text-xs" style={{ color: 'var(--muted)' }}>{theme === 'dark' ? t('common.dark') : t('common.light')}</p></div>
            <button className="btn btn-ghost btn-sm" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? t('common.light') : t('common.dark')}</button>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border p-3" style={{ borderColor: 'var(--line)' }}>
          <div><p className="text-sm font-bold">{t('dash.cookiePrefs')}</p><p className="text-xs" style={{ color: 'var(--muted)' }}>{t('dash.cookiePrefsSub')}</p></div>
          <button className="btn btn-ghost btn-sm shrink-0" onClick={openSettings}>{t('common.cookieSettings')}</button>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="flex items-center gap-2 text-base font-extrabold"><KeyRound size={17} style={{ color: 'var(--brand)' }} /> {t('dash.changePassword')}</h2>
        <form onSubmit={changePassword} className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="block"><span className="field-label">{t('dash.currentPassword')}</span><input className="input" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" dir="ltr" aria-invalid={!!errors?.currentPassword} />{errors?.currentPassword && <span className="field-error">{t('err.invalid_password')}</span>}</label>
          <label className="block"><span className="field-label">{t('dash.newPassword')}</span><input className="input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" dir="ltr" aria-invalid={!!errors?.newPassword} />{errors?.newPassword && <span className="field-error">{t('err.password_min')}</span>}</label>
          <label className="block"><span className="field-label">{t('auth.confirmPassword')}</span><input className="input" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" dir="ltr" aria-invalid={!!errors?.confirm} />{errors?.confirm && <span className="field-error">{t('auth.passwordHint')}</span>}</label>
          <div className="sm:col-span-3"><button className="btn btn-primary" disabled={changing}>{changing ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />} {t('dash.changePassword')}</button></div>
        </form>
      </section>

      <section className="card p-5">
        <h2 className="text-base font-extrabold">{t('dash.exportData')}</h2>
        <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>{t('dash.exportSub')}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a href="/api/me/export" className="btn btn-ghost btn-sm" download><Download size={15} /> {t('dash.exportData')}</a>
          <button className="btn btn-ghost btn-sm text-[var(--danger)]" onClick={doLogout}><LogOut size={15} /> {t('common.logout')}</button>
        </div>
      </section>

      <section className="rounded-2xl border p-5" style={{ borderColor: 'var(--danger)', background: 'var(--danger-soft)' }}>
        <h2 className="flex items-center gap-2 text-base font-extrabold" style={{ color: 'var(--danger)' }}><Trash2 size={17} /> {t('dash.dangerZone')}</h2>
        <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{t('dash.contactSupport')}</p>
        <a href="mailto:hello@ksa.doctor" className="btn btn-danger btn-sm mt-3">{t('common.contact')}</a>
      </section>
    </div>
  );
}
